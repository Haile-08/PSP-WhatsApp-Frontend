import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { useMeQuery } from '../features/auth/authApi'
import { selectToken } from '../features/auth/authSlice'

// `requireAdmin` gates the admin console; without it, the route accepts
// any signed-in user but bounces admins to `/admin` so they don't end up
// in the patient-facing chat. Profile is only fetched once a token exists,
// so the login page never triggers a /auth/me call.
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = useSelector(selectToken)
  const { data: me, isFetching } = useMeQuery(undefined, { skip: !token })

  if (!token) return <Navigate to="/login" replace />

  if (isFetching && !me) return null

  if (requireAdmin) {
    if (me && me.role !== 'admin') return <Navigate to="/" replace />
  } else if (me && me.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}
