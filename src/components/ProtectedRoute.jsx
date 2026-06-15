import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { useMeQuery } from '../features/auth/authApi'
import { selectToken } from '../features/auth/authSlice'

// Gates the admin console: the web app now serves admins only — patients
// register here and continue on WhatsApp, so there is no patient-facing
// route to fall back to. A signed-in non-admin is sent back to the landing
// page. Profile is only fetched once a token exists, so the login page never
// triggers a /auth/me call.
export default function ProtectedRoute({ children, requireAdmin = true }) {
  const token = useSelector(selectToken)
  const { data: me, isFetching } = useMeQuery(undefined, { skip: !token })

  if (!token) return <Navigate to="/login" replace />

  if (isFetching && !me) return null

  if (requireAdmin && me && me.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
