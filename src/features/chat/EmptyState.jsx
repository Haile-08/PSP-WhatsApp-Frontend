import { Lock } from 'lucide-react'

export default function EmptyState() {
  return (
    <div
      className="flex flex-col h-full relative chat-bg"
      style={{
        borderLeft: '1px solid #262b27',
      }}
    >
      {/* Main centered content */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ padding: '0 32px 60px', textAlign: 'center' }}
      >
        {/* WhatsApp-style intro illustration */}
        <svg
          width="320"
          height="188"
          viewBox="0 0 320 188"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginBottom: '36px', opacity: 0.92 }}
        >
          <defs>
            <linearGradient id="laptopGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f352f" />
              <stop offset="1" stopColor="#262b27" />
            </linearGradient>
          </defs>

          {/* Laptop body */}
          <rect x="50" y="24" width="220" height="128" rx="10"
            fill="#1e221e" stroke="url(#laptopGrad)" strokeWidth="2" />
          <rect x="58" y="32" width="204" height="112" rx="4"
            fill="#141714" stroke="none" />

          {/* Chat bubbles on screen */}
          <rect x="70" y="46" width="92" height="14" rx="5" fill="#262b27" stroke="#2f352f" strokeWidth="0.8" />
          <rect x="172" y="68" width="80" height="14" rx="5" fill="#14361f" stroke="#2a5a33" strokeWidth="0.8" />
          <rect x="70" y="90" width="110" height="14" rx="5" fill="#262b27" stroke="#2f352f" strokeWidth="0.8" />
          <rect x="172" y="112" width="80" height="14" rx="5" fill="#14361f" stroke="#2a5a33" strokeWidth="0.8" />

          {/* Hinge + base */}
          <path d="M40 152 L280 152" stroke="#2f352f" strokeWidth="2" strokeLinecap="round" />
          <rect x="30" y="152" width="260" height="10" rx="3" fill="#1e221e" stroke="#2f352f" strokeWidth="1" />
          <rect x="140" y="162" width="40" height="4" rx="2" fill="#2f352f" />

          {/* Signal waves */}
          <path d="M282 56 Q296 44 282 32" stroke="#a3e635" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M290 62 Q308 44 290 26" stroke="#a3e635" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M298 68 Q320 44 298 20" stroke="#a3e635" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.45" />
        </svg>

        {/* Heading */}
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 300,
            color: '#e9edec',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            marginBottom: '12px',
            letterSpacing: '-0.4px',
          }}
        >
          PSP Assist Web
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: '#8a958f',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            maxWidth: '460px',
            lineHeight: '20px',
            margin: 0,
          }}
        >
          Send and receive messages with your AI health support assistant.
          Select a chat from the sidebar or start a new conversation.
        </p>
      </div>

      {/* Encrypted footer */}
      <div
        className="flex items-center justify-center"
        style={{
          color: '#8a958f',
          gap: '6px',
          paddingBottom: '36px',
        }}
      >
        <Lock size={12} />
        <span
          style={{
            fontSize: '13px',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          Your personal messages are end-to-end encrypted
        </span>
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: '#a3e635',
        }}
      />
    </div>
  )
}
