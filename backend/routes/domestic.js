import express from 'express'
import { getPool, sql } from '../db/azureSQL.js'
import Redis from 'ioredis'

const router = express.Router()

// ── Redis client ───────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false },
})

redis.on('connect', () => console.log('Redis connected'))
redis.on('error',   (e) => console.error('Redis error:', e.message))

// ── Tiered TTL ─────────────────────────────────────────────────
function getTTL(endpoint, q = {}) {
  if (endpoint === 'filters') return 60 * 60 * 24 * 7   // 7 days
  const currentYear = new Date().getFullYear().toString()
  const touchesCurrentYear =
    q.dateFrom?.startsWith(currentYear) ||
    q.dateTo?.startsWith(currentYear)
  return touchesCurrentYear
    ? 60 * 60          // 1 hour  — current year, data may still arrive
    : 60 * 60 * 24     // 24 hours — past years, data is static
}

async function cacheGet(key) {
  try {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  } catch { return null }
}

async function cacheSet(key, data, ttl) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl)
  } catch (e) {
    console.error('Redis set error:', e.message)
  }
}

// ── Default year guard ─────────────────────────────────────────
function applyDefaultYear(q) {
  if (!q.dateFrom && !q.dateTo) {
    const year = new Date().getFullYear()
    return { ...q, dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` }
  }
  return q
}

// ── Shared helpers ─────────────────────────────────────────────
function buildWhere(q) {
  const conditions = []
  const inputs     = []

  if (q.state)     { conditions.push(`state = @state`);            inputs.push({ name: 'state',     type: sql.NVarChar, value: q.state     }) }
  if (q.district)  { conditions.push(`district = @district`);      inputs.push({ name: 'district',  type: sql.NVarChar, value: q.district  }) }
  if (q.market)    { conditions.push(`market = @market`);          inputs.push({ name: 'market',    type: sql.NVarChar, value: q.market    }) }
  if (q.commodity) { conditions.push(`commodity = @commodity`);    inputs.push({ name: 'commodity', type: sql.NVarChar, value: q.commodity }) }
  if (q.grade)     { conditions.push(`grade = @grade`);            inputs.push({ name: 'grade',     type: sql.NVarChar, value: q.grade     }) }
  if (q.dateFrom)  { conditions.push(`arrival_date >= @dateFrom`); inputs.push({ name: 'dateFrom',  type: sql.Date,     value: q.dateFrom  }) }
  if (q.dateTo)    { conditions.push(`arrival_date <= @dateTo`);   inputs.push({ name: 'dateTo',    type: sql.Date,     value: q.dateTo    }) }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    inputs,
  }
}

async function runQuery(queryStr, inputs) {
  const pool    = await getPool()
  const request = pool.request()
  inputs.forEach(i => request.input(i.name, i.type, i.value))
  const result  = await request.query(queryStr)
  return result.recordset
}

// ── GET /api/domestic/filters ───────────────────────────────────
router.get('/filters', async (req, res) => {
  const cached = await cacheGet('filters')
  if (cached) return res.json(cached)

  try {
    const pool   = await getPool()
    const result = await pool.request().query(`
      SELECT filter_type, filter_value
      FROM mandi_filter_options
      ORDER BY filter_type, filter_value
    `)

    const grouped = { states: [], districts: [], markets: [], commodities: [], grades: [] }
    const map = { state: 'states', district: 'districts', market: 'markets', commodity: 'commodities', grade: 'grades' }

    for (const row of result.recordset) {
      const key = map[row.filter_type]
      if (key) grouped[key].push(row.filter_value)
    }

    await cacheSet('filters', grouped, getTTL('filters'))
    res.json(grouped)
  } catch (err) {
    console.error('filters error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/domestic/overview ──────────────────────────────────
router.get('/overview', async (req, res) => {
  const q        = applyDefaultYear(req.query)
  const cacheKey = `overview:${JSON.stringify(q)}`
  const cached   = await cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const { clause, inputs } = buildWhere(q)

    const [kpi, byState] = await Promise.all([
      runQuery(`
        SELECT
          MIN(min_price)   AS min_price,
          MAX(max_price)   AS max_price,
          AVG(modal_price) AS avg_price
        FROM mandi_prices_backup_rename
        ${clause}
      `, inputs),

      runQuery(`
        SELECT
          state,
          MIN(min_price)   AS min_price,
          MAX(max_price)   AS max_price,
          AVG(modal_price) AS avg_price
        FROM mandi_prices_backup_rename
        ${clause}
        GROUP BY state
        ORDER BY avg_price DESC
      `, inputs),
    ])

    const data = { kpi: kpi[0], byState, appliedDateFrom: q.dateFrom, appliedDateTo: q.dateTo }
    await cacheSet(cacheKey, data, getTTL('overview', q))
    res.json(data)
  } catch (err) {
    console.error('overview error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/domestic/table ─────────────────────────────────────
router.get('/table', async (req, res) => {
  const q        = applyDefaultYear(req.query)
  const page     = parseInt(q.page)     || 1
  const pageSize = parseInt(q.pageSize) || 50
  const offset   = (page - 1) * pageSize
  const cacheKey = `table:${JSON.stringify(q)}:${page}`
  const cached   = await cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const { clause, inputs } = buildWhere(q)

    const [kpi, rows, countResult] = await Promise.all([
      runQuery(`
        SELECT
          MIN(min_price)   AS min_price,
          MAX(max_price)   AS max_price,
          AVG(modal_price) AS avg_price
        FROM mandi_prices_backup_rename
        ${clause}
      `, inputs),

      runQuery(`
        SELECT
          YEAR(arrival_date)            AS year,
          MONTH(arrival_date)           AS month,
          DATENAME(MONTH, arrival_date) AS month_name,
          DAY(arrival_date)             AS day,
          state, district, market, commodity, variety, grade,
          min_price, max_price, modal_price AS avg_modal_price
        FROM mandi_prices_backup_rename
        ${clause}
        ORDER BY arrival_date DESC
        OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
      `, inputs),

      runQuery(`
        SELECT COUNT(*) AS total
        FROM mandi_prices_backup_rename
        ${clause}
      `, inputs),
    ])

    const data = { kpi: kpi[0], rows, total: countResult[0].total, page, pageSize, appliedDateFrom: q.dateFrom, appliedDateTo: q.dateTo }
    await cacheSet(cacheKey, data, getTTL('table', q))
    res.json(data)
  } catch (err) {
    console.error('table error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/domestic/trends ────────────────────────────────────
router.get('/trends', async (req, res) => {
  const q        = applyDefaultYear(req.query)
  const cacheKey = `trends:${JSON.stringify(q)}`
  const cached   = await cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const { clause, inputs } = buildWhere(q)

    const rows = await runQuery(`
      SELECT
        YEAR(arrival_date)            AS year,
        MONTH(arrival_date)           AS month,
        DATENAME(MONTH, arrival_date) AS month_name,
        AVG(modal_price)              AS avg_price,
        MIN(min_price)                AS min_price,
        MAX(max_price)                AS max_price
      FROM mandi_prices_backup_rename
      ${clause}
      GROUP BY
        YEAR(arrival_date),
        MONTH(arrival_date),
        DATENAME(MONTH, arrival_date)
      ORDER BY year, month
    `, inputs)

    const data = { rows, appliedDateFrom: q.dateFrom, appliedDateTo: q.dateTo }
    await cacheSet(cacheKey, data, getTTL('trends', q))
    res.json(data)
  } catch (err) {
    console.error('trends error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/domestic/markets ───────────────────────────────────
router.get('/markets', async (req, res) => {
  const q        = applyDefaultYear(req.query)
  const cacheKey = `markets:${JSON.stringify(q)}`
  const cached   = await cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const { clause, inputs } = buildWhere(q)

    const [kpi, byMarket] = await Promise.all([
      runQuery(`
        SELECT
          MIN(min_price)   AS min_price,
          MAX(max_price)   AS max_price,
          AVG(modal_price) AS avg_price
        FROM mandi_prices_backup_rename
        ${clause}
      `, inputs),

      runQuery(`
        SELECT TOP 30
          market,
          state,
          AVG(modal_price) AS avg_price,
          MIN(min_price)   AS min_price,
          MAX(max_price)   AS max_price
        FROM mandi_prices_backup_rename
        ${clause}
        GROUP BY market, state
        ORDER BY avg_price DESC
      `, inputs),
    ])

    const data = { kpi: kpi[0], byMarket, appliedDateFrom: q.dateFrom, appliedDateTo: q.dateTo }
    await cacheSet(cacheKey, data, getTTL('markets', q))
    res.json(data)
  } catch (err) {
    console.error('markets error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router