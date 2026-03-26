import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import AuthorDashboard from './pages/author/Dashboard'
import SubmitPaper from './pages/author/Submit'
import RevisePaper from './pages/author/Revise'
import ReviewerDashboard from './pages/reviewer/Dashboard'
import ReviewForm from './pages/reviewer/ReviewForm'
import EditorDashboard from './pages/editor/Dashboard'
import AssignReviewer from './pages/editor/Assign'
import DecideSubmission from './pages/editor/Decide'
import AdminAnalytics from './pages/admin/Analytics'

function HomeRedirect() {
  const { token, loading, user } = useAuth()
  if (loading) return null
  if (!token) return <Landing />
  if (!user?.role) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />
  return <Navigate to={`/${user.role}/dashboard`} replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/author/dashboard"
              element={
                <ProtectedRoute allowedRoles={['author']}>
                  <AuthorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/author/submit"
              element={
                <ProtectedRoute allowedRoles={['author']}>
                  <SubmitPaper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/author/revise/:submissionId"
              element={
                <ProtectedRoute allowedRoles={['author']}>
                  <RevisePaper />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reviewer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['reviewer']}>
                  <ReviewerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviewer/review/:submissionId"
              element={
                <ProtectedRoute allowedRoles={['reviewer']}>
                  <ReviewForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/editor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['editor']}>
                  <EditorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/assign/:submissionId"
              element={
                <ProtectedRoute allowedRoles={['editor']}>
                  <AssignReviewer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/decide/:submissionId"
              element={
                <ProtectedRoute allowedRoles={['editor']}>
                  <DecideSubmission />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

