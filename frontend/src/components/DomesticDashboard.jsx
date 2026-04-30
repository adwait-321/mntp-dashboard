import { useState, useEffect } from 'react'
import axios from 'axios'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import PriceOverview    from './domestic/Priceoverview'
import DataTable        from './domestic/DataTable'
import MonthlyTrends    from './domestic/MonthlyTrends'
import MarketComparison from './domestic/MarketComparison'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PAGES = [
  { id: 'overview', label: '📊 Price Overview' },
  { id: 'table',    label: '📋 Data Table'     },
  { id: 'trends',   label: '📈 Monthly Trends' },
  { id: 'markets',  label: '🏪 Market Compare' },
]

const EMPTY_FILTERS = {
  state: '', district: '', market: '',
  commodity: '', grade: '', dateFrom: '', dateTo: '',
}

export default function DomesticDashboard() {
  const [page,         setPage]         = useState('overview')
  const [filters,      setFilters]      = useState(EMPTY_FILTERS)
  const [applied,      setApplied]      = useState(EMPTY_FILTERS)
  const [allOptions,   setAllOptions]   = useState({ states: [], districts: [], markets: [], commodities: [], grades: [] })
  const [cascaded,     setCascaded]     = useState({ districts: [], markets: [] })
  const [availDates,   setAvailDates]   = useState({ min: null, max: null })
  const [loadingOpts,  setLoadingOpts]  = useState(true)
  const [loadingDates, setLoadingDates] = useState(false)

  // ── 1. Load base options on mount ──────────────────────────────
  useEffect(() => {
    axios.get(`${API}/api/domestic/filters`)
      .then(r => {
        setAllOptions(r.data)
        setCascaded({ districts: r.data.districts, markets: r.data.markets })
      })
      .catch(console.error)
      .finally(() => setLoadingOpts(false))
  }, [])

  // ── 2. Load available date range when state changes ────────────
  useEffect(() => {
    setLoadingDates(true)
    const params = filters.state ? { state: filters.state } : {}
    axios.get(`${API}/api/domestic/available-dates`, { params })
      .then(r => setAvailDates({
        min: r.data.minDate ? new Date(r.data.minDate) : null,
        max: r.data.maxDate ? new Date(r.data.maxDate) : null,
      }))
      .catch(console.error)
      .finally(() => setLoadingDates(false))
  }, [filters.state])

  // ── 3. Cascade districts + markets when state changes ──────────
  useEffect(() => {
    if (!filters.state) {
      // Reset to full lists when state is cleared
      setCascaded({ districts: allOptions.districts, markets: allOptions.markets })
      return
    }
    axios.get(`${API}/api/domestic/filters`, { params: { state: filters.state } })
      .then(r => setCascaded({ districts: r.data.districts, markets: r.data.markets }))
      .catch(console.error)
  }, [filters.state, allOptions])

  // ── 3b. Cascade markets when district changes ──────────────────
  useEffect(() => {
    if (!filters.district) {
      // District cleared — restore markets to state-level list
      if (!filters.state) {
        setCascaded(prev => ({ ...prev, markets: allOptions.markets }))
      } else {
        axios.get(`${API}/api/domestic/filters`, { params: { state: filters.state } })
          .then(r => setCascaded(prev => ({ ...prev, markets: r.data.markets })))
          .catch(console.error)
      }
      return
    }
    // District selected — fetch markets filtered by state + district
    const params = {}
    if (filters.state)    params.state    = filters.state
    if (filters.district) params.district = filters.district

    axios.get(`${API}/api/domestic/filters`, { params })
      .then(r => setCascaded(prev => ({ ...prev, markets: r.data.markets })))
      .catch(console.error)
  }, [filters.district])

  // ── 4. Auto-apply on every filter change ───────────────────────
  useEffect(() => {
    setApplied({ ...filters })
  }, [filters])

  // ── 5. Change handler with cascade resets ──────────────────────
  const handleChange = (key, val) => {
    setFilters(f => {
      const next = { ...f, [key]: val }
      if (key === 'state')    { next.district = ''; next.market = '' }
      if (key === 'district') { next.market = '' }
      return next
    })
  }

  const handleReset = () => {
    setFilters(EMPTY_FILTERS)
    setCascaded({ districts: allOptions.districts, markets: allOptions.markets })
  }

  // ── Styles ─────────────────────────────────────────────────────
  const inputStyle = {
    padding: '6px 10px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 13,
    color: '#0f172a', background: '#f8fafc',
    width: '100%', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748b' }
  const colStyle   = { display: 'flex', flexDirection: 'column', gap: 4 }

  const dateFromObj = filters.dateFrom ? new Date(filters.dateFrom) : null
  const dateToObj   = filters.dateTo   ? new Date(filters.dateTo)   : null

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* DatePicker global style overrides */}
      <style>{`
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
          padding: 6px 10px; border-radius: 8px;
          border: 1px solid #e2e8f0; font-size: 13px;
          color: #0f172a; background: #f8fafc;
          width: 100%; box-sizing: border-box;
          cursor: pointer; font-family: Arial, sans-serif;
        }
        .react-datepicker__input-container input:focus {
          outline: none; border-color: #2563eb;
        }
        .react-datepicker__day--disabled {
          color: #cbd5e1 !important;
          cursor: not-allowed !important;
        }
        .react-datepicker__day--selected {
          background-color: #2563eb !important;
        }
        .react-datepicker__day--in-range {
          background-color: #eff6ff !important;
          color: #1e40af !important;
        }
        .react-datepicker__day--in-selecting-range {
          background-color: #dbeafe !important;
        }
      `}</style>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '16px 20px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>

          {/* State */}
          <div style={colStyle}>
            <label style={labelStyle}>State</label>
            <select
              value={filters.state}
              onChange={e => handleChange('state', e.target.value)}
              disabled={loadingOpts}
              style={{ ...inputStyle, minWidth: 160, cursor: 'pointer' }}
            >
              <option value=''>All</option>
              {allOptions.states.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* District — cascades from State */}
          <div style={colStyle}>
            <label style={labelStyle}>District</label>
            <select
              value={filters.district}
              onChange={e => handleChange('district', e.target.value)}
              disabled={loadingOpts}
              style={{ ...inputStyle, minWidth: 160, cursor: 'pointer',
                opacity: !filters.state ? 0.5 : 1 }}
            >
              <option value=''>All</option>
              {cascaded.districts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Market — cascades from State + District */}
          <div style={colStyle}>
            <label style={labelStyle}>Market</label>
            <select
              value={filters.market}
              onChange={e => handleChange('market', e.target.value)}
              disabled={loadingOpts}
              style={{ ...inputStyle, minWidth: 180, cursor: 'pointer',
                opacity: !filters.state ? 0.5 : 1 }}
            >
              <option value=''>All</option>
              {cascaded.markets.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Commodity */}
          <div style={colStyle}>
            <label style={labelStyle}>Commodity</label>
            <select
              value={filters.commodity}
              onChange={e => handleChange('commodity', e.target.value)}
              disabled={loadingOpts}
              style={{ ...inputStyle, minWidth: 140, cursor: 'pointer' }}
            >
              <option value=''>All</option>
              {allOptions.commodities.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Grade */}
          <div style={colStyle}>
            <label style={labelStyle}>Grade</label>
            <select
              value={filters.grade}
              onChange={e => handleChange('grade', e.target.value)}
              disabled={loadingOpts}
              style={{ ...inputStyle, minWidth: 100, cursor: 'pointer' }}
            >
              <option value=''>All</option>
              {allOptions.grades.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div style={colStyle}>
            <label style={labelStyle}>
              From
              {loadingDates && <span style={{ color: '#94a3b8', marginLeft: 4 }}>…</span>}
            </label>
            <DatePicker
              selected={dateFromObj}
              onChange={date => handleChange('dateFrom',
                date ? date.toISOString().split('T')[0] : ''
              )}
              selectsStart
              startDate={dateFromObj}
              endDate={dateToObj}
              minDate={availDates.min}
              maxDate={dateToObj || availDates.max}
              dateFormat='dd-MM-yyyy'
              placeholderText='DD-MM-YYYY'
              disabled={loadingDates}
              showMonthDropdown
              showYearDropdown
              dropdownMode='select'
            />
          </div>

          {/* Date To */}
          <div style={colStyle}>
            <label style={labelStyle}>To</label>
            <DatePicker
              selected={dateToObj}
              onChange={date => handleChange('dateTo',
                date ? date.toISOString().split('T')[0] : ''
              )}
              selectsEnd
              startDate={dateFromObj}
              endDate={dateToObj}
              minDate={dateFromObj || availDates.min}
              maxDate={availDates.max}
              dateFormat='dd-MM-yyyy'
              placeholderText='DD-MM-YYYY'
              disabled={loadingDates}
              showMonthDropdown
              showYearDropdown
              dropdownMode='select'
            />
          </div>

          {/* Reset */}
          <div style={colStyle}>
            <label style={{ ...labelStyle, visibility: 'hidden' }}>_</label>
            <button
              onClick={handleReset}
              style={{
                padding: '7px 14px', borderRadius: 8,
                background: 'transparent', color: '#64748b',
                border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13,
              }}
            >
              Reset
            </button>
          </div>

        </div>

        {/* Active filter chips */}
        {[['state', filters.state], ['district', filters.district],
          ['market', filters.market], ['commodity', filters.commodity],
          ['grade', filters.grade]
        ].some(([, v]) => v) && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['state', filters.state], ['district', filters.district],
              ['market', filters.market], ['commodity', filters.commodity],
              ['grade', filters.grade]
            ].filter(([, v]) => v).map(([k, v]) => (
              <span key={k} style={{
                background: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe', borderRadius: 20,
                padding: '2px 10px', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {k}: {v}
                <span
                  onClick={() => handleChange(k, '')}
                  style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                >×</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e2e8f0', marginBottom: 20 }}>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'Arial, sans-serif',
            color: page === p.id ? '#2563eb' : '#64748b',
            borderBottom: page === p.id ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Page Content ───────────────────────────────────────── */}
      {page === 'overview' && <PriceOverview    filters={applied} />}
      {page === 'table'    && <DataTable        filters={applied} />}
      {page === 'trends'   && <MonthlyTrends    filters={applied} />}
      {page === 'markets'  && <MarketComparison filters={applied} />}
    </div>
  )
}
