import { useState, useEffect } from 'react'
import { buildIndex } from './data/loader'
import { COLORS } from './constants'
import MarketOverview from './components/MarketOverview'
import ProductTrends from './components/ProductTrends'
import CountryIntelligence from './components/CountryIntelligence'
import DomesticDashboard from './components/DomesticDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Feedback from './pages/Feedback'

const NAV = [
  { id: 'overview',  label: '📊 Overview' },
  { id: 'commodity', label: '🌿 Commodities' },
  { id: 'country',   label: '🌍 Countries' },
]

const MODES = [
  { id: 'export',   label: '✈️ Import / Export' },
  { id: 'domestic', label: '🏪 Domestic Trades'  },
]

export default function App() {
  const [user, setUser]                 = useState(null)
  const [authPage, setAuthPage]         = useState('login')
  const [data, setData]                 = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [view, setView]                 = useState('overview')
  const [mode, setMode]                 = useState('export')       // ← new
  const [showFeedback, setShowFeedback] = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (!user) return
    import('./data/apeda_compact.json')
      .then(mod => {
        setData(buildIndex(mod.default ?? mod))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [user])

  const handleLogin  = (userData) => setUser(userData)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setData(null)
    setLoading(true)
    setAuthPage('login')
    setMenuOpen(false)
  }

  if (!user) {
    if (authPage === 'register') {
      return <Register onLogin={handleLogin} onSwitch={() => setAuthPage('login')} />
    }
    return <Login onLogin={handleLogin} onSwitch={() => setAuthPage('register')} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>

          {/* Top row: logo + mode switcher + nav + user */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', height: 56,
          }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, flexShrink: 0,
              }}>
                🌾
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  MNTP Trade Intelligence
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                  India Agri-Export Analytics • 2020–25
                </div>
              </div>
            </div>

            {/* Mode switcher — centre of header */}
            <div className="desktop-nav" style={{
              display: 'flex', alignItems: 'center',
              background: '#f1f5f9', borderRadius: 10,
              padding: 3, gap: 2,
            }}>
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    fontFamily: 'Arial, sans-serif',
                    whiteSpace: 'nowrap',
                    background: mode === m.id ? '#ffffff' : 'transparent',
                    color:      mode === m.id ? '#2563eb' : '#64748b',
                    boxShadow:  mode === m.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Hamburger for mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'transparent', border: 'none',
                fontSize: 22, cursor: 'pointer', color: '#64748b',
                padding: '4px 8px',
              }}
              className="hamburger"
            >
              {menuOpen ? '✕' : '☰'}
            </button>

            {/* Desktop right side */}
            <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* Export sub-nav — hidden in domestic mode */}
              {mode === 'export' && NAV.map(item => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    fontFamily: 'Arial, sans-serif',
                    background: view === item.id ? '#eff6ff' : 'transparent',
                    color: view === item.id ? '#2563eb' : '#64748b',
                    borderBottom: view === item.id ? '2px solid #2563eb' : '2px solid transparent',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </button>
              ))}

              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {user.role} · {user.companyName}
                </div>
              </div>

              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  color: '#2563eb', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
                }}
              >
                Feedback
              </button>

              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent', border: '1px solid #e2e8f0',
                  color: '#64748b', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer',
                  fontSize: 12, fontFamily: 'Arial, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                padding: '12px 0', display: 'flex',
                flexDirection: 'column', gap: 4,
              }}
              className="mobile-menu"
            >
              {/* User info */}
              <div style={{
                padding: '8px 12px', background: '#f8fafc',
                borderRadius: 8, marginBottom: 8,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{user.role} · {user.companyName}</div>
              </div>

              {/* Mode switcher */}
              <div style={{
                display: 'flex', background: '#f1f5f9',
                borderRadius: 10, padding: 3, gap: 2,
                marginBottom: 8,
              }}>
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setMenuOpen(false) }}
                    style={{
                      flex: 1, padding: '7px 8px', borderRadius: 8,
                      border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700,
                      fontFamily: 'Arial, sans-serif',
                      background: mode === m.id ? '#ffffff' : 'transparent',
                      color:      mode === m.id ? '#2563eb' : '#64748b',
                      boxShadow:  mode === m.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Export nav items — hidden in domestic mode */}
              {mode === 'export' && NAV.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setMenuOpen(false) }}
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600,
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'left',
                    background: view === item.id ? '#eff6ff' : 'transparent',
                    color: view === item.id ? '#2563eb' : '#64748b',
                  }}
                >
                  {item.label}
                </button>
              ))}

              {/* Feedback + Logout */}
              <button
                onClick={() => { setShowFeedback(true); setMenuOpen(false) }}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #bfdbfe', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  fontFamily: 'Arial, sans-serif',
                  textAlign: 'left',
                  background: '#eff6ff', color: '#2563eb',
                  marginTop: 4,
                }}
              >
                💬 Feedback
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #e2e8f0', cursor: 'pointer',
                  fontSize: 14, fontFamily: 'Arial, sans-serif',
                  textAlign: 'left',
                  background: 'transparent', color: '#64748b',
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '16px' }}>

        {/* ── Domestic mode ── */}
        {mode === 'domestic' && <DomesticDashboard />}

        {/* ── Export mode ── (completely untouched) */}
        {mode === 'export' && (
          <>
            {loading && (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 400, gap: 16,
              }}>
                <div style={{
                  width: 48, height: 48,
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading trade data…</p>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 12, padding: 24, color: '#dc2626',
              }}>
                <strong>Error loading data:</strong> {error}
              </div>
            )}

            {data && !loading && (
              <>
                {view === 'overview'  && <MarketOverview data={data} />}
                {view === 'commodity' && <ProductTrends data={data} />}
                {view === 'country'   && <CountryIntelligence data={data} />}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '16px', textAlign: 'center',
        fontSize: 11, color: '#94a3b8', marginTop: 40,
        fontFamily: 'Arial, sans-serif',
      }}>
        MNTP Trade Intelligence Dashboard
      </footer>

      {/* Feedback modal */}
      {showFeedback && (
        <Feedback user={user} onClose={() => setShowFeedback(false)} />
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hamburger { display: block !important; }
          .desktop-nav { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .hamburger { display: none !important; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}