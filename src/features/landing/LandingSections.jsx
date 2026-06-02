// Flat, minimal sections — one per hero CTA. Tokens live in landing.css.

const STEPS = [
  {
    title: "Message Vela on WhatsApp",
    body: "Reminders, check-ins, and everyday questions — in your language, whenever you need.",
  },
  {
    title: "Vela handles the routine",
    body: "It answers within safe clinical boundaries and never gives medical advice it shouldn't.",
  },
  {
    title: "A human steps in when it matters",
    body: "Anything urgent or clinical is handed to a real person in minutes, with full context.",
  },
]

export default function LandingSections() {
  return (
    <>
      <section id="how-it-works" className="vela-section">
        <p className="vela-eyebrow">How it works</p>
        <h2 className="vela-h2">Support that stays in its lane</h2>
        <p className="vela-lead">
          Vela carries the low-touch work so your care team can focus on the cases that
          need a human. Three steps, no app to install.
        </p>

        <ol className="vela-steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="vela-step">
              <span className="vela-step-num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="vela-step-title">{step.title}</p>
                <p className="vela-step-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="talk-to-vela" className="vela-section">
        <p className="vela-eyebrow">Talk to Vela</p>
        <h2 className="vela-h2">Start a conversation</h2>
        <p className="vela-lead">
          Leave your number and Vela will reach out on WhatsApp. No queues, no hold music.
        </p>

        <form
          className="vela-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            className="vela-input"
            type="tel"
            name="phone"
            placeholder="Your WhatsApp number"
            aria-label="Your WhatsApp number"
          />
          <button type="submit" className="vela-btn vela-btn-primary">
            Message me
          </button>
        </form>

        <p className="vela-note">Available in Spanish and English.</p>
      </section>
    </>
  )
}
