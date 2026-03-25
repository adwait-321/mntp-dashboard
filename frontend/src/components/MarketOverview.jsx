import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { YEARS, PALETTE, COLORS } from '../constants'
import { fmtVal, fmtQty, trunc } from '../utils/format'
import { StatCard, SectionHeader, Select, CustomTooltip } from './UI'

export default function MarketOverview({ data }) {
  const { raw } = data
  const [selYear, setSelYear] = useState(YEARS[YEARS.length - 1])

  const topCountries = useMemo(() => {
    const rows = raw.filter(r => r[0] === selYear)
    const byCty = {}
    for (const r of rows) {
      if (!byCty[r[2]]) byCty[r[2]] = { country: r[2], val: 0, qty: 0 }
      byCty[r[2]].val += r[5]
      byCty[r[2]].qty += r[4]
    }
    return Object.values(byCty).sort((a, b) => b.val - a.val).slice(0, 20)
  }, [raw, selYear])

  const topProducts = useMemo(() => {
    const rows = raw.filter(r => r[0] === selYear)
    const byP = {}
    for (const r of rows) {
      if (!byP[r[1]]) byP[r[1]] = { product: trunc(r[1], 30), val: 0, qty: 0 }
      byP[r[1]].val += r[5]
      byP[r[1]].qty += r[4]
    }
    return Object.values(byP).sort((a, b) => b.val - a.val).slice(0, 20)
  }, [raw, selYear])

  const yearTotals = useMemo(() =>
    YEARS.map(y => {
      const rows = raw.filter(r => r[0] === y)
      return {
        year: y,
        val: rows.reduce((s, r) => s + r[5], 0),
        qty: rows.reduce((s, r) => s + r[4], 0),
        countries: new Set(rows.map(r => r[2])).size,
        products: new Set(rows.map(r => r[1])).size,
      }
    }), [raw])

  const catSplit = useMemo(() => {
    const rows = raw.filter(r => r[0] === selYear)
    const byCat = {}
    for (const r of rows) {
      if (!byCat[r[3]]) byCat[r[3]] = { category: r[3], val: 0 }
      byCat[r[3]].val += r[5]
    }
    return Object.values(byCat)
  }, [raw, selYear])

  const cur = yearTotals.find(y => y.year === selYear)
  const prv = yearTotals[yearTotals.findIndex(y => y.year === selYear) - 1]
  const yoy = prv?.val > 0 ? (cur?.val - prv?.val) / prv?.val * 100 : 0

  const card = { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* Year selector */}
      <div style={card}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={selYear} onChange={setSelYear} options={YEARS} label="Select Year" />
          <p style={{ flex: 1, fontSize: 12, color: COLORS.muted }}>
            India's agricultural exports — viewed from the perspective of importing nations
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard
          label="Total Export Value"
          value={fmtVal(cur?.val || 0)}
          sub={`${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}% vs prev year`}
          color={yoy >= 0 ? COLORS.green : COLORS.red}
        />
        <StatCard label="Total Quantity" value={fmtQty(cur?.qty || 0)} color={COLORS.purple} />
        <StatCard label="Importing Countries" value={cur?.countries || 0} color={COLORS.amber} />
        <StatCard label="Unique Commodities" value={cur?.products || 0} color={COLORS.blue} />
      </div>

      {/* 5-year trend */}
      <div style={card}>
        <SectionHeader
          title="5-Year Export Overview"
          subtitle="Total value of India's agri-exports across all importing nations"
        />
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={yearTotals}>
            <defs>
              <linearGradient id="og1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="year" tick={{ fill: COLORS.muted, fontSize: 12 }} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(1)}B`} />
            <Tooltip content={<CustomTooltip mode="val" />} />
            <Area
              type="monotone" dataKey="val" name="Total Value"
              stroke={COLORS.accent} fill="url(#og1)" strokeWidth={2.5}
              dot={{ fill: COLORS.accent, r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-side: top countries + top products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={card}>
          <SectionHeader title="Top 20 Importing Countries" subtitle={selYear} />
          <ResponsiveContainer width="100%" height={440}>
            <BarChart data={topCountries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 10 }} tickFormatter={v => `$${v}M`} />
              <YAxis type="category" dataKey="country" tick={{ fill: COLORS.subtle, fontSize: 10 }} width={130} />
              <Tooltip content={<CustomTooltip mode="val" />} />
              <Bar dataKey="val" name="Value" radius={[0, 4, 4, 0]}>
                {topCountries.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <SectionHeader title="Top 20 Commodities Exported" subtitle={selYear} />
          <ResponsiveContainer width="100%" height={440}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 10 }} tickFormatter={v => `$${v}M`} />
              <YAxis type="category" dataKey="product" tick={{ fill: COLORS.subtle, fontSize: 10 }} width={205} />
              <Tooltip content={<CustomTooltip mode="val" />} />
              <Bar dataKey="val" name="Value" radius={[0, 4, 4, 0]}>
                {topProducts.map((_, i) => <Cell key={i} fill={PALETTE[(i + 4) % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category split */}
      <div style={card}>
        <SectionHeader title="Category Distribution" subtitle={`Fresh vs Processed — ${selYear}`} />
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '0 0 300px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={catSplit} dataKey="val" nameKey="category"
                  cx="50%" cy="50%" outerRadius={75} innerRadius={35}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {catSplit.map((_, i) => <Cell key={i} fill={PALETTE[i * 3 % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={v => [fmtVal(v), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {catSplit.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: PALETTE[i * 3 % PALETTE.length] }} />
                <span style={{ color: COLORS.text, flex: 1, fontSize: 13, fontWeight: 500 }}>{c.category}</span>
                <span style={{ color: COLORS.accent, fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700 }}>
                  {fmtVal(c.val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
