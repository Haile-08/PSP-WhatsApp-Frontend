const PASTEL_COLORS = [
  '#dfe5f5', '#fde8e8', '#e8f5e9', '#fff8e1',
  '#fce4ec', '#e3f2fd', '#f3e5f5', '#e0f7fa',
]

function colorFromName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length]
}

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

export default function Avatar({ name = '', size = 49, isBot = false }) {
  if (isBot) {
    return (
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00a884 0%, #008069 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 8V4H8" />
          <rect x="2" y="8" width="20" height="12" rx="2" />
          <path d="M6 8v12" />
          <path d="M18 8v12" />
          <path d="M2 14h20" />
        </svg>
      </div>
    )
  }

  const bg = colorFromName(name)
  const text = initials(name) || '?'

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 500,
        color: '#41525d',
        fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      {text}
    </div>
  )
}
