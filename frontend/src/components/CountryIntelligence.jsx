import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { YEARS, PALETTE, COLORS } from '../constants'
import { fmtVal, fmtQty, trunc } from '../utils/format'
import { StatCard, SectionHeader, Select, CustomTooltip, CategoryBadge } from './UI'

export default function CountryIntelligence({ data }) {
  const { meta, byCountry } = data

  const [selCtry, setSelCtry] = useState('United States')
  const [selYear, setSelYear] = useState('all')
  const [metric, setMetric]   = useState('val')
  const [topN, setTopN]       = useState(15)

  const ctyOpts = meta.countries.map(c => ({ value: c, label: c }))

  const stats = useMemo(() => {
    const rows = byCountry[selCtry] || []
    const totalVal = rows.reduce((s, r) => s + r.val, 0)
    const totalQty = rows.reduce((s, r) => s + r.qty, 0)
    const uniqueP  = new Set(rows.map(r => r.product)).size
    const latRows  = rows.filter(r => r.year === YEARS[YEARS.length - 1])
    const latV     = latRows.reduce((s, r) => s + r.val, 0)
    const prvRows  = rows.filter(r => r.year === YEARS[YEARS.length - 2])
    const prvV     = prvRows.reduce((s, r) => s + r.val, 0)
    return { totalVal, totalQty, uniqueP, latV, yoy: prvV > 0 ? (latV - prvV) / prvV * 100 : 0 }
  }, [selCtry, byCountry])

  const topProds = useMemo(() => {
    const rows = (byCountry[selCtry] || []).filter(r => selYear === 'all' || r.year === selYear)
    const byP = {}
    for (const r of rows) {
      if (!byP[r.product]) byP[r.product] = { product: r.product, fullP: r.product, val: 0, qty: 0, category: r.category }
      byP[r.product].val += r.val
      byP[r.product].qty += r.qty
    }
    return Object.values(byP)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, topN)
      .map(r => ({ ...r, productShort: trunc(r.product, 36) }))
  }, [selCtry, byCountry, selYear, metric, topN])

  const yearTrend = useMemo(() => {
    const rows = byCountry[selCtry] || []
    return YEARS.map(y => {
      const yr = rows.filter(r => r.year === y)
      return {
        year: y,
        val: yr.reduce((s, r) => s + r.val, 0),
        qty: yr.reduce((s, r) => s + r.qty, 0),
      }
    })
  }, [selCtry, byCountry])

  const catSplit = useMemo(() => {
    const rows = (byCountry[selCtry] || []).filter(r => selYear === 'all' || r.year === selYear)
    const byCat = {}
    for (const r of rows) {
      if (!byCat[r.category]) byCat[r.category] = { category: r.category, val: 0 }
      byCat[r.category].val += r.val
    }
    return Object.values(byCat).sort((a, b) => b.val - a.val)
  }, [selCtry, byCountry, selYear])

  const { stackedData, top8Keys } = useMemo(() => {
    const rows = byCountry[selCtry] || []
    const byP = {}
    for (const r of rows) byP[r.product] = (byP[r.product] || 0) + r.val
    const top8 = Object.entries(byP).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0])
    const stackedData = YEARS.map(y => {
      const yr = rows.filter(r => r.year === y)
      const obj = { year: y }
      for (const p of top8)
        obj[trunc(p, 22)] = yr.filter(r => r.product === p).reduce((s, r) => s + r.val, 0)
      return obj
    })
    return { stackedData, top8Keys: top8.map(p => trunc(p, 22)) }
  }, [selCtry, byCountry])

  const card = { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* Controls */}
      <div style={card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Select value={selCtry} onChange={setSelCtry} options={ctyOpts}
              label="Select Importing Country" wide />
          </div>
          <Select value={selYear} onChange={setSelYear}
            options={[{ value: 'all', label: 'All Years' }, ...YEARS.map(y => ({ value: y, label: y }))]}
            label="Filter by Year"
          />
          <Select value={metric} onChange={setMetric}
            options={[
              { value: 'val', label: 'Trade Value (USD M)' },
              { value: 'qty', label: 'Quantity (MT)' },
            ]}
            label="Metric"
          />
          <Select value={String(topN)} onChange={v => setTopN(Number(v))}
            options={['10', '15', '20', '30'].map(v => ({ value: v, label: `Top ${v} Commodities` }))}
            label="Show Top"
          />
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="Total Imported Value" value={fmtVal(stats.totalVal)} color={COLORS.accent} />
        <StatCard
          label="Latest Year Import"
          value={fmtVal(stats.latV)}
          sub={`${stats.yoy > 0 ? '+' : ''}${stats.yoy.toFixed(1)}% YoY`}
          color={stats.yoy >= 0 ? COLORS.green : COLORS.red}
        />
        <StatCard label="Total Quantity" value={fmtQty(stats.totalQty)} color={COLORS.purple} />
        <StatCard label="Unique Commodities" value={stats.uniqueP} color={COLORS.amber} />
      </div>

      {/* ── Trend + category split — stacks on mobile ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div style={card}>
          <SectionHeader
            title={`Import Trend — ${selCtry}`}
            subtitle="Total Indian agri-products imported by year"
          />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={yearTrend}>
              <defs>
                <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="year" tick={{ fill: COLORS.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} tickFormatter={v => `$${v}M`} />
              <Tooltip content={<CustomTooltip mode="val" />} />
              <Area type="monotone" dataKey="val" name="Trade Value"
                stroke={COLORS.purple} fill="url(#cg1)" strokeWidth={2.5}
                dot={{ fill: COLORS.purple, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <SectionHeader title="Category Split" subtitle="Fresh vs Processed" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catSplit} dataKey="val" nameKey="category"
                cx="50%" cy="50%" outerRadius={75} innerRadius={35}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {catSplit.map((_, i) => <Cell key={i} fill={PALETTE[i * 3 % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={v => [fmtVal(v), '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {catSplit.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: PALETTE[i * 3 % PALETTE.length] }} />
                <span style={{ color: COLORS.subtle, flex: 1 }}>{trunc(c.category, 28)}</span>
                <span style={{ color: COLORS.text, fontWeight: 600 }}>{fmtVal(c.val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products chart */}
      <div style={card}>
        <SectionHeader
          title={`Top ${topN} Commodities Imported by ${selCtry}`}
          subtitle={selYear === 'all' ? 'Across all years (2020-21 to 2024-25)' : `Year: ${selYear}`}
        />
        <ResponsiveContainer width="100%" height={Math.max(300, topN * 26)}>
          <BarChart data={topProds.map(r => ({ ...r, product: r.productShort }))} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 10 }}
              tickFormatter={v => metric === 'val' ? `$${v}M` : `${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="product" tick={{ fill: COLORS.subtle, fontSize: 10 }} width={190} />
            <Tooltip content={<CustomTooltip mode={metric} />} />
            <Bar dataKey={metric === 'val' ? 'val' : 'qty'} name={metric === 'val' ? 'Value' : 'Qty'}
              radius={[0, 4, 4, 0]}>
              {topProds.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked commodity trend */}
      <div style={card}>
        <SectionHeader title="Top 8 Commodities — Trend Over Years" subtitle="Stacked import value by commodity" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stackedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="year" tick={{ fill: COLORS.muted, fontSize: 11 }} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 10 }} tickFormatter={v => `$${v}M`} />
            <Tooltip content={<CustomTooltip mode="val" />} />
            <Legend wrapperStyle={{ fontSize: 10, color: COLORS.subtle, paddingTop: 8 }} />
            {top8Keys.map((p, i) => (
              <Bar key={p} dataKey={p} stackId="a" fill={PALETTE[i % PALETTE.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div style={card}>
        <SectionHeader
          title="Commodity Details Table"
          subtitle={`${selCtry} — ${selYear === 'all' ? 'All Years' : selYear}`}
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Rank', 'Commodity', 'Category', 'Value (USD M)', 'Quantity (MT)'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 12px',
                    color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}`,
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProds.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: '8px 12px', color: COLORS.muted }}>#{i + 1}</td>
                  <td style={{ padding: '8px 12px', color: COLORS.text, fontWeight: 500 }}>{r.fullP}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <CategoryBadge category={r.category} />
                  </td>
                  <td style={{ padding: '8px 12px', color: COLORS.accent }}>
                    {fmtVal(r.val)}
                  </td>
                  <td style={{ padding: '8px 12px', color: COLORS.purple }}>
                    {fmtQty(r.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}