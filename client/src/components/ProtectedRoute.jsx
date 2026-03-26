import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function roleHome(role) {
  if (role === 'admin') return '/admin/analytics'
  return role ? `/${role}/dashboard` : '/login'
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { token, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-navy-900">
        Loading...
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (allowedRoles?.length && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to={roleHome(user?.role)} replace />
  }

  return children
}

