import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { authApi, useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'
import { selectLang, toggleLanguage } from '../i18n/langSlice'
import './auth.css'

/* The four-point Vela "sail" mark, shared with the landing. */
function VelaMark({ className }) {
  return (
    <img src="/icon.svg" className={className} width="34" height="34" alt="" aria-hidden="true" />
  )
}

/* All page copy, keyed by language so a single toggle re-renders everything. */
const COPY = {
  en: {
    asideTitle: 'Welcome Back',
    asideSub: 'Sign in to pick up right where you left off.',
    steps: [
      'Sign in to your account',
      'Pick up your conversation',
      'Vela has you covered',
    ],
    headTitle: 'Sign in',
    headSub: 'Welcome back. How are you feeling today?',
    phoneLabel: 'Phone number',
    phonePlaceholder: '55 1234 5678',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    show: 'Show',
    hide: 'Hide',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    serverError: 'Invalid phone or password. Please try again.',
    phoneRequired: 'Phone number is required',
    phoneInvalid: 'Enter a valid phone number',
    passwordRequired: 'Password is required',
    switchTo: 'Español',
  },
  es: {
    asideTitle: 'Bienvenido de nuevo',
    asideSub: 'Inicia sesión para continuar justo donde lo dejaste.',
    steps: [
      'Inicia sesión en tu cuenta',
      'Retoma tu conversación',
      'Vela te tiene cubierto',
    ],
    headTitle: 'Iniciar sesión',
    headSub: 'Bienvenido de nuevo. ¿Cómo te sientes hoy?',
    phoneLabel: 'Número de teléfono',
    phonePlaceholder: '55 1234 5678',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Ingresa tu contraseña',
    show: 'Mostrar',
    hide: 'Ocultar',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    submit: 'Iniciar sesión',
    submitting: 'Iniciando sesión…',
    serverError: 'Teléfono o contraseña no válidos. Inténtalo de nuevo.',
    phoneRequired: 'El número de teléfono es obligatorio',
    phoneInvalid: 'Ingresa un número de teléfono válido',
    passwordRequired: 'La contraseña es obligatoria',
    switchTo: 'English',
  },
}

/* Validation messages are keys so they can be resolved in the active language. */
const loginSchema = z.object({
  phone: z
    .string()
    .min(1, 'phoneRequired')
    .refine((v) => isValidPhoneNumber(v || ''), 'phoneInvalid'),
  password: z.string().min(1, 'passwordRequired'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const lang = useSelector(selectLang)

  const t = COPY[lang]
  /* Map a schema message key to localized text, falling back to the raw key. */
  const tError = (key) => t[key] ?? key

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
      // Route by role: admins to the operator console, patients to the chat.
      const me = await dispatch(
        authApi.endpoints.me.initiate(undefined, { forceRefetch: true })
      ).unwrap()
      navigate(me?.role === 'admin' ? '/admin' : '/chat')
    } catch {
      setServerError(t.serverError)
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
              <h2 className="auth-aside-title">{t.asideTitle}</h2>
              <p className="auth-aside-sub">{t.asideSub}</p>
            </div>

            <div className="auth-steps">
              {t.steps.map((title, i) => (
                <div key={i} className={i === 0 ? 'auth-step is-active' : 'auth-step'}>
                  <span className="auth-step-num">{i + 1}</span>
                  <p className="auth-step-title">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT — the form */}
        <main className="auth-main">
          <button
            type="button"
            className="auth-lang-toggle"
            onClick={() => dispatch(toggleLanguage())}
          >
            {t.switchTo}
          </button>

          <div className="auth-main-head">
            <h1>{t.headTitle}</h1>
            <p>{t.headSub}</p>
          </div>

          {serverError && <div className="auth-server-error">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label className={errors.phone ? 'auth-label has-error' : 'auth-label'}>
                {t.phoneLabel}
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
                    placeholder={t.phonePlaceholder}
                    className={errors.phone ? 'auth-phone-error' : undefined}
                  />
                )}
              />
              {errors.phone && <p className="auth-error">{tError(errors.phone.message)}</p>}
            </div>

            <div className="auth-field">
              <label className={errors.password ? 'auth-label has-error' : 'auth-label'}>
                {t.passwordLabel}
              </label>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t.passwordPlaceholder}
                className={errors.password ? 'auth-control has-error' : 'auth-control'}
                style={{ paddingRight: '54px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="auth-pw-toggle"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? t.hide : t.show}
              </button>
              {errors.password && <p className="auth-error">{tError(errors.password.message)}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="auth-submit" style={{ opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? t.submitting : t.submit}
            </button>
          </form>

          <p className="auth-alt">
            {lang === 'es' ? '¿No tienes una cuenta?' : "Don't have an account?"}{' '}
            <Link to="/register">{lang === 'es' ? 'Crear cuenta' : 'Create account'}</Link>
          </p>
        </main>
      </div>
    </div>
  )
}
