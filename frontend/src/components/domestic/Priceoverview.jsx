import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const COLORS = [
  '#2563eb', '#7c3aed', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#65a30d',
  '#0ea5e9', '#f59e0b', '#10b981', '#6366f1',
]

// ─── Top 10 + Others grouping ─────────────────────────────────
function getTop10WithOthers(data, dataKey) {
  if (!data || data.length === 0) return []

  const sorted = [...data]
    .filter(d => d[dataKey] > 0)                          // exclude zeros
    .sort((a, b) => b[dataKey] - a[dataKey])

  if (sorted.length <= 10) return sorted

  const top10  = sorted.slice(0, 10)
  const others = sorted.slice(10)

  const othersValue = others.reduce((sum, d) => sum + d[dataKey], 0) / others.length

  return [...top10, { state: 'Others', [dataKey]: Math.round(othersValue) }]
}

// ─── KPI Card ─────────────────────────────────────────────────
function KPICard({ label, value, prefix = '₹' }) {
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
          : `${prefix}${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        }
      </span>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>per quintal</span>
    </div>
  )
}

// ─── Custom Legend ─────────────────────────────────────────────
function CustomLegend({ payload }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px 10px',
      justifyContent: 'center',
      marginTop: 8,
    }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: entry.color,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 10, color: '#475569' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Custom Label (only for slices > 5%) ──────────────────────
function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null    // skip tiny slices

  const RADIAN = Math.PI / 180
  const radius = outerRadius + 18
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x} y={y}
      fill='#475569'
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline='central'
      style={{ fontSize: 10, fontWeight: 500 }}
    >
      {name}
    </text>
  )
}

// ─── Donut Chart ───────────────────────────────────────────────
function DonutChart({ title, data, dataKey }) {
  const chartData = getTop10WithOthers(data, dataKey)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '16px',
      flex: 1, minWidth: 280,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
        {title}
      </div>
      <ResponsiveContainer width='100%' height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={dataKey}
            nameKey='state'
            cx='50%' cy='45%'
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            labelLine={false}
            label={renderLabel}
          >
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={i === chartData.length - 1 ? '#cbd5e1' : COLORS[i % COLORS.length]}  // Others = grey
              />
            ))}
          </Pie>
          <Tooltip
            formatter={val => [
              `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
              dataKey === 'max_price' ? 'Max Price' :
              dataKey === 'min_price' ? 'Min Price' : 'Avg Price'
            ]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────
export default function PriceOverview({ filters }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    axios.get(`${API}/api/domestic/overview`, { params: filters })
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  if (loading) return <Spinner />
  if (error)   return <ErrorBox msg={error} />

  const { kpi, byState } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPICard label='Max Price' value={kpi?.max_price} />
        <KPICard label='Min Price' value={kpi?.min_price} />
        <KPICard label='Avg Price' value={kpi?.avg_price} />
      </div>

      {/* Donut Charts */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <DonutChart title='Max Price w.r.t State' data={byState} dataKey='max_price' />
        <DonutChart title='Min Price w.r.t State' data={byState} dataKey='min_price' />
        <DonutChart title='Avg Price w.r.t State' data={byState} dataKey='avg_price' />
      </div>

      {byState.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 40,
          color: '#94a3b8', fontSize: 14,
        }}>
          No data found for the selected filters.
        </div>
      )}
    </div>
  )
}

// ─── Spinner / Error ───────────────────────────────────────────
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