import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const COLUMNS = [
  { key: 'year',            label: 'Year'       },
  { key: 'month_name',      label: 'Month'      },
  { key: 'day',             label: 'Day'        },
  { key: 'state',           label: 'State'      },
  { key: 'district',        label: 'District'   },
  { key: 'market',          label: 'Market'     },
  { key: 'commodity',       label: 'Commodity'  },
  { key: 'variety',         label: 'Variety'    },
  { key: 'grade',           label: 'Grade'      },
  { key: 'max_price',       label: 'Max Price'  },
  { key: 'min_price',       label: 'Min Price'  },
  { key: 'avg_modal_price', label: 'Avg Price'  },
]

const PRICE_KEYS = ['max_price', 'min_price', 'avg_modal_price']

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

export default function DataTable({ filters }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [page,      setPage]      = useState(1)
  const [sortKey,   setSortKey]   = useState('year')
  const [sortDir,   setSortDir]   = useState('desc')
  const PAGE_SIZE = 50

  // reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [filters])

  useEffect(() => {
    setLoading(true)
    setError(null)
    axios.get(`${API}/api/domestic/table`, {
      params: { ...filters, page, pageSize: PAGE_SIZE },
    })
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters, page])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // client-side sort on current page
  const sorted = data?.rows ? [...data.rows].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortDir === 'asc' ? cmp : -cmp
  }) : []

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  if (error) return <ErrorBox msg={error} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPICard label='Max Price' value={data?.kpi?.max_price} />
        <KPICard label='Min Price' value={data?.kpi?.min_price} />
        <KPICard label='Avg Price' value={data?.kpi?.avg_price} />
      </div>

      {/* Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
      }}>

        {/* Table header row with record count */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            Records
          </span>
          {data && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {data.total.toLocaleString('en-IN')} total · page {page} of {totalPages}
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: 12, fontFamily: 'Arial, sans-serif',
          }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '10px 12px',
                      textAlign: col.key === 'year' || PRICE_KEYS.includes(col.key) ? 'right' : 'left',
                      fontSize: 11, fontWeight: 700,
                      color: sortKey === col.key ? '#2563eb' : '#64748b',
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {col.label}
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{
                      width: 28, height: 28, margin: '0 auto',
                      border: '3px solid #e2e8f0',
                      borderTopColor: '#2563eb',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{
                    textAlign: 'center', padding: 40,
                    color: '#94a3b8', fontSize: 13,
                  }}>
                    No records found.
                  </td>
                </tr>
              ) : sorted.map((row, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                >
                  {COLUMNS.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: '8px 12px',
                        textAlign: PRICE_KEYS.includes(col.key) || col.key === 'year' ? 'right' : 'left',
                        color: PRICE_KEYS.includes(col.key) ? '#0f172a' : '#334155',
                        fontWeight: PRICE_KEYS.includes(col.key) ? 600 : 400,
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {PRICE_KEYS.includes(col.key) && row[col.key] != null
                        ? `₹${Number(row[col.key]).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                        : row[col.key] ?? '—'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
          }}>
            <PagButton label='«' onClick={() => setPage(1)}           disabled={page === 1} />
            <PagButton label='‹' onClick={() => setPage(p => p - 1)} disabled={page === 1} />

            {/* page number pills */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = start + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    background: p === page ? '#2563eb' : 'transparent',
                    color:      p === page ? '#fff'    : '#64748b',
                  }}
                >
                  {p}
                </button>
              )
            })}

            <PagButton label='›' onClick={() => setPage(p => p + 1)} disabled={page === totalPages} />
            <PagButton label='»' onClick={() => setPage(totalPages)} disabled={page === totalPages} />
          </div>
        )}
      </div>
    </div>
  )
}

function PagButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: 6,
        border: '1px solid #e2e8f0',
        background: 'transparent',
        color: disabled ? '#cbd5e1' : '#64748b',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14, fontWeight: 600,
      }}
    >
      {label}
    </button>
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