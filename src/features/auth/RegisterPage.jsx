import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useRegisterMutation, useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'
import { selectLang, toggleLanguage } from '../i18n/langSlice'
import './auth.css'

// Mirror the backend limits (app/api/v1/auth.py, app/schemas/auth.py).
const MIN_PASSWORD_LENGTH = 8
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 50
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/

/* The four-point Vela "sail" mark, shared with the landing. */
function VelaMark({ className }) {
  return (
    <img src="/icon.svg" className={className} width="34" height="34" alt="" aria-hidden="true" />
  )
}

/* All page copy, keyed by language so the shared toggle re-renders everything. */
const COPY = {
  en: {
    asideTitle: 'Get Started with Us',
    asideSub: 'Complete these easy steps to register your account.',
    steps: ['Sign up your account', 'Verify your number', 'Start chatting with Vela'],
    headTitle: 'Sign up account',
    headSub: 'Enter your details to create your account.',
    usernameLabel: 'Username',
    usernamePlaceholder: 'jane.doe',
    phoneLabel: 'Phone number',
    phonePlaceholder: '55 1234 5678',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    show: 'Show',
    hide: 'Hide',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submit: 'Create account',
    submitting: 'Creating account…',
    altPrefix: 'Already have an account?',
    altLink: 'Sign in',
    serverError: 'Registration failed. Please try again.',
    switchTo: 'Español',
    // validation
    passwordRequired: 'Password is required',
    passwordShort: 'Password must be at least 8 characters',
    phoneRequired: 'Phone number is required',
    phoneInvalid: 'Enter a valid phone number',
    usernameRequired: 'Username is required',
    usernameShort: 'Username must be at least 3 characters',
    usernameMax: 'Must be 50 characters or fewer',
    usernamePattern: "Use only letters, digits, '.', '_' and '-'",
  },
  es: {
    asideTitle: 'Comienza con nosotros',
    asideSub: 'Completa estos sencillos pasos para registrar tu cuenta.',
    steps: ['Registra tu cuenta', 'Verifica tu número', 'Empieza a chatear con Vela'],
    headTitle: 'Crear cuenta',
    headSub: 'Ingresa tus datos para crear tu cuenta.',
    usernameLabel: 'Nombre de usuario',
    usernamePlaceholder: 'juana.perez',
    phoneLabel: 'Número de teléfono',
    phonePlaceholder: '55 1234 5678',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Al menos 8 caracteres',
    show: 'Mostrar',
    hide: 'Ocultar',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta…',
    altPrefix: '¿Ya tienes una cuenta?',
    altLink: 'Iniciar sesión',
    serverError: 'El registro falló. Inténtalo de nuevo.',
    switchTo: 'English',
    // validation
    passwordRequired: 'La contraseña es obligatoria',
    passwordShort: 'La contraseña debe tener al menos 8 caracteres',
    phoneRequired: 'El número de teléfono es obligatorio',
    phoneInvalid: 'Ingresa un número de teléfono válido',
    usernameRequired: 'El nombre de usuario es obligatorio',
    usernameShort: 'El nombre de usuario debe tener al menos 3 caracteres',
    usernameMax: 'Debe tener 50 caracteres o menos',
    usernamePattern: "Usa solo letras, dígitos, '.', '_' y '-'",
  },
}

/* Validation messages are keys so they can be resolved in the active language. */
const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'usernameRequired')
    .min(MIN_USERNAME_LENGTH, 'usernameShort')
    .max(MAX_USERNAME_LENGTH, 'usernameMax')
    .regex(USERNAME_PATTERN, 'usernamePattern'),
  phone: z
    .string()
    .min(1, 'phoneRequired')
    .refine((v) => isValidPhoneNumber(v || ''), 'phoneInvalid'),
  password: z
    .string()
    .min(1, 'passwordRequired')
    .min(MIN_PASSWORD_LENGTH, 'passwordShort'),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const lang = useSelector(selectLang)
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [login, { isLoading: isLoggingIn }] = useLoginMutation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const t = COPY[lang]
  /* Map a schema message key to localized text, falling back to the raw key. */
  const tError = (key) => t[key] ?? key

  const {
    register: registerField,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      phone: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await register(data).unwrap()
      // Patients now get a web account: log them straight in and drop them
      // into the chat (the WhatsApp greeting still fires server-side, so both
      // channels stay in sync).
      const result = await login({ phone: data.phone, password: data.password }).unwrap()
      dispatch(setCredentials(result))
      navigate('/chat')
    } catch (err) {
      const detail = err?.data?.detail
      setServerError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(', ')
          : t.serverError
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
              <label className={errors.username ? 'auth-label has-error' : 'auth-label'}>
                {t.usernameLabel}
              </label>
              <input
                {...registerField('username')}
                type="text"
                autoComplete="username"
                maxLength={MAX_USERNAME_LENGTH}
                placeholder={t.usernamePlaceholder}
                className={errors.username ? 'auth-control has-error' : 'auth-control'}
              />
              {errors.username && <p className="auth-error">{tError(errors.username.message)}</p>}
            </div>

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
                {...registerField('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

            <button type="submit" disabled={isRegistering || isLoggingIn} className="auth-submit" style={{ opacity: isRegistering || isLoggingIn ? 0.7 : 1 }}>
              {isRegistering || isLoggingIn ? t.submitting : t.submit}
            </button>
          </form>

          <p className="auth-alt">
            {t.altPrefix} <Link to="/login">{t.altLink}</Link>
          </p>
        </main>
      </div>
    </div>
  )
}
