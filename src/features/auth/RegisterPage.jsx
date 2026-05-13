import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useRegisterMutation, useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const registerSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((v) => isValidPhoneNumber(v || ''), 'Enter a valid phone number'),
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(50, 'Username must be 50 characters or fewer'),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(ISO_DATE, 'Use the date picker (YYYY-MM-DD)')
    .refine((v) => {
      const d = new Date(v)
      return !Number.isNaN(d.getTime()) && d <= new Date()
    }, 'Date of birth cannot be in the future')
    .refine((v) => {
      const d = new Date(v)
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - 120)
      return d >= cutoff
    }, 'Date of birth is implausibly old'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be 64 characters or fewer')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [login] = useLoginMutation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register: registerField,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: '', username: '', date_of_birth: '' },
  })

  // Block the native date picker from selecting future dates.
  const todayIso = new Date().toISOString().slice(0, 10)

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await register(data).unwrap()
      // /auth/register returns user info but not a usable session token shape;
      // immediately log in to obtain the bearer token.
      const tokenResp = await login({ phone: data.phone, password: data.password }).unwrap()
      dispatch(setCredentials(tokenResp))
      navigate('/')
    } catch (err) {
      const detail = err?.data?.detail
      setServerError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(', ')
          : 'Registration failed. Please try again.'
      )
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
              Sign up with your phone number to get started.
            </p>
          </div>

          {serverError && (
            <div
              className="mb-4 rounded px-3 py-2 font-wa"
              style={{ backgroundColor: '#fde8e8', color: '#c53030', fontSize: '13px' }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <label
                className="absolute top-0 left-0 font-wa"
                style={{ fontSize: '12px', color: errors.phone ? '#c53030' : '#00a884', fontWeight: 500 }}
              >
                Phone number
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    international
                    defaultCountry="MX"
                    countryCallingCodeEditable={false}
                    placeholder="55 1234 5678"
                    className="auth-input font-wa"
                    style={{ paddingTop: '20px', borderColor: errors.phone ? '#c53030' : undefined }}
                  />
                )}
              />
              {errors.phone && (
                <p className="mt-1 font-wa" style={{ fontSize: '11px', color: '#c53030' }}>
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                className="absolute top-0 left-0 font-wa"
                style={{ fontSize: '12px', color: errors.username ? '#c53030' : '#00a884', fontWeight: 500 }}
              >
                Username
              </label>
              <input
                {...registerField('username')}
                type="text"
                autoComplete="username"
                maxLength={50}
                placeholder="Your name"
                className="auth-input font-wa"
                style={{ paddingTop: '20px', borderColor: errors.username ? '#c53030' : undefined }}
              />
              {errors.username && (
                <p className="mt-1 font-wa" style={{ fontSize: '11px', color: '#c53030' }}>
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                className="absolute top-0 left-0 font-wa"
                style={{ fontSize: '12px', color: errors.date_of_birth ? '#c53030' : '#00a884', fontWeight: 500 }}
              >
                Date of birth
              </label>
              <input
                {...registerField('date_of_birth')}
                type="date"
                autoComplete="bday"
                max={todayIso}
                className="auth-input font-wa"
                style={{ paddingTop: '20px', borderColor: errors.date_of_birth ? '#c53030' : undefined }}
              />
              {errors.date_of_birth && (
                <p className="mt-1 font-wa" style={{ fontSize: '11px', color: '#c53030' }}>
                  {errors.date_of_birth.message}
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
                {...registerField('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
                disabled={isRegistering}
                className="auth-btn font-wa"
                style={{ opacity: isRegistering ? 0.7 : 1 }}
              >
                {isRegistering ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center font-wa" style={{ fontSize: '14px', color: '#667781' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00a884', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
