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
    sectionPersonal: 'Personal information',
    firstNameLabel: 'First name',
    firstNamePlaceholder: 'Jane',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'Doe',
    phoneLabel: 'Phone number',
    phonePlaceholder: '55 1234 5678',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    dobLabel: 'Date of birth',
    commPrefLabel: 'How should we contact you?',
    commWhatsapp: 'WhatsApp',
    commEmail: 'Email',
    submit: 'Create account',
    submitting: 'Creating account…',
    altPrefix: 'Already have an account?',
    altLink: 'Sign in',
    serverError: 'Registration failed. Please try again.',
    switchTo: 'Español',
    // post-registration success (conversation continues on the chosen channel)
    successTitle: 'You’re all set!',
    successBody: 'We’ve sent a WhatsApp message to your phone. Open WhatsApp and reply there to start chatting with Vela.',
    successHint: 'Didn’t get it? Make sure WhatsApp is installed and message us from the number you registered.',
    successBodyEmail: 'We’ve sent you an email. Open your inbox and reply there to start chatting with Vela.',
    successHintEmail: 'Didn’t get it? Check your spam folder and make sure you used the right email address.',
    backHome: 'Back to home',
    // validation
    phoneRequired: 'Phone number is required',
    phoneInvalid: 'Enter a valid phone number',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    nameMax: 'Must be 50 characters or fewer',
    emailRequired: 'Email is required',
    emailInvalid: 'Enter a valid email address',
    dobRequired: 'Date of birth is required',
    dobFormat: 'Use the date picker (YYYY-MM-DD)',
    dobFuture: 'Date of birth cannot be in the future',
    dobOld: 'Date of birth is implausibly old',
    commPrefRequired: 'Choose how we should contact you',
  },
  es: {
    asideTitle: 'Comienza con nosotros',
    asideSub: 'Completa estos sencillos pasos para registrar tu cuenta.',
    steps: ['Registra tu cuenta', 'Verifica tu número', 'Empieza a chatear con Vela'],
    headTitle: 'Crear cuenta',
    headSub: 'Ingresa tus datos para crear tu cuenta.',
    sectionPersonal: 'Información personal',
    firstNameLabel: 'Nombre',
    firstNamePlaceholder: 'Juana',
    lastNameLabel: 'Apellido',
    lastNamePlaceholder: 'Pérez',
    phoneLabel: 'Número de teléfono',
    phonePlaceholder: '55 1234 5678',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@ejemplo.com',
    dobLabel: 'Fecha de nacimiento',
    commPrefLabel: '¿Cómo te contactamos?',
    commWhatsapp: 'WhatsApp',
    commEmail: 'Correo',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta…',
    altPrefix: '¿Ya tienes una cuenta?',
    altLink: 'Iniciar sesión',
    serverError: 'El registro falló. Inténtalo de nuevo.',
    switchTo: 'English',
    // post-registration success (la conversación continúa en el canal elegido)
    successTitle: '¡Todo listo!',
    successBody: 'Te enviamos un mensaje de WhatsApp a tu teléfono. Abre WhatsApp y responde ahí para empezar a chatear con Vela.',
    successHint: '¿No lo recibiste? Asegúrate de tener WhatsApp instalado y escríbenos desde el número con el que te registraste.',
    successBodyEmail: 'Te enviamos un correo electrónico. Abre tu bandeja de entrada y responde ahí para empezar a chatear con Vela.',
    successHintEmail: '¿No lo recibiste? Revisa tu carpeta de spam y asegúrate de haber usado el correo electrónico correcto.',
    backHome: 'Volver al inicio',
    // validation
    phoneRequired: 'El número de teléfono es obligatorio',
    phoneInvalid: 'Ingresa un número de teléfono válido',
    firstNameRequired: 'El nombre es obligatorio',
    lastNameRequired: 'El apellido es obligatorio',
    nameMax: 'Debe tener 50 caracteres o menos',
    emailRequired: 'El correo electrónico es obligatorio',
    emailInvalid: 'Ingresa un correo electrónico válido',
    dobRequired: 'La fecha de nacimiento es obligatoria',
    dobFormat: 'Usa el selector de fecha (AAAA-MM-DD)',
    dobFuture: 'La fecha de nacimiento no puede estar en el futuro',
    dobOld: 'La fecha de nacimiento es inverosímilmente antigua',
    commPrefRequired: 'Elige cómo contactarte',
  },
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/* Validation messages are keys so they can be resolved in the active language. */
const registerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'firstNameRequired')
    .max(50, 'nameMax'),
  last_name: z
    .string()
    .trim()
    .min(1, 'lastNameRequired')
    .max(50, 'nameMax'),
  phone: z
    .string()
    .min(1, 'phoneRequired')
    .refine((v) => isValidPhoneNumber(v || ''), 'phoneInvalid'),
  email: z
    .string()
    .min(1, 'emailRequired')
    .email('emailInvalid'),
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
  communication_preference: z.enum(['whatsapp', 'email'], {
    errorMap: () => ({ message: 'commPrefRequired' }),
  }),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const lang = useSelector(selectLang)
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [serverError, setServerError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  // The channel the patient chose, so the success panel can address it.
  const [submittedChannel, setSubmittedChannel] = useState('whatsapp')

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
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      communication_preference: 'whatsapp',
    },
  })

  // Block the native date picker from selecting future dates.
  const todayIso = new Date().toISOString().slice(0, 10)

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await register(data).unwrap()
      // No web chat anymore: registration triggers a greeting on the chosen
      // channel and the conversation continues there. Show a confirmation
      // instead of logging the patient into a (now removed) chat UI.
      setSubmittedChannel(data.communication_preference)
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
    const isEmail = submittedChannel === 'email'
    const successBody = isEmail ? t.successBodyEmail : t.successBody
    const successHint = isEmail ? t.successHintEmail : t.successHint
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
              <p>{successBody}</p>
            </div>

            <p className="auth-alt" style={{ marginTop: 0 }}>{successHint}</p>

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
            {/* Personal information — name on its own section, side by side */}
            <fieldset className="auth-section">
              <legend className="auth-section-title">{t.sectionPersonal}</legend>

              <div className="auth-row">
                <div className="auth-field">
                  <label className={errors.first_name ? 'auth-label has-error' : 'auth-label'}>
                    {t.firstNameLabel}
                  </label>
                  <input
                    {...registerField('first_name')}
                    type="text"
                    autoComplete="given-name"
                    maxLength={50}
                    placeholder={t.firstNamePlaceholder}
                    className={errors.first_name ? 'auth-control has-error' : 'auth-control'}
                  />
                  {errors.first_name && <p className="auth-error">{tError(errors.first_name.message)}</p>}
                </div>

                <div className="auth-field">
                  <label className={errors.last_name ? 'auth-label has-error' : 'auth-label'}>
                    {t.lastNameLabel}
                  </label>
                  <input
                    {...registerField('last_name')}
                    type="text"
                    autoComplete="family-name"
                    maxLength={50}
                    placeholder={t.lastNamePlaceholder}
                    className={errors.last_name ? 'auth-control has-error' : 'auth-control'}
                  />
                  {errors.last_name && <p className="auth-error">{tError(errors.last_name.message)}</p>}
                </div>
              </div>
            </fieldset>

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
              <label className={errors.email ? 'auth-label has-error' : 'auth-label'}>
                {t.emailLabel}
              </label>
              <input
                {...registerField('email')}
                type="email"
                autoComplete="email"
                placeholder={t.emailPlaceholder}
                className={errors.email ? 'auth-control has-error' : 'auth-control'}
              />
              {errors.email && <p className="auth-error">{tError(errors.email.message)}</p>}
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
              <label className={errors.communication_preference ? 'auth-label has-error' : 'auth-label'}>
                {t.commPrefLabel}
              </label>
              <Controller
                name="communication_preference"
                control={control}
                render={({ field }) => (
                  <div className="auth-segmented" role="radiogroup" aria-label={t.commPrefLabel}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={field.value === 'whatsapp'}
                      className={field.value === 'whatsapp' ? 'auth-segment is-active' : 'auth-segment'}
                      onClick={() => field.onChange('whatsapp')}
                    >
                      {t.commWhatsapp}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={field.value === 'email'}
                      className={field.value === 'email' ? 'auth-segment is-active' : 'auth-segment'}
                      onClick={() => field.onChange('email')}
                    >
                      {t.commEmail}
                    </button>
                  </div>
                )}
              />
              {errors.communication_preference && (
                <p className="auth-error">{tError(errors.communication_preference.message)}</p>
              )}
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
