import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, token, user } = useAuth()
  const { theme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const user = await login({ email, password })
      if (user.role === 'admin') navigate('/admin/analytics', { replace: true })
      else navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Login failed'
      setError(message)
    }
  }

  if (token && user?.role) {
    if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your role dashboard and manage submissions, reviews, and decisions."
      footer={
        <>
          No account?{' '}
          <Link className="text-white font-semibold hover:underline" to="/register">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Email</label>
          <input
            value={email}
            onChange={(e) => {
              setError(null)
              setEmail(e.target.value)
            }}
            type="email"
            required
            className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400' : 'border-white/15 bg-white/5 text-white placeholder:text-slate-400'}`}
            placeholder="name@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Password</label>
          <input
            value={password}
            onChange={(e) => {
              setError(null)
              setPassword(e.target.value)
            }}
            type="password"
            required
            className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400' : 'border-white/15 bg-white/5 text-white placeholder:text-slate-400'}`}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#3b82f6] text-white py-2.5 font-semibold hover:bg-[#2563eb] disabled:opacity-60 transition"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </AuthShell>
  )
}

