import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useRegisterMutation } from './authApi'
import { selectLang, toggleLanguage } from '../i18n/langSlice'
import './auth.css'

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
    phoneLabel: 'Phone number',
    phonePlaceholder: '55 1234 5678',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Your name',
    dobLabel: 'Date of birth',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
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
    // post-registration success (conversation continues on WhatsApp)
    successTitle: 'You’re all set!',
    successBody: 'We’ve sent a WhatsApp message to your phone. Open WhatsApp and reply there to start chatting with Vela.',
    successHint: 'Didn’t get it? Make sure WhatsApp is installed and message us from the number you registered.',
    backHome: 'Back to home',
    // validation
    phoneRequired: 'Phone number is required',
    phoneInvalid: 'Enter a valid phone number',
    usernameRequired: 'Username is required',
    usernameMax: 'Username must be 50 characters or fewer',
    dobRequired: 'Date of birth is required',
    dobFormat: 'Use the date picker (YYYY-MM-DD)',
    dobFuture: 'Date of birth cannot be in the future',
    dobOld: 'Date of birth is implausibly old',
    pwMin: 'Password must be at least 8 characters',
    pwMax: 'Password must be 64 characters or fewer',
    pwUpper: 'Password must contain at least one uppercase letter',
    pwLower: 'Password must contain at least one lowercase letter',
    pwNumber: 'Password must contain at least one number',
    pwSpecial: 'Password must contain at least one special character',
  },
  es: {
    asideTitle: 'Comienza con nosotros',
    asideSub: 'Completa estos sencillos pasos para registrar tu cuenta.',
    steps: ['Registra tu cuenta', 'Verifica tu número', 'Empieza a chatear con Vela'],
    headTitle: 'Crear cuenta',
    headSub: 'Ingresa tus datos para crear tu cuenta.',
    phoneLabel: 'Número de teléfono',
    phonePlaceholder: '55 1234 5678',
    usernameLabel: 'Nombre de usuario',
    usernamePlaceholder: 'Tu nombre',
    dobLabel: 'Fecha de nacimiento',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Ingresa tu contraseña',
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
    // post-registration success (la conversación continúa en WhatsApp)
    successTitle: '¡Todo listo!',
    successBody: 'Te enviamos un mensaje de WhatsApp a tu teléfono. Abre WhatsApp y responde ahí para empezar a chatear con Vela.',
    successHint: '¿No lo recibiste? Asegúrate de tener WhatsApp instalado y escríbenos desde el número con el que te registraste.',
    backHome: 'Volver al inicio',
    // validation
    phoneRequired: 'El número de teléfono es obligatorio',
    phoneInvalid: 'Ingresa un número de teléfono válido',
    usernameRequired: 'El nombre de usuario es obligatorio',
    usernameMax: 'El nombre de usuario debe tener 50 caracteres o menos',
    dobRequired: 'La fecha de nacimiento es obligatoria',
    dobFormat: 'Usa el selector de fecha (AAAA-MM-DD)',
    dobFuture: 'La fecha de nacimiento no puede estar en el futuro',
    dobOld: 'La fecha de nacimiento es inverosímilmente antigua',
    pwMin: 'La contraseña debe tener al menos 8 caracteres',
    pwMax: 'La contraseña debe tener 64 caracteres o menos',
    pwUpper: 'La contraseña debe contener al menos una letra mayúscula',
    pwLower: 'La contraseña debe contener al menos una letra minúscula',
    pwNumber: 'La contraseña debe contener al menos un número',
    pwSpecial: 'La contraseña debe contener al menos un carácter especial',
  },
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/* Validation messages are keys so they can be resolved in the active language. */
const registerSchema = z.object({
  phone: z
    .string()
    .min(1, 'phoneRequired')
    .refine((v) => isValidPhoneNumber(v || ''), 'phoneInvalid'),
  username: z
    .string()
    .trim()
    .min(1, 'usernameRequired')
    .max(50, 'usernameMax'),
  date_of_birth: z
    .string()
    .min(1, 'dobRequired')
    .regex(ISO_DATE, 'dobFormat')
    .refine((v) => {
      const d = new Date(v)
      return !Number.isNaN(d.getTime()) && d <= new Date()
    }, 'dobFuture')
    .refine((v) => {
      const d = new Date(v)
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - 120)
      return d >= cutoff
    }, 'dobOld'),
  password: z
    .string()
    .min(8, 'pwMin')
    .max(64, 'pwMax')
    .regex(/[A-Z]/, 'pwUpper')
    .regex(/[a-z]/, 'pwLower')
    .regex(/[0-9]/, 'pwNumber')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'pwSpecial'),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const lang = useSelector(selectLang)
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
    defaultValues: { phone: '', username: '', date_of_birth: '' },
  })

  // Block the native date picker from selecting future dates.
  const todayIso = new Date().toISOString().slice(0, 10)

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await register(data).unwrap()
      // No web chat anymore: registration triggers a WhatsApp greeting and the
      // conversation continues on WhatsApp. Show a confirmation instead of
      // logging the patient into a (now removed) chat UI.
      setSubmitted(true)
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

  // After a successful registration the patient continues on WhatsApp — show
  // a confirmation panel rather than the form.
  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
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
                  <div key={i} className="auth-step is-active">
                    <span className="auth-step-num">{i + 1}</span>
                    <p className="auth-step-title">{title}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="auth-main">
            <button
              type="button"
              className="auth-lang-toggle"
              onClick={() => dispatch(toggleLanguage())}
            >
              {t.switchTo}
            </button>

            <div className="auth-main-head">
              <h1>{t.successTitle}</h1>
              <p>{t.successBody}</p>
            </div>

            <p className="auth-alt" style={{ marginTop: 0 }}>{t.successHint}</p>

            <p className="auth-alt">
              <Link to="/">{t.backHome}</Link>
            </p>
          </main>
        </div>
      </div>
    )
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
              <label className={errors.username ? 'auth-label has-error' : 'auth-label'}>
                {t.usernameLabel}
              </label>
              <input
                {...registerField('username')}
                type="text"
                autoComplete="username"
                maxLength={50}
                placeholder={t.usernamePlaceholder}
                className={errors.username ? 'auth-control has-error' : 'auth-control'}
              />
              {errors.username && <p className="auth-error">{tError(errors.username.message)}</p>}
            </div>

            <div className="auth-field">
              <label className={errors.date_of_birth ? 'auth-label has-error' : 'auth-label'}>
                {t.dobLabel}
              </label>
              <input
                {...registerField('date_of_birth')}
                type="date"
                autoComplete="bday"
                max={todayIso}
                className={errors.date_of_birth ? 'auth-control has-error' : 'auth-control'}
              />
              {errors.date_of_birth && <p className="auth-error">{tError(errors.date_of_birth.message)}</p>}
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

            <button type="submit" disabled={isRegistering} className="auth-submit" style={{ opacity: isRegistering ? 0.7 : 1 }}>
              {isRegistering ? t.submitting : t.submit}
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
