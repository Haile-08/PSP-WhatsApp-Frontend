import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './vela.css'

/* The four-point Vela "sail" mark, reused across nav, hero, dataflow, footer. */
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

const CHECK = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const STAR = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M8 2.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L8 11.2 4.8 12.9l.6-3.6L2.8 6.8l3.6-.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
)
const X = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const ORBIT_NODES = [
  { a: '-90deg', label: 'Reminders' },
  { a: '-18deg', label: 'PRO collection' },
  { a: '54deg', label: 'Triage' },
  { a: '126deg', label: 'Scheduling' },
  { a: '198deg', label: 'Escalation' },
]

const CAPS = [
  { ix: '01', title: 'Onboarding', ch: 'High criticality', body: 'Enrollment, identity verification and ARCO consent capture, first-dose logistics, nurse-training booking, and baseline PROs — the legal and emotional backbone of the relationship.', v: '23 min AHT', k: '1 / patient' },
  { ix: '02', title: 'Adherence', ch: 'Attrition signal', body: 'Subcutaneous injection reminders at weeks 2, 4, 8, 12 then monthly. Branches on a 1–10 adherence read into side-effect, access or reminder sub-flows.', v: '5 min AHT', k: '25% of mix' },
  { ix: '03', title: 'Coordination', ch: 'FFS network', body: 'Books the specialist network — self-administration nursing, clinical nutrition, clinical psychology — with calendar locks, confirmations and 24h/1h reminders.', v: '9 min AHT', k: '20% of mix' },
  { ix: '04', title: 'Support', ch: 'Highest variance', body: 'First-line triage of inbound on any channel — classifies FAQ, PA/access, adverse event and clinical questions, then resolves or routes with full context.', v: '6 min AHT', k: '20% of mix' },
  { ix: '05', title: 'PRO Collection', ch: 'Re-auth fuel', body: 'Administers PP-NRS, SD-NRS and DLQI one item at a time on WhatsApp, scores them, and auto-compiles re-authorization packages for payer renewal.', v: '6 min AHT', k: '15% of mix' },
]

const ESCALATIONS = [
  { crit: true, trig: 'Suicidal ideation / self-harm', sub: 'Crisis classifier & sentiment → Supervisor + on-call psychologist', t: '< 2 min', u: 'Human on line' },
  { crit: true, trig: 'Serious adverse event', sub: 'Anaphylaxis, angioedema, dyspnea → Galderma PV + ER instruction', t: '< 15 min', u: 'PV report' },
  { crit: false, trig: 'Clinical red flag', sub: 'Sustained flare, PP-NRS ≥ 8, superimposed infection → dermatologist', t: '< 4 h', u: 'Physician contact' },
  { crit: false, trig: 'Access / coverage problem', sub: 'PA denied, renewal rejected, stock-out → Market Access', t: '< 24 h', u: 'Engagement' },
  { crit: false, trig: 'Low-confidence classification', sub: 'Atypical case below 70% confidence → Patient Success Agent', t: '< 4 h', u: 'Human review' },
]

const PHASES = [
  { pn: 'Phase 0', w: '8%', h: 'Shadow mode', p: 'Fully built, talks to no one. Proposes responses against historical transcripts; supervisors score accuracy, tone, safety.', pct: '0%' },
  { pn: 'Phase 1', w: '30%', h: 'Human-in-the-loop', p: 'Vela drafts every response. A human approves, edits or rewrites before sending. Every edit becomes training signal.', pct: '→ 80%' },
  { pn: 'Phase 2', w: '60%', h: 'Selective autonomy', p: 'Categories at 95%+ approval go direct — reminders, PRO prompts, simple FAQs. Anything clinical stays supervised.', pct: '~60%' },
  { pn: 'Phase 3', w: '80%', h: 'Supervised autonomy', p: 'Vela handles ~80% solo. Humans own escalations and complex cases, and QA-sample 5–10% weekly.', pct: '~80%' },
]

export default function LandingPage() {
  const rootRef = useRef(null)

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
  }, [])

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
            <a href="#capabilities">Capabilities</a>
            <a href="#architecture">Architecture</a>
            <a href="#safety">Safety</a>
            <a href="#rollout">Rollout</a>
          </nav>
          <div className="nav-cta">
            <Link className="btn btn--primary" to="/login">Get started</Link>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-center">
            <div className="stat-pill">
              <span><b>~60%</b> low-touch absorbed</span>
              <span className="sep" />
              <span><b>15 → 250+</b> patients, same headcount</span>
              <span className="sep" />
              <span><b>&lt;2 min</b> red-flag escalation</span>
            </div>
            <h1>The support agent that knows <span className="accent">when to escalate</span></h1>
            <p className="sub">Vela runs the low-touch half of your patient program across WhatsApp and SMS — adherence, PRO collection, triage and FAQs — and routes every clinical red flag to a human in under two minutes.</p>
            <div className="hero-actions">
              <Link className="btn btn--primary" to="/login">Get started</Link>
              <a className="btn btn--ghost" href="#architecture">See how it works</a>
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
                  {ORBIT_NODES.map((node) => (
                    <div key={node.label} className="orbit-node" style={{ '--a': node.a, '--r': '170px' }}>
                      <span className="node-chip"><i /> {node.label}</span>
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
            <span className="lbl">Built on a measured standard</span>
            <div className="stack">
              {['Gemini API', 'Healthie', 'WhatsApp Business', 'LangGraph', 'pgvector RAG', 'Langfuse'].map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>
        </div>

        {/* METRICS */}
        <section className="section section--tight" id="metrics">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="kicker">01 — <b>The standard</b></span>
              <h2>Held to numbers, not promises.</h2>
              <p>Every drafted response, every escalation and every PRO is measured continuously — and gated against these thresholds before the agent earns more autonomy.</p>
            </div>
            <div className="metrics-grid reveal">
              {[
                { n: '95', u: '%+', d: 'Approval rate on drafted responses under human review.', tag: 'Quality gate' },
                { n: '<2', u: 'min', d: 'Escalation latency for clinical red flags to a live human.', tag: 'Safety SLA' },
                { n: '80', u: '%+', d: 'PRO completion via WhatsApp within a 48-hour window.', tag: 'Throughput' },
                { n: '0', u: '', d: 'Pharmacovigilance reporting misses. Never one dropped.', tag: 'Non-negotiable' },
              ].map((m) => (
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
              <span className="kicker">02 — <b>What Vela runs</b></span>
              <h2>Five interaction types, one accountable agent.</h2>
              <p>Vela covers the full lifecycle of a patient in the program — and hands off the moment a conversation needs a clinician, a coordinator, or a human touch.</p>
            </div>
            <div className="cap-list reveal">
              {CAPS.map((c) => (
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
              <span className="kicker">03 — <b>The architecture</b></span>
              <h2>Deterministic by default, agentic by exception.</h2>
              <p>A deterministic state machine on the outside, tool-using agent loops embedded only in the judgment-heavy nodes — auditable where it must be, human-grade where it matters.</p>
            </div>

            <div className="arch-cols reveal">
              <div className="arch-card det">
                <div className="tophead"><span className="tag">Deterministic shell</span><span className="mono">Fully auditable</span></div>
                <h3>The non-negotiable spine</h3>
                <p className="lead">Consent, PROs and adverse-event escalation can never be probabilistic. These run as fixed, logged state transitions in Healthie.</p>
                <ul>
                  {['Onboarding & ARCO consent', 'PRO collection — PP-NRS, DLQI, SD-NRS', 'Adverse-event detection & escalation', 'PA re-authorization packages', 'Adherence reminder cadence'].map((li) => (
                    <li key={li}>{CHECK} {li}</li>
                  ))}
                </ul>
              </div>
              <div className="arch-card agt">
                <div className="tophead"><span className="tag">Agentic loops</span><span className="mono">RAG · bounded tools</span></div>
                <h3>Judgment, on a leash</h3>
                <p className="lead">Narrow, tool-using loops over an approved corpus. If the query exits the corpus or trips the AE classifier, Vela does not answer — it escalates.</p>
                <ul>
                  {['Open patient questions (FAQ over corpus)', 'FFS specialist-network scheduling', 'Inbound intent triage & routing', 'Every loop wrapped in input & output guardrails'].map((li) => (
                    <li key={li}>{STAR} {li}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* data flow */}
            <div className="dataflow reveal">
              <div className="df-col read">
                <div className="ct">Reads</div>
                <div className="src">
                  <div className="df-src"><b>Healthie</b><span>Patient record · prior interactions · PA status</span></div>
                  <div className="df-src"><b>Vector store</b><span>Approved SOPs · scripts · escalation trees</span></div>
                  <div className="df-src"><b>Twilio WhatsApp</b><span>Inbound messages · PRO replies</span></div>
                </div>
              </div>
              <div className="df-col center">
                <div className="df-core"><VelaMark /></div>
                <div className="ctitle">Vela Agent</div>
                <div className="csub">Gemini API + orchestrator. Handles ~60% of low-touch traffic; escalates red flags to a human.</div>
                <span className="chip">Gemini · LangGraph</span>
              </div>
              <div className="df-col write">
                <div className="ct" style={{ textAlign: 'right' }}>Writes</div>
                <div className="src">
                  <div className="df-src"><b>Healthie</b><span>Interaction logs · PRO scores · adherence</span></div>
                  <div className="df-src"><b>Observability</b><span>Transcripts · latency · QA scoring inputs</span></div>
                  <div className="df-src"><b>Ticketing queue</b><span>Clinical escalations · adverse events · flags</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SAFETY */}
        <section className="section" id="safety">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="kicker">04 — <b>The boundaries</b></span>
              <h2>When in doubt, a human is on the line.</h2>
              <p>The lines below never relax — not at any maturity phase. Every drift toward them is logged and deferred to the treating dermatologist.</p>
            </div>
            <div className="safety-grid reveal">
              <div className="bounds">
                <div className="bh">Hard boundaries</div>
                {['No diagnosis or symptom interpretation', 'Never modifies dose, frequency or schedule', 'No off-label or cross-biologic comparison', 'Captures adverse events — never closes them', 'No payer authorization decisions'].map((b) => (
                  <div className="bound" key={b}><span className="x">{X}</span> {b}</div>
                ))}
              </div>
              <div className="esc">
                {ESCALATIONS.map((e) => (
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
              <span className="kicker">05 — <b>The rollout</b></span>
              <h2>Autonomy is earned, one phase at a time.</h2>
              <p>Vela never flips a whole category at once. Each phase has numeric exit gates and a kill switch that reverts any category to human review instantly.</p>
            </div>
            <div className="phases reveal">
              {PHASES.map((p) => (
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
              <span className="eyebrow">Galderma Mexico · Nemluvio® PSP</span>
              <h2>Bring Vela to your program.</h2>
              <p>A viable path from 15 to 250+ patients on the same headcount — with regulatory traceability on every controlled step.</p>
              <div className="cta-actions">
                <Link className="btn btn--primary" to="/login">Get started <svg className="arrow" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
                <a className="btn btn--ghost" href="#architecture">Read the spec</a>
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
              <p className="tag">The patient support agent that watches closely and stays in its lane.</p>
            </div>
            <div className="footer-cols">
              <div className="fcol">
                <h5>Product</h5>
                <a href="#capabilities">Capabilities</a>
                <a href="#architecture">Architecture</a>
                <a href="#safety">Safety</a>
                <a href="#rollout">Rollout</a>
              </div>
              <div className="fcol">
                <h5>Program</h5>
                <a href="#">Nemluvio® PSP</a>
                <a href="#">Adverse events</a>
                <a href="#">Data &amp; privacy</a>
                <a href="#">Medical Affairs</a>
              </div>
              <div className="fcol">
                <h5>Contact</h5>
                <Link to="/login">Get started</Link>
                <a href="#">Operations team</a>
                <a href="#">Pharmacovigilance</a>
              </div>
            </div>
          </div>
          <div className="footer-bot">
            <span className="mono">© 2026 Vela · Patient Support Program</span>
            <span className="built"><VelaMark /> Built on Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
