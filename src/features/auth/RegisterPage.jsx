import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { QRCodeSVG } from 'qrcode.react'
import { useRegisterMutation } from './authApi'
import { selectLang, toggleLanguage } from '../i18n/langSlice'
import './auth.css'

// Mirror the backend limits (app/api/v1/auth.py, app/schemas/auth.py).
const MIN_PASSWORD_LENGTH = 8
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 50

// The program's WhatsApp number patients message to start enrollment.
// Overridable per environment via ``VITE_WHATSAPP_NUMBER`` (digits only, no '+').
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5215571000762'
// The first message that starts onboarding. The engine greets on any first
// message, so this is just a friendly prefilled "Hola" (overridable via env).
const WHATSAPP_START_MESSAGE = import.meta.env.VITE_WHATSAPP_START_MESSAGE || 'Hola'
const WHATSAPP_START_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_START_MESSAGE
)}`

/* The four-point Vela "sail" mark, shared with the landing. */
function VelaMark({ className }) {
  return (
    <img src="/icon.svg" className={className} width="34" height="34" alt="" aria-hidden="true" />
  )
}

/* WhatsApp glyph used on the join / start buttons. */
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.04zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  )
}

/* A WhatsApp call-to-action button pointing at a prefilled wa.me URL. */
function WhatsAppButton({ url, label }) {
  return (
    <a className="auth-whatsapp-btn" href={url} target="_blank" rel="noopener noreferrer">
      <WhatsAppIcon />
      <span>{label}</span>
    </a>
  )
}

/* All page copy, keyed by language so the shared toggle re-renders everything. */
const COPY = {
  en: {
    asideTitle: 'Get Started with Us',
    asideSub: 'Complete these easy steps to register your account.',
    steps: ['Sign up your account', 'Verify your number', 'Continue on WhatsApp'],
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
    // success screen (shown after registering — enrollment continues on WhatsApp)
    successTitle: "You're all set!",
    successBody:
      'Your account is registered. Use the QR code or buttons below to open WhatsApp and start your enrollment.',
    qrHint: 'Scan with your phone camera to open WhatsApp',
    qrOr: 'or',
    startButton: 'Send "Hola" to begin',
    successNote: 'You can close this page once you have sent your first message.',
    successAltPrefix: 'Need to sign in later?',
    // validation
    passwordRequired: 'Password is required',
    passwordShort: 'Password must be at least 8 characters',
    phoneRequired: 'Phone number is required',
    phoneInvalid: 'Enter a valid phone number',
    usernameRequired: 'Username is required',
    usernameShort: 'Username must be at least 3 characters',
    usernameMax: 'Must be 50 characters or fewer',
  },
  es: {
    asideTitle: 'Comienza con nosotros',
    asideSub: 'Completa estos sencillos pasos para registrar tu cuenta.',
    steps: ['Registra tu cuenta', 'Verifica tu número', 'Continúa por WhatsApp'],
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
    // pantalla de éxito (la inscripción continúa por WhatsApp)
    successTitle: '¡Listo!',
    successBody:
      'Tu cuenta está registrada. Usa el código QR o los botones de abajo para abrir WhatsApp e iniciar tu inscripción.',
    qrHint: 'Escanea con la cámara de tu teléfono para abrir WhatsApp',
    qrOr: 'o',
    startButton: 'Enviar «Hola» para comenzar',
    successNote: 'Puedes cerrar esta página una vez que hayas enviado tu primer mensaje.',
    successAltPrefix: '¿Necesitas iniciar sesión más tarde?',
    // validation
    passwordRequired: 'La contraseña es obligatoria',
    passwordShort: 'La contraseña debe tener al menos 8 caracteres',
    phoneRequired: 'El número de teléfono es obligatorio',
    phoneInvalid: 'Ingresa un número de teléfono válido',
    usernameRequired: 'El nombre de usuario es obligatorio',
    usernameShort: 'El nombre de usuario debe tener al menos 3 caracteres',
    usernameMax: 'Debe tener 50 caracteres o menos',
  },
}

/* Validation messages are keys so they can be resolved in the active language. */
const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'usernameRequired')
    .min(MIN_USERNAME_LENGTH, 'usernameShort')
    .max(MAX_USERNAME_LENGTH, 'usernameMax'),
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
  const lang = useSelector(selectLang)
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Once registered, we no longer drop the patient into a web chat; the
  // enrollment continues over WhatsApp, so we just show a confirmation.
  const [registered, setRegistered] = useState(false)

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
      // The account is created sitting at onboarding step "welcome"; the server
      // does NOT message the patient yet. Onboarding starts when they join the
      // Twilio WhatsApp number — via the QR code or button on the success screen
      // below — and send their first message. So we just confirm here.
      setRegistered(true)
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
              {t.steps.map((title, i) => {
                // Highlight the WhatsApp step once registered, the first step otherwise.
                const activeIndex = registered ? t.steps.length - 1 : 0
                return (
                  <div key={i} className={i === activeIndex ? 'auth-step is-active' : 'auth-step'}>
                    <span className="auth-step-num">{i + 1}</span>
                    <p className="auth-step-title">{title}</p>
                  </div>
                )
              })}
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

          {registered ? (
            <>
              <div className="auth-main-head">
                <h1>{t.successTitle}</h1>
                <p>{t.successBody}</p>
              </div>
              {/* Scan the QR (desktop registrants) or tap the button (mobile) —
                  both open WhatsApp with a prefilled "Hola" and reach the webhook
                  to start onboarding. */}
              <div className="auth-qr">
                <QRCodeSVG
                  value={WHATSAPP_START_URL}
                  size={150}
                  level="M"
                  marginSize={2}
                  title={t.startButton}
                />
              </div>
              <p className="auth-qr-hint">{t.qrHint}</p>
              <div className="auth-qr-or">{t.qrOr}</div>
              <div className="auth-whatsapp-actions">
                <WhatsAppButton url={WHATSAPP_START_URL} label={t.startButton} />
              </div>
              <p className="auth-success-note">{t.successNote}</p>
              <p className="auth-alt">
                {t.successAltPrefix} <Link to="/login">{t.altLink}</Link>
              </p>
            </>
          ) : (
          <>
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

            <button type="submit" disabled={isRegistering} className="auth-submit" style={{ opacity: isRegistering ? 0.7 : 1 }}>
              {isRegistering ? t.submitting : t.submit}
            </button>
          </form>

          <p className="auth-alt">
            {t.altPrefix} <Link to="/login">{t.altLink}</Link>
          </p>
          </>
          )}
        </main>
      </div>
    </div>
  )
}
