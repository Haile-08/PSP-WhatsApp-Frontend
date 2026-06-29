import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectLang, toggleLanguage } from '../i18n/langSlice'
import './vela.css'

/* The four-point Vela "sail" mark, reused across nav, hero, dataflow, footer. */
function VelaMark({ className }) {
  return (
    <img src="/icon.svg" className={className} width="60" height="60" alt="" aria-hidden="true" />
  )
}

const CHECK = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const STAR = (
  <img src="/icon.svg" width="15" height="15" alt="" aria-hidden="true" />
)
const X = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const ORBIT_ANGLES = ['-90deg', '-18deg', '54deg', '126deg', '198deg']

/* Full page copy in both languages. Spanish is the default (see useState below).
   Numeric metrics and brand/product names stay verbatim across languages. */
const COPY = {
  es: {
    langSwitch: 'EN',
    nav: { capabilities: 'Capacidades', architecture: 'Arquitectura', safety: 'Seguridad', rollout: 'Despliegue', signIn: 'Iniciar sesión' },
    hero: {
      pills: [
        { b: '~60%', t: 'de bajo contacto absorbido' },
        { b: '15 → 250+', t: 'pacientes, mismo personal' },
        { b: '<2 min', t: 'escalamiento de alertas críticas' },
        { b: 'HIPAA', t: 'conforme' },
      ],
      titlePre: 'El agente de soporte que sabe ',
      accent: 'cuándo escalar',
      sub: 'Vela opera la mitad de bajo contacto de tu programa de pacientes en WhatsApp y SMS — adherencia, recolección de PRO, triaje y preguntas frecuentes — y dirige cada alerta clínica a un humano en menos de dos minutos.',
      signIn: 'Iniciar sesión',
      seeHow: 'Ver cómo funciona',
      orbit: ['Recordatorios', 'Recolección de PRO', 'Triaje', 'Agendamiento', 'Escalamiento'],
    },
    trust: { lbl: 'Construido sobre un estándar medible' },
    metrics: {
      kickerN: '01', kickerB: 'El estándar',
      h2: 'Medido con números, no con promesas.',
      p: 'Cada respuesta redactada, cada escalamiento y cada PRO se mide de forma continua — y se contrasta con estos umbrales antes de que el agente gane más autonomía.',
      items: [
        { n: '95', u: '%+', d: 'Tasa de aprobación de respuestas redactadas bajo revisión humana.', tag: 'Control de calidad' },
        { n: '<2', u: 'min', d: 'Latencia de escalamiento de alertas clínicas a un humano en vivo.', tag: 'SLA de seguridad' },
        { n: '80', u: '%+', d: 'Finalización de PRO vía WhatsApp en una ventana de 48 horas.', tag: 'Rendimiento' },
        { n: '0', u: '', d: 'Reportes de farmacovigilancia omitidos. Nunca se pierde ninguno.', tag: 'Innegociable' },
      ],
    },
    capabilities: {
      kickerN: '02', kickerB: 'Lo que opera Vela',
      h2: 'Cinco tipos de interacción, un agente responsable.',
      p: 'Vela cubre todo el ciclo de vida de un paciente en el programa — y transfiere en el momento en que una conversación necesita un clínico, un coordinador o un toque humano.',
      caps: [
        { ix: '01', title: 'Incorporación', ch: 'Criticidad alta', body: 'Inscripción, verificación de identidad y captura de consentimiento ARCO, logística de la primera dosis, agendamiento de capacitación de enfermería y PRO de base — la columna legal y emocional de la relación.', v: '23 min AHT', k: '1 / paciente' },
        { ix: '02', title: 'Adherencia', ch: 'Señal de abandono', body: 'Recordatorios de inyección subcutánea en las semanas 2, 4, 8, 12 y luego mensualmente. Se ramifica según una lectura de adherencia del 1 al 10 hacia subflujos de efectos secundarios, acceso o recordatorios.', v: '5 min AHT', k: '25% del volumen' },
        { ix: '03', title: 'Coordinación', ch: 'Red FFS', body: 'Agenda la red de especialistas — enfermería de autoadministración, nutrición clínica, psicología clínica — con bloqueos de calendario, confirmaciones y recordatorios de 24 h/1 h.', v: '9 min AHT', k: '20% del volumen' },
        { ix: '04', title: 'Soporte', ch: 'Mayor variabilidad', body: 'Triaje de primera línea de mensajes entrantes en cualquier canal — clasifica preguntas frecuentes, PA/acceso, eventos adversos y preguntas clínicas, luego resuelve o deriva con contexto completo.', v: '6 min AHT', k: '20% del volumen' },
        { ix: '05', title: 'Recolección de PRO', ch: 'Combustible de reautorización', body: 'Administra PP-NRS, SD-NRS y DLQI un ítem a la vez en WhatsApp, los califica y compila automáticamente paquetes de reautorización para la renovación del pagador.', v: '6 min AHT', k: '15% del volumen' },
      ],
    },
    architecture: {
      kickerN: '03', kickerB: 'La arquitectura',
      h2: 'Determinista por defecto, agéntica por excepción.',
      p: 'Una máquina de estados determinista por fuera, con bucles de agente que usan herramientas integrados solo en los nodos que requieren más criterio — auditable donde debe serlo, de nivel humano donde importa.',
      det: {
        tag: 'Capa determinista', mono: 'Totalmente auditable',
        h3: 'La columna innegociable',
        lead: 'El consentimiento, los PRO y el escalamiento de eventos adversos nunca pueden ser probabilísticos. Se ejecutan como transiciones de estado fijas y registradas en Healthie.',
        li: ['Incorporación y consentimiento ARCO', 'Recolección de PRO — PP-NRS, DLQI, SD-NRS', 'Detección y escalamiento de eventos adversos', 'Paquetes de reautorización de PA', 'Cadencia de recordatorios de adherencia'],
      },
      agt: {
        tag: 'Bucles agénticos', mono: 'RAG · herramientas acotadas',
        h3: 'Criterio, con límites',
        lead: 'Bucles acotados que usan herramientas sobre un corpus aprobado. Si la consulta sale del corpus o activa el clasificador de EA, Vela no responde — escala.',
        li: ['Preguntas abiertas de pacientes (FAQ sobre el corpus)', 'Agendamiento de la red de especialistas FFS', 'Triaje y derivación de intención entrante', 'Cada bucle envuelto en barreras de entrada y salida'],
      },
      reads: 'Lee', writes: 'Escribe',
      readsSrc: [
        { b: 'Healthie', s: 'Expediente del paciente · interacciones previas · estado de PA' },
        { b: 'Almacén vectorial', s: 'SOP aprobados · guiones · árboles de escalamiento' },
        { b: 'Twilio WhatsApp', s: 'Mensajes entrantes · respuestas de PRO' },
      ],
      writesSrc: [
        { b: 'Healthie', s: 'Registros de interacción · puntajes de PRO · adherencia' },
        { b: 'Observabilidad', s: 'Transcripciones · latencia · datos de evaluación de QA' },
        { b: 'Cola de tickets', s: 'Escalamientos clínicos · eventos adversos · alertas' },
      ],
      coreTitle: 'Agente Vela',
      coreSub: 'API de Gemini + orquestador. Maneja ~60% del tráfico de bajo contacto; escala las alertas a un humano.',
    },
    safety: {
      kickerN: '04', kickerB: 'Los límites',
      h2: 'Ante la duda, hay un humano en línea.',
      p: 'Los límites de abajo nunca se relajan — en ninguna fase de madurez. Cada desviación hacia ellos se registra y se remite al dermatólogo tratante.',
      boundsHead: 'Límites estrictos',
      bounds: ['Sin diagnóstico ni interpretación de síntomas', 'Nunca modifica dosis, frecuencia ni horario', 'Sin comparación off-label ni entre biológicos', 'Captura eventos adversos — nunca los cierra', 'Sin decisiones de autorización del pagador'],
      escalations: [
        { crit: true, trig: 'Ideación suicida / autolesión', sub: 'Clasificador de crisis y sentimiento → Supervisor + psicólogo de guardia', t: '< 2 min', u: 'Humano en línea' },
        { crit: true, trig: 'Evento adverso grave', sub: 'Anafilaxia, angioedema, disnea → FV de Galderma + indicación de urgencias', t: '< 2 min', u: 'Reporte de FV' },
        { crit: false, trig: 'Alerta clínica', sub: 'Brote sostenido, PP-NRS ≥ 8, infección sobreañadida → dermatólogo', t: '< 2 h', u: 'Contacto médico' },
        { crit: false, trig: 'Problema de acceso / cobertura', sub: 'PA denegada, renovación rechazada, desabasto → Acceso a Mercado', t: '< 24 h', u: 'Gestión' },
        { crit: false, trig: 'Clasificación de baja confianza', sub: 'Caso atípico por debajo del 70% de confianza → Agente de Éxito del Paciente', t: '< 4 h', u: 'Revisión humana' },
      ],
    },
    rollout: {
      kickerN: '05', kickerB: 'El despliegue',
      h2: 'La autonomía se gana, una fase a la vez.',
      p: 'Vela nunca cambia una categoría entera de golpe. Cada fase tiene umbrales de salida numéricos y un interruptor de emergencia que revierte cualquier categoría a revisión humana al instante.',
      phases: [
        { pn: 'Fase 0', w: '8%', h: 'Modo sombra', p: 'Totalmente construido, no habla con nadie. Propone respuestas frente a transcripciones históricas; los supervisores califican precisión, tono y seguridad.', pct: '0%' },
        { pn: 'Fase 1', w: '30%', h: 'Humano en el bucle', p: 'Vela redacta cada respuesta. Un humano aprueba, edita o reescribe antes de enviar. Cada edición se convierte en señal de entrenamiento.', pct: '→ 80%' },
        { pn: 'Fase 2', w: '60%', h: 'Autonomía selectiva', p: 'Las categorías con 95%+ de aprobación van directo — recordatorios, solicitudes de PRO, preguntas frecuentes simples. Todo lo clínico permanece supervisado.', pct: '~60%' },
        { pn: 'Fase 3', w: '80%', h: 'Autonomía supervisada', p: 'Vela maneja ~80% por sí sola. Los humanos se encargan de escalamientos y casos complejos, y muestrean 5–10% semanalmente para QA.', pct: '~80%' },
      ],
    },
    cta: {
      eyebrow: 'Galderma México · PSP Nemluvio®',
      h2: 'Lleva Vela a tu programa.',
      p: 'Un camino viable de 15 a 250+ pacientes con el mismo personal — con trazabilidad regulatoria en cada paso controlado.',
      signIn: 'Iniciar sesión',
      readSpec: 'Leer la especificación',
    },
    footer: {
      tag: 'El agente de soporte al paciente que observa de cerca y se mantiene en su carril.',
      productHead: 'Producto',
      programHead: 'Programa',
      program: ['PSP Nemluvio®', 'Eventos adversos', 'Datos y privacidad', 'Asuntos Médicos'],
      contactHead: 'Contacto',
      signIn: 'Iniciar sesión',
      contact: ['Equipo de operaciones', 'Farmacovigilancia'],
      copyright: '© 2026 Vela · Programa de Soporte al Paciente',
      built: 'Construido sobre Gemini',
    },
  },
  en: {
    langSwitch: 'ES',
    nav: { capabilities: 'Capabilities', architecture: 'Architecture', safety: 'Safety', rollout: 'Rollout', signIn: 'Sign in' },
    hero: {
      pills: [
        { b: '~60%', t: 'low-touch absorbed' },
        { b: '15 → 250+', t: 'patients, same headcount' },
        { b: '<2 min', t: 'red-flag escalation' },
        { b: 'HIPAA', t: 'compliant' },
      ],
      titlePre: 'The support agent that knows ',
      accent: 'when to escalate',
      sub: 'Vela runs the low-touch half of your patient program across WhatsApp and SMS — adherence, PRO collection, triage and FAQs — and routes every clinical red flag to a human in under two minutes.',
      signIn: 'Sign in',
      seeHow: 'See how it works',
      orbit: ['Reminders', 'PRO collection', 'Triage', 'Scheduling', 'Escalation'],
    },
    trust: { lbl: 'Built on a measured standard' },
    metrics: {
      kickerN: '01', kickerB: 'The standard',
      h2: 'Held to numbers, not promises.',
      p: 'Every drafted response, every escalation and every PRO is measured continuously — and gated against these thresholds before the agent earns more autonomy.',
      items: [
        { n: '95', u: '%+', d: 'Approval rate on drafted responses under human review.', tag: 'Quality gate' },
        { n: '<2', u: 'min', d: 'Escalation latency for clinical red flags to a live human.', tag: 'Safety SLA' },
        { n: '80', u: '%+', d: 'PRO completion via WhatsApp within a 48-hour window.', tag: 'Throughput' },
        { n: '0', u: '', d: 'Pharmacovigilance reporting misses. Never one dropped.', tag: 'Non-negotiable' },
      ],
    },
    capabilities: {
      kickerN: '02', kickerB: 'What Vela runs',
      h2: 'Five interaction types, one accountable agent.',
      p: 'Vela covers the full lifecycle of a patient in the program — and hands off the moment a conversation needs a clinician, a coordinator, or a human touch.',
      caps: [
        { ix: '01', title: 'Onboarding', ch: 'High criticality', body: 'Enrollment, identity verification and ARCO consent capture, first-dose logistics, nurse-training booking, and baseline PROs — the legal and emotional backbone of the relationship.', v: '23 min AHT', k: '1 / patient' },
        { ix: '02', title: 'Adherence', ch: 'Attrition signal', body: 'Subcutaneous injection reminders at weeks 2, 4, 8, 12 then monthly. Branches on a 1–10 adherence read into side-effect, access or reminder sub-flows.', v: '5 min AHT', k: '25% of mix' },
        { ix: '03', title: 'Coordination', ch: 'FFS network', body: 'Books the specialist network — self-administration nursing, clinical nutrition, clinical psychology — with calendar locks, confirmations and 24h/1h reminders.', v: '9 min AHT', k: '20% of mix' },
        { ix: '04', title: 'Support', ch: 'Highest variance', body: 'First-line triage of inbound on any channel — classifies FAQ, PA/access, adverse event and clinical questions, then resolves or routes with full context.', v: '6 min AHT', k: '20% of mix' },
        { ix: '05', title: 'PRO Collection', ch: 'Re-auth fuel', body: 'Administers PP-NRS, SD-NRS and DLQI one item at a time on WhatsApp, scores them, and auto-compiles re-authorization packages for payer renewal.', v: '6 min AHT', k: '15% of mix' },
      ],
    },
    architecture: {
      kickerN: '03', kickerB: 'The architecture',
      h2: 'Deterministic by default, agentic by exception.',
      p: 'A deterministic state machine on the outside, tool-using agent loops embedded only in the judgment-heavy nodes — auditable where it must be, human-grade where it matters.',
      det: {
        tag: 'Deterministic shell', mono: 'Fully auditable',
        h3: 'The non-negotiable spine',
        lead: 'Consent, PROs and adverse-event escalation can never be probabilistic. These run as fixed, logged state transitions in Healthie.',
        li: ['Onboarding & ARCO consent', 'PRO collection — PP-NRS, DLQI, SD-NRS', 'Adverse-event detection & escalation', 'PA re-authorization packages', 'Adherence reminder cadence'],
      },
      agt: {
        tag: 'Agentic loops', mono: 'RAG · bounded tools',
        h3: 'Judgment, on a leash',
        lead: 'Narrow, tool-using loops over an approved corpus. If the query exits the corpus or trips the AE classifier, Vela does not answer — it escalates.',
        li: ['Open patient questions (FAQ over corpus)', 'FFS specialist-network scheduling', 'Inbound intent triage & routing', 'Every loop wrapped in input & output guardrails'],
      },
      reads: 'Reads', writes: 'Writes',
      readsSrc: [
        { b: 'Healthie', s: 'Patient record · prior interactions · PA status' },
        { b: 'Vector store', s: 'Approved SOPs · scripts · escalation trees' },
        { b: 'Twilio WhatsApp', s: 'Inbound messages · PRO replies' },
      ],
      writesSrc: [
        { b: 'Healthie', s: 'Interaction logs · PRO scores · adherence' },
        { b: 'Observability', s: 'Transcripts · latency · QA scoring inputs' },
        { b: 'Ticketing queue', s: 'Clinical escalations · adverse events · flags' },
      ],
      coreTitle: 'Vela Agent',
      coreSub: 'Gemini API + orchestrator. Handles ~60% of low-touch traffic; escalates red flags to a human.',
    },
    safety: {
      kickerN: '04', kickerB: 'The boundaries',
      h2: 'When in doubt, a human is on the line.',
      p: 'The lines below never relax — not at any maturity phase. Every drift toward them is logged and deferred to the treating dermatologist.',
      boundsHead: 'Hard boundaries',
      bounds: ['No diagnosis or symptom interpretation', 'Never modifies dose, frequency or schedule', 'No off-label or cross-biologic comparison', 'Captures adverse events — never closes them', 'No payer authorization decisions'],
      escalations: [
        { crit: true, trig: 'Suicidal ideation / self-harm', sub: 'Crisis classifier & sentiment → Supervisor + on-call psychologist', t: '< 2 min', u: 'Human on line' },
        { crit: true, trig: 'Serious adverse event', sub: 'Anaphylaxis, angioedema, dyspnea → Galderma PV + ER instruction', t: '< 2 min', u: 'PV report' },
        { crit: false, trig: 'Clinical red flag', sub: 'Sustained flare, PP-NRS ≥ 8, superimposed infection → dermatologist', t: '< 2 h', u: 'Physician contact' },
        { crit: false, trig: 'Access / coverage problem', sub: 'PA denied, renewal rejected, stock-out → Market Access', t: '< 24 h', u: 'Engagement' },
        { crit: false, trig: 'Low-confidence classification', sub: 'Atypical case below 70% confidence → Patient Success Agent', t: '< 4 h', u: 'Human review' },
      ],
    },
    rollout: {
      kickerN: '05', kickerB: 'The rollout',
      h2: 'Autonomy is earned, one phase at a time.',
      p: 'Vela never flips a whole category at once. Each phase has numeric exit gates and a kill switch that reverts any category to human review instantly.',
      phases: [
        { pn: 'Phase 0', w: '8%', h: 'Shadow mode', p: 'Fully built, talks to no one. Proposes responses against historical transcripts; supervisors score accuracy, tone, safety.', pct: '0%' },
        { pn: 'Phase 1', w: '30%', h: 'Human-in-the-loop', p: 'Vela drafts every response. A human approves, edits or rewrites before sending. Every edit becomes training signal.', pct: '→ 80%' },
        { pn: 'Phase 2', w: '60%', h: 'Selective autonomy', p: 'Categories at 95%+ approval go direct — reminders, PRO prompts, simple FAQs. Anything clinical stays supervised.', pct: '~60%' },
        { pn: 'Phase 3', w: '80%', h: 'Supervised autonomy', p: 'Vela handles ~80% solo. Humans own escalations and complex cases, and QA-sample 5–10% weekly.', pct: '~80%' },
      ],
    },
    cta: {
      eyebrow: 'Galderma Mexico · Nemluvio® PSP',
      h2: 'Bring Vela to your program.',
      p: 'A viable path from 15 to 250+ patients on the same headcount — with regulatory traceability on every controlled step.',
      signIn: 'Sign in',
      readSpec: 'Read the spec',
    },
    footer: {
      tag: 'The patient support agent that watches closely and stays in its lane.',
      productHead: 'Product',
      programHead: 'Program',
      program: ['Nemluvio® PSP', 'Adverse events', 'Data & privacy', 'Medical Affairs'],
      contactHead: 'Contact',
      signIn: 'Sign in',
      contact: ['Operations team', 'Pharmacovigilance'],
      copyright: '© 2026 Vela · Patient Support Program',
      built: 'Built on Gemini',
    },
  },
}

export default function LandingPage() {
  const rootRef = useRef(null)
  /* Language is shared app-wide via Redux (default Spanish, persisted). */
  const dispatch = useDispatch()
  const lang = useSelector(selectLang)
  const t = COPY[lang]

  /* Let the page scroll — the chat app pins height:100%/overflow:hidden
     globally on html, body and #root. Lift it while the landing is mounted. */
  useEffect(() => {
    const els = [document.documentElement, document.body, document.getElementById('root')].filter(Boolean)
    const prev = els.map((el) => ({ el, overflow: el.style.overflow, height: el.style.height }))
    els.forEach((el) => { el.style.overflow = 'auto'; el.style.height = 'auto' })
    return () => prev.forEach(({ el, overflow, height }) => { el.style.overflow = overflow; el.style.height = height })
  }, [])

  /* nav scrolled state + scroll reveals */
  useEffect(() => {
    const root = rootRef.current
    const nav = root.querySelector('.nav')
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled')
      else nav.classList.remove('scrolled')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    )
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el))

    return () => { window.removeEventListener('scroll', onScroll); io.disconnect() }
  }, [lang])

  return (
    <div className="vela-page" ref={rootRef} data-hero="orbit" data-motion="1">
      {/* NAV */}
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="brand" href="#top">
            <VelaMark className="mark" />
            <span className="name">Vela</span>
          </a>
          <nav className="nav-links">
            <a href="#capabilities">{t.nav.capabilities}</a>
            <a href="#architecture">{t.nav.architecture}</a>
            <a href="#safety">{t.nav.safety}</a>
            <a href="#rollout">{t.nav.rollout}</a>
          </nav>
          <div className="nav-cta">
            <button
              type="button"
              className="lang-toggle"
              onClick={() => dispatch(toggleLanguage())}
              aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}
            >
              {t.langSwitch}
            </button>
            <Link className="btn btn--primary" to="/login">{t.nav.signIn}</Link>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-center">
            <div className="stat-pill">
              {t.hero.pills.map((pill, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  {i > 0 && <span className="sep" />}
                  <span><b>{pill.b}</b> {pill.t}</span>
                </span>
              ))}
            </div>
            <h1>{t.hero.titlePre}<span className="accent">{t.hero.accent}</span></h1>
            <p className="sub">{t.hero.sub}</p>
            <div className="hero-actions">
              <Link className="btn btn--primary" to="/login">{t.hero.signIn}</Link>
              <a className="btn btn--ghost" href="#architecture">{t.hero.seeHow}</a>
            </div>

            {/* hero stage — orbit visual */}
            <div className="hero-stage">
              <div className="hero-vis hero-vis--orbit">
                <div className="orbit">
                  <div className="orbit-ring r1" />
                  <div className="orbit-ring r2" />
                  <div className="orbit-ring r3" />
                  <div className="orbit-core">
                    <VelaMark className="vmark" />
                    <span className="orbit-corelabel">Vela</span>
                  </div>
                  {ORBIT_ANGLES.map((a, i) => (
                    <div key={i} className="orbit-node" style={{ '--a': a, '--r': '170px' }}>
                      <span className="node-chip"><i /> {t.hero.orbit[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <div className="trust">
          <div className="wrap trust-inner">
            <span className="lbl">{t.trust.lbl}</span>
            <div className="stack">
              {['Gemini API', 'Healthie', 'WhatsApp Business', 'LangGraph', 'pgvector RAG', 'Langfuse'].map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>
        </div>

        {/* METRICS */}
        <section className="section section--tight" id="metrics">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="kicker">{t.metrics.kickerN} — <b>{t.metrics.kickerB}</b></span>
              <h2>{t.metrics.h2}</h2>
              <p>{t.metrics.p}</p>
            </div>
            <div className="metrics-grid reveal">
              {t.metrics.items.map((m) => (
                <div className="metric" key={m.tag}>
                  <div className="n">{m.n}{m.u && <span className="u">{m.u}</span>}</div>
                  <div className="d">{m.d}</div>
                  <div className="tag">{m.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="section" id="capabilities">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="kicker">{t.capabilities.kickerN} — <b>{t.capabilities.kickerB}</b></span>
              <h2>{t.capabilities.h2}</h2>
              <p>{t.capabilities.p}</p>
            </div>
            <div className="cap-list reveal">
              {t.capabilities.caps.map((c) => (
                <article className="cap" key={c.ix}>
                  <div className="ix">{c.ix}</div>
                  <div className="cap-main">
                    <h3>{c.title} <span className="ch">{c.ch}</span></h3>
                    <p>{c.body}</p>
                  </div>
                  <div className="meta"><span className="v">{c.v}</span><span className="k">{c.k}</span></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="section" id="architecture">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="kicker">{t.architecture.kickerN} — <b>{t.architecture.kickerB}</b></span>
              <h2>{t.architecture.h2}</h2>
              <p>{t.architecture.p}</p>
            </div>

            <div className="arch-cols reveal">
              <div className="arch-card det">
                <div className="tophead"><span className="tag">{t.architecture.det.tag}</span><span className="mono">{t.architecture.det.mono}</span></div>
                <h3>{t.architecture.det.h3}</h3>
                <p className="lead">{t.architecture.det.lead}</p>
                <ul>
                  {t.architecture.det.li.map((li) => (
                    <li key={li}>{CHECK} {li}</li>
                  ))}
                </ul>
              </div>
              <div className="arch-card agt">
                <div className="tophead"><span className="tag">{t.architecture.agt.tag}</span><span className="mono">{t.architecture.agt.mono}</span></div>
                <h3>{t.architecture.agt.h3}</h3>
                <p className="lead">{t.architecture.agt.lead}</p>
                <ul>
                  {t.architecture.agt.li.map((li) => (
                    <li key={li}>{STAR} {li}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* data flow */}
            <div className="dataflow reveal">
              <div className="df-col read">
                <div className="ct">{t.architecture.reads}</div>
                <div className="src">
                  {t.architecture.readsSrc.map((d) => (
                    <div className="df-src" key={d.s}><b>{d.b}</b><span>{d.s}</span></div>
                  ))}
                </div>
              </div>
              <div className="df-col center">
                <div className="df-core"><VelaMark /></div>
                <div className="ctitle">{t.architecture.coreTitle}</div>
                <div className="csub">{t.architecture.coreSub}</div>
                <span className="chip">Gemini · LangGraph</span>
              </div>
              <div className="df-col write">
                <div className="ct" style={{ textAlign: 'right' }}>{t.architecture.writes}</div>
                <div className="src">
                  {t.architecture.writesSrc.map((d) => (
                    <div className="df-src" key={d.s}><b>{d.b}</b><span>{d.s}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SAFETY */}
        <section className="section" id="safety">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="kicker">{t.safety.kickerN} — <b>{t.safety.kickerB}</b></span>
              <h2>{t.safety.h2}</h2>
              <p>{t.safety.p}</p>
            </div>
            <div className="safety-grid reveal">
              <div className="bounds">
                <div className="bh">{t.safety.boundsHead}</div>
                {t.safety.bounds.map((b) => (
                  <div className="bound" key={b}><span className="x">{X}</span> {b}</div>
                ))}
              </div>
              <div className="esc">
                {t.safety.escalations.map((e) => (
                  <div className={e.crit ? 'esc-row crit' : 'esc-row'} key={e.trig}>
                    <div className="trig">{e.trig} <span>{e.sub}</span></div>
                    <div className="sla"><span className="t">{e.t}</span><span className="u">{e.u}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ROLLOUT */}
        <section className="section" id="rollout">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="kicker">{t.rollout.kickerN} — <b>{t.rollout.kickerB}</b></span>
              <h2>{t.rollout.h2}</h2>
              <p>{t.rollout.p}</p>
            </div>
            <div className="phases reveal">
              {t.rollout.phases.map((p) => (
                <div className="phase" key={p.pn}>
                  <div className="pn">{p.pn}</div>
                  <div className="bar"><i style={{ width: p.w }} /></div>
                  <h4>{p.h}</h4>
                  <p>{p.p}</p>
                  <span className="pct">{p.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta" id="cta">
          <div className="wrap">
            <div className="cta-inner">
              <span className="eyebrow">{t.cta.eyebrow}</span>
              <h2>{t.cta.h2}</h2>
              <p>{t.cta.p}</p>
              <div className="cta-actions">
                <Link className="btn btn--primary" to="/login">{t.cta.signIn} <svg className="arrow" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
                <a className="btn btn--ghost" href="#architecture">{t.cta.readSpec}</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-top">
            <div>
              <a className="brand" href="#top"><VelaMark className="mark" /><span className="name">Vela</span></a>
              <p className="tag">{t.footer.tag}</p>
            </div>
            <div className="footer-cols">
              <div className="fcol">
                <h5>{t.footer.productHead}</h5>
                <a href="#capabilities">{t.nav.capabilities}</a>
                <a href="#architecture">{t.nav.architecture}</a>
                <a href="#safety">{t.nav.safety}</a>
                <a href="#rollout">{t.nav.rollout}</a>
              </div>
              <div className="fcol">
                <h5>{t.footer.programHead}</h5>
                {t.footer.program.map((p) => (
                  <a href="#" key={p}>{p}</a>
                ))}
              </div>
              <div className="fcol">
                <h5>{t.footer.contactHead}</h5>
                <Link to="/login">{t.footer.signIn}</Link>
                {t.footer.contact.map((c) => (
                  <a href="#" key={c}>{c}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-bot">
            <span className="mono">{t.footer.copyright}</span>
            <span className="built"><VelaMark /> {t.footer.built}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
