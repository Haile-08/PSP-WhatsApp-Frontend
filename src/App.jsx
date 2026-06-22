import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './app/store'
import ProtectedRoute from './components/ProtectedRoute'
import AdminPage from './features/admin/AdminPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ConsentPage from './features/consent/ConsentPage'
import LandingPage from './features/landing/LandingPage'

// Patients register here (username + phone + password); the enrollment
// conversation then continues entirely over WhatsApp — there is no web chat.
// The admin console at /admin remains gated to admins.
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}
