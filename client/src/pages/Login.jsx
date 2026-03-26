import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const user = await login({ email, password })
      navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Login failed'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
        <div className="mb-5">
          <Logo />
        </div>

        <h1 className="text-xl md:text-2xl font-semibold text-blue-900 mb-2">Sign in</h1>
        <p className="text-sm text-slate-600 mb-6">Access your role dashboard.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="text-sm text-red-700">{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#3b82f6] text-white py-2 font-medium hover:bg-[#2563eb] disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          No account?{' '}
          <Link className="text-blue-700 hover:underline" to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

