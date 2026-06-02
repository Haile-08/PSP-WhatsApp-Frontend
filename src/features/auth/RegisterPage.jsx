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
  'Sign up your account',
  'Verify your number',
  'Start chatting with Vela',
]

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
      navigate('/chat')
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
    <div className="auth-page">
      <div className="auth-shell">
        {/* LEFT — green gradient aside with the landing's hatch lines */}
        <aside className="auth-aside">
          <Link className="auth-brand" to="/">
            <VelaMark className="mark" />
            <span>Vela</span>
          </Link>

          <div className="auth-aside-copy">
            <div className="auth-aside-head">
              <h2 className="auth-aside-title">Get Started with Us</h2>
              <p className="auth-aside-sub">
                Complete these easy steps to register your account.
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
            <h1>Sign up account</h1>
            <p>Enter your details to create your account.</p>
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
              <label className={errors.username ? 'auth-label has-error' : 'auth-label'}>
                Username
              </label>
              <input
                {...registerField('username')}
                type="text"
                autoComplete="username"
                maxLength={50}
                placeholder="Your name"
                className={errors.username ? 'auth-control has-error' : 'auth-control'}
              />
              {errors.username && <p className="auth-error">{errors.username.message}</p>}
            </div>

            <div className="auth-field">
              <label className={errors.date_of_birth ? 'auth-label has-error' : 'auth-label'}>
                Date of birth
              </label>
              <input
                {...registerField('date_of_birth')}
                type="date"
                autoComplete="bday"
                max={todayIso}
                className={errors.date_of_birth ? 'auth-control has-error' : 'auth-control'}
              />
              {errors.date_of_birth && <p className="auth-error">{errors.date_of_birth.message}</p>}
            </div>

            <div className="auth-field">
              <label className={errors.password ? 'auth-label has-error' : 'auth-label'}>
                Password
              </label>
              <input
                {...registerField('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

            <button type="submit" disabled={isRegistering} className="auth-submit" style={{ opacity: isRegistering ? 0.7 : 1 }}>
              {isRegistering ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </main>
      </div>
    </div>
  )
}
