import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const MONTH_ORDER = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const fmt = val => `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' },
  formatter: (val, name) => [fmt(val), name],
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

export default function MonthlyTrends({ filters }) {
  const [data,    setData]    = useState([])
  const [years,   setYears]   = useState([])
  const [selYear, setSelYear] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    axios.get(`${API}/api/domestic/trends`, { params: filters })
      .then(r => {
        const rows = r.data.rows
        // extract unique years for year filter
        const uniqueYears = [...new Set(rows.map(r => r.year))].sort()
        setYears(uniqueYears)
        setSelYear('all')
        setData(rows)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  // filter by selected year then aggregate by month
  const chartData = (() => {
    const filtered = selYear === 'all'
      ? data
      : data.filter(r => String(r.year) === String(selYear))

    // group by month_name, average across years if 'all'
    const byMonth = {}
    filtered.forEach(r => {
      if (!byMonth[r.month_name]) {
        byMonth[r.month_name] = { month: r.month_name, avg_sum: 0, min_sum: 0, max_sum: 0, count: 0 }
      }
      byMonth[r.month_name].avg_sum += Number(r.avg_price)
      byMonth[r.month_name].min_sum += Number(r.min_price)
      byMonth[r.month_name].max_sum += Number(r.max_price)
      byMonth[r.month_name].count   += 1
    })

    return MONTH_ORDER
      .filter(m => byMonth[m])
      .map(m => ({
        month:     m.slice(0, 3), // 'Jan', 'Feb' etc for axis
        avg_price: +(byMonth[m].avg_sum / byMonth[m].count).toFixed(2),
        min_price: +(byMonth[m].min_sum / byMonth[m].count).toFixed(2),
        max_price: +(byMonth[m].max_sum / byMonth[m].count).toFixed(2),
      }))
  })()

  if (loading) return <Spinner />
  if (error)   return <ErrorBox msg={error} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Year selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Year</span>
        {['all', ...years].map(y => (
          <button
            key={y}
            onClick={() => setSelYear(y)}
            style={{
              padding: '5px 14px', borderRadius: 20,
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              fontFamily: 'Arial, sans-serif',
              background: selYear === String(y) ? '#2563eb' : '#f1f5f9',
              color:      selYear === String(y) ? '#fff'    : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {y === 'all' ? 'All Years' : y}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          color: '#94a3b8', fontSize: 14,
        }}>
          No data for the selected filters.
        </div>
      ) : (
        <>
          {/* Line chart — Max / Min / Avg by month */}
          <ChartCard title='Max Price, Min Price and Avg Price by Month'>
            <ResponsiveContainer width='100%' height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis dataKey='month' tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 11 }} width={70} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend iconType='circle' iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type='monotone' dataKey='max_price' name='Max Price' stroke='#2563eb' strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type='monotone' dataKey='min_price' name='Min Price' stroke='#dc2626' strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type='monotone' dataKey='avg_price' name='Avg Price' stroke='#f97316' strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3 bar charts in a row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

            <div style={{ flex: 1, minWidth: 260 }}>
              <ChartCard title='Avg Price by Month'>
                <ResponsiveContainer width='100%' height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                    <XAxis dataKey='month' tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 10 }} width={60} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey='avg_price' name='Avg Price' fill='#f97316' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <ChartCard title='Min Price by Month'>
                <ResponsiveContainer width='100%' height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                    <XAxis dataKey='month' tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 10 }} width={60} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey='min_price' name='Min Price' fill='#2563eb' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <ChartCard title='Max Price by Month'>
                <ResponsiveContainer width='100%' height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                    <XAxis dataKey='month' tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 10 }} width={60} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey='max_price' name='Max Price' fill='#0891b2' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

          </div>
        </>
      )}
    </div>
  )
}

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