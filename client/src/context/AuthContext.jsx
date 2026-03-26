/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')

    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch {
        // ignore
      }
    }
    const storedToken = localStorage.getItem('token')
    const payload = storedToken ? decodeJwtPayload(storedToken) : null
    return payload ? { id: payload.id, role: payload.role } : null
  })
  const loading = false

  const value = useMemo(() => {
    const login = async ({ email, password }) => {
      const res = await api.post('/api/auth/login', { email, password })
      const { token: newToken, user: userFromApi } = res.data

      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userFromApi))
      setToken(newToken)
      setUser(userFromApi)

      return userFromApi
    }

    const register = async ({ name, email, password, role }) => {
      await api.post('/api/auth/register', { name, email, password, role })
    }

    const logout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }

    return {
      token,
      user,
      loading,
      login,
      register,
      logout
    }
  }, [token, user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

