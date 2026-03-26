import { useState, useEffect } from 'react'
import { buildIndex } from './data/loader'
import { COLORS } from './constants'
import MarketOverview from './components/MarketOverview'
import ProductTrends from './components/ProductTrends'
import CountryIntelligence from './components/CountryIntelligence'
import Login from './pages/Login'
import Register from './pages/Register'
import Feedback from './pages/Feedback'

const NAV = [
  { id: 'overview',  label: '📊 Market Overview' },
  { id: 'commodity', label: '🌿 Commodity Trends' },
  { id: 'country',   label: '🌍 Country Intelligence' },
]

export default function App() {
  const [user, setUser]             = useState(null)
  const [authPage, setAuthPage]     = useState('login')
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [view, setView]             = useState('overview')
  const [showFeedback, setShowFeedback] = useState(false)

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

  const handleLogin = (userData) => setUser(userData)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setData(null)
    setLoading(true)
    setAuthPage('login')
  }

  if (!user) {
    if (authPage === 'register') {
      return <Register onLogin={handleLogin} onSwitch={() => setAuthPage('login')} />
    }
    return <Login onLogin={handleLogin} onSwitch={() => setAuthPage('register')} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18,
              }}>
                🌾
              </div>
              <div>
                <div style={{
                  fontSize: 16, fontWeight: 800,
                  fontFamily: 'Arial, sans-serif',
                  color: '#0f172a', lineHeight: 1.2,
                }}>
                  MNTP Trade Intelligence
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
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
                    fontSize: 13, fontWeight: 600,
                    fontFamily: 'Arial, sans-serif',
                    background: view === item.id ? '#eff6ff' : 'transparent',
                    color: view === item.id ? '#2563eb' : '#64748b',
                    borderBottom: view === item.id
                      ? '2px solid #2563eb'
                      : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {user.role} · {user.companyName}
                </div>
              </div>

              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  borderRadius: 8,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                Feedback
              </button>

              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: 8,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
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
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '16px 24px', textAlign: 'center',
        fontSize: 11, color: '#94a3b8', marginTop: 40,
        fontFamily: 'Arial, sans-serif',
      }}>
        MNTP Trade Intelligence Dashboard • Data: Agricultural &amp; Processed Food Products
        Export Development Authority • Values in USD Million
      </footer>

      {/* Feedback modal */}
      {showFeedback && (
        <Feedback user={user} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  )
}

