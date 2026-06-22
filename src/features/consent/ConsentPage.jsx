import { Link } from 'react-router-dom'
import '../auth/auth.css'

/* The four-point Vela "sail" mark, shared with the auth/landing pages. */
function VelaMark({ className }) {
  return (
    <img src="/icon.svg" className={className} width="34" height="34" alt="" aria-hidden="true" />
  )
}

/*
 * Patient consent page. The onboarding agent sends a personalized link
 * (over WhatsApp) so the patient can review the program consent here. The
 * actual Accept / Decline response is captured in the WhatsApp conversation,
 * so this page simply presents the full consent information.
 */
export default function ConsentPage() {
  return (
    <div
      className="auth-page"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px 16px',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '760px',
          background: '#0b0b0b',
          color: '#e5e7eb',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
          padding: '40px',
        }}
      >
        <Link
          className="auth-brand"
          to="/"
          style={{ marginBottom: '24px', color: '#ffffff' }}
        >
          <VelaMark className="mark" />
          <span>Vela</span>
        </Link>

        <div className="auth-main-head">
          <h1 style={{ color: '#ffffff' }}>Consentimiento informado</h1>
          <p style={{ color: '#9ca3af' }}>
            Lea la siguiente información antes de continuar con su inscripción.
          </p>
        </div>

        <div
          className="auth-consent-body"
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: '#d1d5db',
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
      </main>
    </div>
  )
}
