import { useState } from 'react'
import axios from 'axios'

export default function Login({ onLogin, onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
      }}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🌾</div>

        <h1 style={{
          color: '#f1f5f9', fontSize: 22, fontWeight: 800,
          textAlign: 'center', margin: '0 0 6px',
          fontFamily: 'Syne, sans-serif',
        }}>
          MNTP Dashboard
        </h1>

        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
          Sign in to your account
        </p>

        {error && (
          <div style={{
            background: '#1c0a0a', border: '1px solid #7f1d1d',
            color: '#fca5a5', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              style={{
                background: '#1e293b', border: '1px solid #334155',
                borderRadius: 8, color: '#f1f5f9',
                padding: '10px 14px', fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                background: '#1e293b', border: '1px solid #334155',
                borderRadius: 8, color: '#f1f5f9',
                padding: '10px 14px', fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#00d4aa', color: '#0a0e1a',
              border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 14, fontWeight: 700,
              marginTop: 4, fontFamily: 'inherit',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          Don't have an account?{' '}
          <span
            onClick={onSwitch}
            style={{ color: '#00d4aa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  )
}