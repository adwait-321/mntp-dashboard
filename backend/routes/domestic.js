import express from 'express'
import { getPool, sql } from '../db/azureSQL.js'
import Redis from 'ioredis'

const router = express.Router()

// ── Redis ──────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false },
})
redis.on('connect', () => console.log('Redis connected'))
redis.on('error',   (e) => console.error('Redis error:', e.message))

// ── Cache helpers ──────────────────────────────────────────────
// ── Tiered TTL ─────────────────────────────────────────────────
function getTTL(endpoint, q = {}) {
  if (endpoint === 'filters') return 60 * 60 * 24 * 7  // 7 days

  // Cache expires at midnight IST daily
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const midnight = new Date(ist)
  midnight.setHours(24, 0, 0, 0)
  const secondsUntilMidnight = Math.floor((midnight - ist) / 1000)

  return secondsUntilMidnight
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

// ── WHERE builder ──────────────────────────────────────────────
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

// ── Query runner ───────────────────────────────────────────────
async function runQuery(queryStr, inputs) {
  const pool    = await getPool()
  const request = pool.request()
  inputs.forEach(i => request.input(i.name, i.type, i.value))
  const result  = await request.query(queryStr)
  return result.recordset
}

// ── GET /api/domestic/filters ──────────────────────────────────
router.get('/filters', async (req, res) => {
  const { state, district } = req.query                                    // ← read both
  const cacheKey = `filters:${state || 'all'}:${district || 'all'}`       // ← key includes district

  const cached = await cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const stateInput         = state    ? [{ name: 'state',    type: sql.NVarChar, value: state    }] : []
    const districtInput      = district ? [{ name: 'district', type: sql.NVarChar, value: district }] : []
    const stateDistrictInput = [...stateInput, ...districtInput]

    const stateClause         = state    ? `AND state = @state`       : ''
    const districtClause      = district ? `AND district = @district` : ''
    const stateDistrictClause = `${stateClause} ${districtClause}`

    const [states, districts, markets, commodities, grades] = await Promise.all([
      runQuery(`SELECT DISTINCT state     FROM mandi_prices_backup_rename WHERE state     IS NOT NULL ORDER BY state`, []),
      runQuery(`SELECT DISTINCT district  FROM mandi_prices_backup_rename WHERE district  IS NOT NULL ${stateClause}         ORDER BY district`, stateInput),
      runQuery(`SELECT DISTINCT market    FROM mandi_prices_backup_rename WHERE market    IS NOT NULL ${stateDistrictClause} ORDER BY market`,   stateDistrictInput),
      runQuery(`SELECT DISTINCT commodity FROM mandi_prices_backup_rename WHERE commodity IS NOT NULL ORDER BY commodity`, []),
      runQuery(`SELECT DISTINCT grade     FROM mandi_prices_backup_rename WHERE grade     IS NOT NULL ORDER BY grade`,     []),
    ])

    const data = {
      states:      states.map(r => r.state),
      districts:   districts.map(r => r.district),
      markets:     markets.map(r => r.market),
      commodities: commodities.map(r => r.commodity),
      grades:      grades.map(r => r.grade),
    }

    await cacheSet(cacheKey, data, getTTL('filters'))
    res.json(data)
  } catch (err) {
    console.error('filters error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/clear-cache', async (req, res) => {
  try {
    await redis.flushall()
    res.json({ message: 'Cache cleared!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/domestic/available-dates ─────────────────────────
// Uses MIN/MAX instead of DISTINCT — fast even on 27M rows
router.get('/available-dates', async (req, res) => {
  const { state } = req.query
  const cacheKey = `available-dates-v2:${state || 'all'}`
  const cached    = await cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const stateInput  = state ? [{ name: 'state', type: sql.NVarChar, value: state }] : []
    const stateClause = state ? `AND state = @state` : ''

    const rows = await runQuery(`
      SELECT
        CONVERT(VARCHAR(10), MIN(arrival_date), 23) AS min_date,
        CONVERT(VARCHAR(10), MAX(arrival_date), 23) AS max_date
      FROM mandi_prices_backup_rename
      WHERE arrival_date IS NOT NULL ${stateClause}
    `, stateInput)

    const data = {
      minDate: rows[0].min_date,
      maxDate: rows[0].max_date,
    }

    await cacheSet(cacheKey, data, getTTL('filters'))
    res.json(data)
  } catch (err) {
    console.error('available-dates error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/domestic/overview ─────────────────────────────────
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

// ── GET /api/domestic/table ────────────────────────────────────
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

// ── GET /api/domestic/trends ───────────────────────────────────
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

// ── GET /api/domestic/markets ──────────────────────────────────
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
