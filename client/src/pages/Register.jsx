import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthShell from '../components/AuthShell'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading, token, user } = useAuth()
  const { theme } = useTheme()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('author')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      await register({ name, email, password, role })
      setSuccess('Account created. You can sign in now.')
      setTimeout(() => navigate('/login', { replace: true }), 600)
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Registration failed'
      setError(message)
    }
  }

  if (token && user?.role) {
    if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Register for an author, reviewer, editor, or admin role."
      footer={
        <>
          Already have an account?{' '}
          <Link className="text-white font-semibold hover:underline" to="/login">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Name</label>
          <input
            value={name}
            onChange={(e) => {
              setError(null)
              setSuccess(null)
              setName(e.target.value)
            }}
            type="text"
            required
            className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400' : 'border-white/15 bg-white/5 text-white placeholder:text-slate-400'}`}
            placeholder="Full name"
            autoComplete="name"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Email</label>
          <input
            value={email}
            onChange={(e) => {
              setError(null)
              setSuccess(null)
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
              setSuccess(null)
              setPassword(e.target.value)
            }}
            type="password"
            required
            className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400' : 'border-white/15 bg-white/5 text-white placeholder:text-slate-400'}`}
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Role</label>
          <select
            value={role}
            onChange={(e) => {
              setError(null)
              setSuccess(null)
              setRole(e.target.value)
            }}
            className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'light' ? 'border-slate-300 bg-white text-slate-900' : 'border-white/15 bg-white/5 text-white'}`}
          >
            <option value="author" className={theme === 'light' ? 'text-slate-900' : 'text-slate-900 bg-white'}>Author</option>
            <option value="reviewer" className={theme === 'light' ? 'text-slate-900' : 'text-slate-900 bg-white'}>Reviewer</option>
            <option value="editor" className={theme === 'light' ? 'text-slate-900' : 'text-slate-900 bg-white'}>Editor</option>
            <option value="admin" className={theme === 'light' ? 'text-slate-900' : 'text-slate-900 bg-white'}>Admin</option>
          </select>
        </div>

        {success ? <div className="text-sm text-green-200 font-medium">{success}</div> : null}
        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#3b82f6] text-white py-2.5 font-semibold hover:bg-[#2563eb] disabled:opacity-60 transition"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}

