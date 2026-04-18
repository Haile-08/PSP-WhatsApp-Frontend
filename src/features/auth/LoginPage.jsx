import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const result = await login(data).unwrap()
      dispatch(setCredentials(result))
      navigate('/')
    } catch {
      setServerError('Invalid email or password. Please try again.')
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="w-full h-[120px]" style={{ backgroundColor: '#00a884' }} />

      <div className="flex-1 flex items-start justify-center" style={{ marginTop: '-40px' }}>
        <div
          className="w-full bg-white rounded"
          style={{ maxWidth: '500px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', padding: '40px 48px 48px' }}
        >
          <div className="text-center mb-8">
            <h1 className="font-wa font-medium" style={{ fontSize: '22px', color: '#00a884' }}>
              PSP Assist
            </h1>
            <p className="mt-2 font-wa" style={{ fontSize: '16px', color: '#667781' }}>
              Welcome back. How are you feeling today?
            </p>
          </div>

          {serverError && (
            <div
              className="mb-4 rounded px-3 py-2 text-sm font-wa"
              style={{ backgroundColor: '#fde8e8', color: '#c53030', fontSize: '13px' }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <label
                className="absolute top-0 left-0 font-wa"
                style={{ fontSize: '12px', color: errors.email ? '#c53030' : '#00a884', fontWeight: 500 }}
              >
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="auth-input font-wa"
                style={{ paddingTop: '20px', borderColor: errors.email ? '#c53030' : undefined }}
              />
              {errors.email && (
                <p className="mt-1 font-wa" style={{ fontSize: '11px', color: '#c53030' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                className="absolute top-0 left-0 font-wa"
                style={{ fontSize: '12px', color: errors.password ? '#c53030' : '#00a884', fontWeight: 500 }}
              >
                Password
              </label>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="auth-input font-wa"
                style={{ paddingTop: '20px', paddingRight: '40px', borderColor: errors.password ? '#c53030' : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 font-wa"
                style={{ top: '50%', transform: 'translateY(-25%)', background: 'none', border: 'none', cursor: 'pointer', color: '#667781', fontSize: '12px', padding: '0 4px' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              {errors.password && (
                <p className="mt-1 font-wa" style={{ fontSize: '11px', color: '#c53030' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="auth-btn font-wa"
                style={{ opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center font-wa" style={{ fontSize: '14px', color: '#667781' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: '#00a884', fontWeight: 500 }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
