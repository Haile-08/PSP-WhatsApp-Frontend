import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'
import './auth.css'

/* The four-point Vela "sail" mark, shared with the landing. */
function VelaMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1.5C12 7 17 12 22.5 12C17 12 12 17 12 22.5C12 17 7 12 1.5 12C7 12 12 7 12 1.5Z"
        fill="var(--accent)"
      />
    </svg>
  )
}

const STEPS = [
  'Sign in to your account',
  'Pick up your conversation',
  'Vela has you covered',
]

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((v) => isValidPhoneNumber(v || ''), 'Enter a valid phone number'),
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
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { phone: '' } })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const result = await login(data).unwrap()
      dispatch(setCredentials(result))
      navigate('/chat')
    } catch {
      setServerError('Invalid phone or password. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* LEFT — green gradient aside with the landing's hatch lines */}
        <aside className="auth-aside">
          <div className="auth-brand">
            <VelaMark className="mark" />
            <span>Vela</span>
          </div>

          <div className="auth-aside-copy">
            <div className="auth-aside-head">
              <h2 className="auth-aside-title">Welcome Back</h2>
              <p className="auth-aside-sub">
                Sign in to pick up right where you left off.
              </p>
            </div>

            <div className="auth-steps">
              {STEPS.map((title, i) => (
                <div key={title} className={i === 0 ? 'auth-step is-active' : 'auth-step'}>
                  <span className="auth-step-num">{i + 1}</span>
                  <p className="auth-step-title">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT — the form */}
        <main className="auth-main">
          <div className="auth-main-head">
            <h1>Sign in</h1>
            <p>Welcome back. How are you feeling today?</p>
          </div>

          {serverError && <div className="auth-server-error">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label className={errors.phone ? 'auth-label has-error' : 'auth-label'}>
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
                    className={errors.phone ? 'auth-phone-error' : undefined}
                  />
                )}
              />
              {errors.phone && <p className="auth-error">{errors.phone.message}</p>}
            </div>

            <div className="auth-field">
              <label className={errors.password ? 'auth-label has-error' : 'auth-label'}>
                Password
              </label>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={errors.password ? 'auth-control has-error' : 'auth-control'}
                style={{ paddingRight: '54px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="auth-pw-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              {errors.password && <p className="auth-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="auth-submit" style={{ opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-alt">
            Don&apos;t have an account? <Link to="/register">Create account</Link>
          </p>
        </main>
      </div>
    </div>
  )
}
