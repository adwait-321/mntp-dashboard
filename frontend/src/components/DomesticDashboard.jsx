import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import PriceOverview   from './domestic/PriceOverview'
import DataTable       from './domestic/DataTable'
import MonthlyTrends   from './domestic/MonthlyTrends'
import MarketComparison from './domestic/MarketComparison'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PAGES = [
  { id: 'overview',   label: '📊 Price Overview' },
  { id: 'table',      label: '📋 Data Table'     },
  { id: 'trends',     label: '📈 Monthly Trends' },
  { id: 'markets',    label: '🏪 Market Compare' },
]

const EMPTY_FILTERS = {
  state:     '',
  district:  '',
  market:    '',
  commodity: '',
  grade:     '',
  dateFrom:  '',
  dateTo:    '',
}

export default function DomesticDashboard() {
  const [page,        setPage]        = useState('overview')
  const [filters,     setFilters]     = useState(EMPTY_FILTERS)
  const [applied,     setApplied]     = useState(EMPTY_FILTERS)
  const [options,     setOptions]     = useState({ states: [], districts: [], markets: [], commodities: [], grades: [] })
  const [loadingOpts, setLoadingOpts] = useState(true)

  // load filter dropdown options once
  useEffect(() => {
    axios.get(`${API}/api/domestic/filters`)
      .then(r => setOptions(r.data))
      .catch(console.error)
      .finally(() => setLoadingOpts(false))
  }, [])

  const handleChange = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  const handleApply = () => setApplied({ ...filters })

  const handleReset = () => {
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Filter Bar ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 16,
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          gap: 10, alignItems: 'flex-end',
        }}>

          {/* Dropdowns */}
          {[
            { key: 'state',     label: 'State',     opts: options.states      },
            { key: 'district',  label: 'District',  opts: options.districts   },
            { key: 'market',    label: 'Market',    opts: options.markets     },
            { key: 'commodity', label: 'Commodity', opts: options.commodities },
            { key: 'grade',     label: 'Grade',     opts: options.grades      },
          ].map(({ key, label, opts }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</label>
              <select
                value={filters[key]}
                onChange={e => handleChange(key, e.target.value)}
                disabled={loadingOpts}
                style={{
                  padding: '6px 10px', borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 13, color: '#0f172a',
                  background: '#f8fafc', minWidth: 140,
                  cursor: 'pointer',
                }}
              >
                <option value=''>All</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}

          {/* Date range */}
          {[
            { key: 'dateFrom', label: 'From' },
            { key: 'dateTo',   label: 'To'   },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</label>
              <input
                type='date'
                value={filters[key]}
                onChange={e => handleChange(key, e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 13, color: '#0f172a',
                  background: '#f8fafc',
                }}
              />
            </div>
          ))}

          {/* Buttons */}
          <button
            onClick={handleApply}
            style={{
              padding: '7px 18px', borderRadius: 8,
              background: '#2563eb', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: 'transparent', color: '#64748b',
              border: '1px solid #e2e8f0', cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Page Tabs ── */}
      <div style={{
        display: 'flex', gap: 4,
        borderBottom: '2px solid #e2e8f0',
        marginBottom: 20,
      }}>
        {PAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            style={{
              padding: '8px 16px',
              border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'Arial, sans-serif',
              color: page === p.id ? '#2563eb' : '#64748b',
              borderBottom: page === p.id ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Page Content ── */}
      {page === 'overview' && <PriceOverview    filters={applied} />}
      {page === 'table'    && <DataTable        filters={applied} />}
      {page === 'trends'   && <MonthlyTrends    filters={applied} />}
      {page === 'markets'  && <MarketComparison filters={applied} />}
    </div>
  )
}