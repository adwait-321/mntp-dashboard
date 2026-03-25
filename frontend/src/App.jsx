import { useState, useEffect } from 'react'
import { buildIndex } from './data/loader'
import { COLORS } from './constants'
import MarketOverview from './components/MarketOverview'
import ProductTrends from './components/ProductTrends'
import CountryIntelligence from './components/CountryIntelligence'
import Login from './pages/Login'
import Register from './pages/Register'

const NAV = [
  { id: 'overview',  label: '📊 Market Overview' },
  { id: 'commodity', label: '🌿 Commodity Trends' },
  { id: 'country',   label: '🌍 Country Intelligence' },
]

export default function App() {
  const [user, setUser]         = useState(null)
  const [authPage, setAuthPage] = useState('login')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [view, setView]         = useState('overview')

  // Restore session on page load
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  // Load trade data once user is logged in
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

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setData(null)
    setLoading(true)
    setAuthPage('login')
  }

  // Auth screens
  if (!user) {
    if (authPage === 'register') {
      return <Register onLogin={handleLogin} onSwitch={() => setAuthPage('login')} />
    }
    return <Login onLogin={handleLogin} onSwitch={() => setAuthPage('register')} />
  }

  // Dashboard
  return (
    <div style={{ minHeight: '100vh', background: COLORS.darkBg, color: COLORS.text }}>

      <header style={{
        background: '#0d1424',
        borderBottom: `1px solid ${COLORS.border}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            height: 64, gap: 20, flexWrap: 'wrap',
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'linear-gradient(135deg, #00d4aa, #7c3aed)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18,
              }}>
                🌾
              </div>
              <div>
                <div style={{
                  fontSize: 16, fontWeight: 800,
                  fontFamily: "'Syne', sans-serif",
                  color: COLORS.text, lineHeight: 1.2,
                }}>
                  MNTP Trade Intelligence
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>
                  India Agri-Export Analytics • 2020–25
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', gap: 4 }}>
              {NAV.map(item => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    background: view === item.id ? '#00d4aa15' : 'transparent',
                    color: view === item.id ? COLORS.accent : COLORS.subtle,
                    borderBottom: view === item.id
                      ? `2px solid ${COLORS.accent}`
                      : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User info + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>
                  {user.role} · {user.companyName}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.subtle,
                  borderRadius: 8,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'inherit',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: 400, gap: 16,
          }}>
            <div style={{
              width: 48, height: 48,
              border: `3px solid ${COLORS.border}`,
              borderTopColor: COLORS.accent,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: COLORS.muted, fontSize: 14 }}>Loading trade data…</p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#1c0a0a', border: '1px solid #7f1d1d',
            borderRadius: 12, padding: 24, color: '#fca5a5',
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
      </main>

      <footer style={{
        borderTop: `1px solid ${COLORS.border}`,
        padding: '16px 24px', textAlign: 'center',
        fontSize: 11, color: '#374151', marginTop: 40,
      }}>
        MNTP Trade Intelligence Dashboard • Data: Agricultural &amp; Processed Food Products
        Export Development Authority • Values in USD Million
      </footer>
    </div>
  )
}