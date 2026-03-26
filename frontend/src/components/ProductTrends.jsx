import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { YEARS, PALETTE, COLORS } from '../constants'
import { fmtVal, fmtQty, trunc } from '../utils/format'
import {
  StatCard, SectionHeader, Select, Tabs,
  CustomTooltip, CategoryBadge,
} from './UI'

export default function ProductTrends({ data }) {
  const { meta, byProduct } = data

  const defaultProduct =
    meta.products.find(p => p.toLowerCase().includes('grape')) || meta.products[0]

  const [selProd, setSelProd] = useState(defaultProduct)
  const [metric, setMetric]   = useState('val')
  const [viewMode, setViewMode] = useState('bar')
  const [drillYear, setDrillYear] = useState(YEARS[YEARS.length - 1])

  const prodOptions = meta.products.map(p => ({ value: p, label: trunc(p, 55) }))

  const overallTrend = useMemo(() => {
    const rows = byProduct[selProd] || []
    return YEARS.map(y => {
      const yr = rows.filter(r => r.year === y)
      return {
        year: y,
        val: yr.reduce((s, r) => s + r.val, 0),
        qty: yr.reduce((s, r) => s + r.qty, 0),
        countries: new Set(yr.map(r => r.country)).size,
      }
    })
  }, [selProd, byProduct])

  const { stackedData, top8 } = useMemo(() => {
    const rows = byProduct[selProd] || []
    const byCty = {}
    for (const r of rows)
      byCty[r.country] = (byCty[r.country] || 0) + (metric === 'val' ? r.val : r.qty)

    const top8 = Object.entries(byCty)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0])

    const stackedData = YEARS.map(y => {
      const yr = rows.filter(r => r.year === y)
      const obj = { year: y }
      for (const c of top8)
        obj[c] = yr.filter(r => r.country === c)
          .reduce((s, r) => s + (metric === 'val' ? r.val : r.qty), 0)
      return obj
    })

    return { stackedData, top8 }
  }, [selProd, byProduct, metric])

  const drillData = useMemo(() => {
    const rows = byProduct[selProd] || []
    return rows
      .filter(r => r.year === drillYear)
      .map(r => ({
        country: trunc(r.country, 22),
        fullCountry: r.country,
        val: r.val,
        qty: r.qty,
      }))
      .sort((a, b) => b[metric === 'val' ? 'val' : 'qty'] - a[metric === 'val' ? 'val' : 'qty'])
      .slice(0, 15)
  }, [selProd, byProduct, drillYear, metric])

  const latest   = overallTrend[overallTrend.length - 1]
  const prev     = overallTrend[overallTrend.length - 2]
  const yoy      = prev?.val > 0 ? (latest?.val - prev?.val) / prev?.val * 100 : 0
  const totalVal = overallTrend.reduce((s, r) => s + r.val, 0)

  const card = { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }

  const renderTrendChart = () => {
    const commonProps = {
      data: overallTrend,
      children: [
        <CartesianGrid key="grid" strokeDasharray="3 3" stroke={COLORS.border} />,
        <XAxis key="x" dataKey="year" tick={{ fill: COLORS.muted, fontSize: 11 }} />,
        <YAxis key="y" tick={{ fill: COLORS.muted, fontSize: 10 }}
          tickFormatter={v => metric === 'val' ? `$${v}M` : `${(v / 1000).toFixed(0)}K`} />,
        <Tooltip key="tip" content={<CustomTooltip mode={metric} />} />,
      ],
    }

    if (viewMode === 'area') return (
      <AreaChart {...commonProps}>
        {commonProps.children}
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={metric}
          name={metric === 'val' ? 'Value' : 'Qty'}
          stroke={COLORS.accent} fill="url(#g1)" strokeWidth={2.5}
          dot={{ fill: COLORS.accent, r: 4 }} />
      </AreaChart>
    )

    if (viewMode === 'line') return (
      <LineChart {...commonProps}>
        {commonProps.children}
        <Line type="monotone" dataKey={metric}
          name={metric === 'val' ? 'Value' : 'Qty'}
          stroke={COLORS.accent} strokeWidth={2.5}
          dot={{ fill: COLORS.accent, r: 5 }} activeDot={{ r: 7 }} />
      </LineChart>
    )

    return (
      <BarChart {...commonProps}>
        {commonProps.children}
        <Bar dataKey={metric} name={metric === 'val' ? 'Value' : 'Qty'}
          fill={COLORS.accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* Controls */}
      <div style={card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Select value={selProd} onChange={setSelProd} options={prodOptions}
              label="Select Commodity" wide />
          </div>
          <Select value={metric} onChange={setMetric}
            options={[
              { value: 'val', label: 'Trade Value (USD M)' },
              { value: 'qty', label: 'Quantity (MT)' },
            ]}
            label="Metric"
          />
          <div>
            <label style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
              Chart Type
            </label>
            <Tabs
              tabs={[{ id: 'bar', label: 'Bar' }, { id: 'line', label: 'Line' }, { id: 'area', label: 'Area' }]}
              active={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="5-Year Total Value" value={fmtVal(totalVal)} color={COLORS.accent} />
        <StatCard
          label="Latest Year Value"
          value={fmtVal(latest?.val || 0)}
          sub={`${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}% vs prev year`}
          color={yoy >= 0 ? COLORS.green : COLORS.red}
        />
        <StatCard label="Latest Qty" value={fmtQty(latest?.qty || 0)} color={COLORS.purple} />
        <StatCard label={`Top Importer (${drillYear})`} value={trunc(drillData[0]?.fullCountry || '—', 16)} color={COLORS.amber} />
        <StatCard label="Markets Reached" value={`${latest?.countries || 0}`} sub="Countries" color={COLORS.blue} />
      </div>

      {/* YoY trend chart */}
      <div style={card}>
        <SectionHeader
          title="Trade Volume Trend — Year over Year"
          subtitle={`Imported from India: ${trunc(selProd, 60)}`}
        />
        <ResponsiveContainer width="100%" height={260}>
          {renderTrendChart()}
        </ResponsiveContainer>
      </div>

      {/* Stacked countries */}
      <div style={card}>
        <SectionHeader
          title="Importing Countries — Trend Over Years"
          subtitle="Top 8 importing countries stacked by year"
        />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stackedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="year" tick={{ fill: COLORS.muted, fontSize: 11 }} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }}
              tickFormatter={v => metric === 'val' ? `$${v}M` : `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip mode={metric} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: COLORS.subtle, paddingTop: 10 }}
              formatter={v => trunc(v, 20)}
            />
            {top8.map((c, i) => (
              <Bar key={c} dataKey={c} stackId="a" fill={PALETTE[i % PALETTE.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Per-year drill-down — stacks on mobile ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Horizontal bar */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <SectionHeader title="Country-wise Breakdown" subtitle="Top 15 importers" />
            <Select value={drillYear} onChange={setDrillYear} options={YEARS} label="Year" />
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={drillData} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 10 }}
                tickFormatter={v => metric === 'val' ? `$${v}M` : `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="country" tick={{ fill: COLORS.subtle, fontSize: 10 }} width={100} />
              <Tooltip content={<CustomTooltip mode={metric} />} />
              <Bar dataKey={metric === 'val' ? 'val' : 'qty'} name={metric === 'val' ? 'Value' : 'Qty'}
                radius={[0, 4, 4, 0]}>
                {drillData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={card}>
          <SectionHeader title="Import Share by Country" subtitle={`Distribution for ${drillYear}`} />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={drillData.slice(0, 10)}
                dataKey={metric === 'val' ? 'val' : 'qty'}
                nameKey="country"
                cx="50%" cy="50%"
                outerRadius={100} innerRadius={45}
                paddingAngle={2}
                label={({ country, percent }) =>
                  percent > 0.05 ? `${trunc(country, 9)} ${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {drillData.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [metric === 'val' ? fmtVal(v) : fmtQty(v), n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
            {drillData.slice(0, 10).map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[i % PALETTE.length] }} />
                <span style={{ color: COLORS.subtle }}>{trunc(d.country, 18)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data table */}
      <div style={card}>
        <SectionHeader title="Detailed Data Table" subtitle={`All importers for ${drillYear}`} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Rank', 'Country', 'Value (USD M)', 'Quantity (MT)', 'Share %'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 12px',
                    color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}`,
                    fontWeight: 600, textTransform: 'uppercase',
                    fontSize: 10, letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drillData.map((r, i) => {
                const total = drillData.reduce((s, d) => s + d.val, 0)
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '8px 12px', color: COLORS.muted }}>#{i + 1}</td>
                    <td style={{ padding: '8px 12px', color: COLORS.text, fontWeight: 500 }}>{r.fullCountry}</td>
                    <td style={{ padding: '8px 12px', color: COLORS.accent }}>
                      {fmtVal(r.val)}
                    </td>
                    <td style={{ padding: '8px 12px', color: COLORS.purple }}>
                      {fmtQty(r.qty)}
                    </td>
                    <td style={{ padding: '8px 12px', color: COLORS.amber }}>
                      {total > 0 ? (r.val / total * 100).toFixed(1) + '%' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}