import { COLORS, PALETTE } from '../constants'
import { fmtVal, fmtQty } from '../utils/format'

// ── Custom recharts tooltip ────────────────────────────────────────────────────
export function CustomTooltip({ active, payload, label, mode = 'val' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: 8, padding: '10px 14px', fontSize: 12, maxWidth: 260,
    }}>
      <p style={{ color: COLORS.subtle, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between',
          gap: 12, color: p.color || COLORS.text, marginBottom: 2,
        }}>
          <span style={{ color: COLORS.subtle }}>{p.name}</span>
          <span style={{ fontWeight: 700 }}>
            {mode === 'qty' ? fmtQty(p.value) : fmtVal(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = COLORS.accent }) {
  return (
    <div style={{
      background: COLORS.cardBg, border: `1px solid ${COLORS.border}`,
      borderRadius: 12, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 3, height: '100%', background: color,
        borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        fontSize: 11, color: COLORS.muted,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 800, color: COLORS.text,
        fontFamily: "'Space Mono', monospace",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: COLORS.green, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        margin: 0, fontSize: 18, fontWeight: 700,
        color: COLORS.text, fontFamily: "'Syne', sans-serif",
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.muted }}>{subtitle}</p>
      )}
    </div>
  )
}

// ── Select Dropdown ────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, label, wide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: wide ? 280 : 160 }}>
      {label && (
        <label style={{
          fontSize: 11, color: COLORS.muted,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 8, color: COLORS.text,
          padding: '8px 12px', fontSize: 13,
          cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
        }}
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Tab Switcher ───────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, background: '#0f172a',
      borderRadius: 10, padding: 4,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit',
            background: active === t.id ? COLORS.accent : 'transparent',
            color: active === t.id ? COLORS.darkBg : COLORS.subtle,
            transition: 'all 0.2s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Category Badge ─────────────────────────────────────────────────────────────
export function CategoryBadge({ category }) {
  const isProcessed = category?.includes('Processed')
  return (
    <span style={{
      background: isProcessed ? '#1e1b4b' : '#052e16',
      color: isProcessed ? '#818cf8' : '#4ade80',
      borderRadius: 4, padding: '2px 7px',
      fontSize: 10, fontWeight: 600,
    }}>
      {isProcessed ? 'Processed' : 'Fresh'}
    </span>
  )
}

// ── Data Table ─────────────────────────────────────────────────────────────────
export function DataTable({ columns, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left', padding: '8px 12px',
                  color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}`,
                  fontWeight: 600, textTransform: 'uppercase',
                  fontSize: 10, letterSpacing: '0.05em',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid #111827` }}>
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    padding: '8px 12px',
                    color: col.color || COLORS.text,
                    fontFamily: col.mono ? "'Space Mono', monospace" : 'inherit',
                    fontWeight: col.bold ? 500 : 400,
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
