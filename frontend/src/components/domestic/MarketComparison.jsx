import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const fmt = val =>
  `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const PRICE_CONFIGS = [
  { key: 'avg_price', label: 'Avg Price',  color: '#f97316' },
  { key: 'max_price', label: 'Max Price',  color: '#2563eb' },
  { key: 'min_price', label: 'Min Price',  color: '#0891b2' },
]

// ── Sub-components ─────────────────────────────────────────────

function KPICard({ label, value }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '20px 24px',
      flex: 1, minWidth: 160,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
        {value == null
          ? '—'
          : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        }
      </span>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>per quintal</span>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      <div style={{
        fontSize: 13, fontWeight: 600,
        color: '#64748b', marginBottom: 16,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// Custom tooltip so it shows market + state cleanly
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '10px 14px',
      fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)',
    }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{label}</div>
      <div style={{ color: d.color, fontWeight: 600 }}>{d.name}: {fmt(d.value)}</div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────

export default function MarketComparison({ filters }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [activeKey, setActiveKey] = useState('avg_price')

  useEffect(() => {
    setLoading(true)
    setError(null)
    axios.get(`${API}/api/domestic/markets`, { params: filters })
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  if (loading) return <Spinner />
  if (error)   return <ErrorBox msg={error} />

  const { kpi, byMarket } = data

  // Build chart data — label is "Market (State)", sorted desc by active price key
  const chartData = [...byMarket]
    .sort((a, b) => Number(b[activeKey]) - Number(a[activeKey]))
    .map(row => ({
      name:      row.state ? `${row.market} (${row.state})` : row.market,
      avg_price: Number(row.avg_price),
      min_price: Number(row.min_price),
      max_price: Number(row.max_price),
    }))

  const activeCfg = PRICE_CONFIGS.find(c => c.key === activeKey)

  // Dynamic height: 34px per bar so labels never overlap
  const chartHeight = Math.max(320, chartData.length * 34)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPICard label='Max Price' value={kpi?.max_price} />
        <KPICard label='Min Price' value={kpi?.min_price} />
        <KPICard label='Avg Price' value={kpi?.avg_price} />
      </div>

      {/* Metric selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Show</span>
        {PRICE_CONFIGS.map(cfg => (
          <button
            key={cfg.key}
            onClick={() => setActiveKey(cfg.key)}
            style={{
              padding: '5px 14px', borderRadius: 20,
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              fontFamily: 'Arial, sans-serif',
              background: activeKey === cfg.key ? cfg.color : '#f1f5f9',
              color:      activeKey === cfg.key ? '#fff'     : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Horizontal bar chart */}
      {chartData.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          color: '#94a3b8', fontSize: 14,
        }}>
          No data for the selected filters.
        </div>
      ) : (
        <ChartCard title={`${activeCfg.label} by Market (ranked high → low, top ${chartData.length})`}>
          <div style={{ overflowY: 'auto', maxHeight: 560 }}>
            <ResponsiveContainer width='100%' height={chartHeight}>
              <BarChart
                data={chartData}
                layout='vertical'
                margin={{ top: 4, right: 64, bottom: 4, left: 8 }}
                barCategoryGap='22%'
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' horizontal={false} />
                <XAxis
                  type='number'
                  tickFormatter={v => `₹${v}`}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={210}
                  tick={{ fontSize: 11, fill: '#334155' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey={activeKey}
                  name={activeCfg.label}
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    formatter: fmt,
                    fontSize: 10,
                    fill: '#64748b',
                  }}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={activeCfg.color}
                      opacity={1 - (i / chartData.length) * 0.45}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  )
}

// ── Utility components ─────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: 12, padding: 20, color: '#dc2626', fontSize: 13,
    }}>
      <strong>Error:</strong> {msg}
    </div>
  )
}