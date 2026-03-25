import { useState } from 'react'
import axios from 'axios'

export default function Register({ onLogin, onSwitch }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', companyName: '', role: ''
  })
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
      const res = await axios.post('http://localhost:5000/api/auth/register', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'name',        label: 'Full Name',    type: 'text',     placeholder: 'John Doe' },
    { name: 'email',       label: 'Email',        type: 'email',    placeholder: 'you@company.com' },
    { name: 'password',    label: 'Password',     type: 'password', placeholder: '••••••••' },
    { name: 'companyName', label: 'Company Name', type: 'text',     placeholder: 'Acme Corp' },
    { name: 'role',        label: 'Role',         type: 'text',     placeholder: 'Analyst, Manager...' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 0',
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
          Create your account
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
          {fields.map(f => (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {f.label}
              </label>
              <input
                name={f.name}
                type={f.type}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                required
                style={{
                  background: '#1e293b', border: '1px solid #334155',
                  borderRadius: 8, color: '#f1f5f9',
                  padding: '10px 14px', fontSize: 14,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          ))}

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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          Already have an account?{' '}
          <span
            onClick={onSwitch}
            style={{ color: '#00d4aa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  )
}