import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../auth/auth.css'

/* The four-point Vela "sail" mark, shared with the auth/landing pages. */
function VelaMark({ className }) {
  return (
    <img src="/icon.svg" className={className} width="34" height="34" alt="" aria-hidden="true" />
  )
}

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`

/*
 * Patient consent page. The onboarding agent sends a personalized link
 * (over WhatsApp or email) carrying a short-lived access token in the
 * `token` query param. The patient reviews the program consent here and
 * taps Accept / Decline, which POSTs to /consent authenticated with that
 * token. Accepting advances enrollment to the ID step (the patient then
 * continues on WhatsApp/email); declining ends enrollment.
 */
export default function ConsentPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])

  const [status, setStatus] = useState('idle') // idle | submitting | accepted | refused | error
  const [error, setError] = useState('')

  const submit = async (action) => {
    setError('')
    if (!token) {
      setStatus('error')
      setError('Enlace inválido o incompleto. Solicite un nuevo enlace al equipo del programa.')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch(`${API_BASE}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus(action === 'accept' ? 'accepted' : 'refused')
    } catch {
      setStatus('error')
      setError('No pudimos registrar su respuesta. Intente de nuevo o solicite un nuevo enlace.')
    }
  }

  const submitting = status === 'submitting'
  const done = status === 'accepted' || status === 'refused'

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* LEFT — green gradient aside */}
        <aside className="auth-aside">
          <Link className="auth-brand" to="/">
            <VelaMark className="mark" />
            <span>Vela</span>
          </Link>

          <div className="auth-aside-copy">
            <div className="auth-aside-head">
              <h2 className="auth-aside-title">Consentimiento del Programa</h2>
              <p className="auth-aside-sub">
                Programa de Apoyo a Pacientes Nemluvio. Su participación es
                voluntaria y confidencial.
              </p>
            </div>

            <div className="auth-steps">
              {['Revise el consentimiento', 'Firme o rechace', 'Continúe su inscripción'].map(
                (title, i) => (
                  <div key={i} className={i === 0 ? 'auth-step is-active' : 'auth-step'}>
                    <span className="auth-step-num">{i + 1}</span>
                    <p className="auth-step-title">{title}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT — consent content */}
        <main className="auth-main">
          <div className="auth-main-head">
            <h1>Consentimiento informado</h1>
            <p>Lea la siguiente información antes de continuar con su inscripción.</p>
          </div>

          {!done && (
            <>
              <div
                className="auth-consent-body"
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.55,
                  color: '#374151',
                  maxHeight: '46vh',
                  overflowY: 'auto',
                  padding: '4px 2px 8px',
                }}
              >
                <p>
                  Al firmar este consentimiento, autorizo mi inscripción en el
                  Programa de Apoyo a Pacientes Nemluvio (nemolizumab) y el
                  tratamiento de mis datos personales y de salud para operar el
                  programa, conforme a la Ley Federal de Protección de Datos
                  Personales en Posesión de los Particulares (LFPDPPP).
                </p>
                <ul style={{ margin: '12px 0', paddingLeft: '20px' }}>
                  <li>La participación es gratuita y voluntaria; puedo retirarme en cualquier momento.</li>
                  <li>El programa acompaña mi tratamiento, pero no reemplaza a mi médico tratante.</li>
                  <li>
                    Mis datos se tratan de forma confidencial y solo se usan para
                    brindarme acompañamiento, orientación de acceso y recordatorios.
                  </li>
                  <li>
                    Para completar mi inscripción, se me solicitará una
                    identificación oficial, mi historia clínica y los datos de mi
                    seguro.
                  </li>
                </ul>
                <p>
                  Si tiene dudas, puede contactar al equipo del programa antes de
                  aceptar.
                </p>
              </div>

              {error && <div className="auth-server-error">{error}</div>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button
                  type="button"
                  className="auth-submit"
                  disabled={submitting}
                  style={{ flex: 1, opacity: submitting ? 0.7 : 1 }}
                  onClick={() => submit('accept')}
                >
                  {submitting ? 'Enviando…' : 'Acepto y firmo'}
                </button>
                <button
                  type="button"
                  className="auth-submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                  }}
                  onClick={() => submit('refuse')}
                >
                  Rechazo
                </button>
              </div>
            </>
          )}

          {status === 'accepted' && (
            <div className="auth-consent-body" style={{ fontSize: '1rem', color: '#374151' }}>
              <h2 style={{ marginBottom: '8px' }}>¡Gracias! Su consentimiento quedó registrado.</h2>
              <p>
                Continúe su inscripción en la conversación del programa: le
                pediremos una foto de su identificación oficial, su historia
                clínica y los datos de su seguro.
              </p>
            </div>
          )}

          {status === 'refused' && (
            <div className="auth-consent-body" style={{ fontSize: '1rem', color: '#374151' }}>
              <h2 style={{ marginBottom: '8px' }}>Entendido.</h2>
              <p>
                Sin su consentimiento no podemos continuar con la inscripción. Si
                cambia de opinión, puede escribirnos de nuevo en cualquier momento.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
