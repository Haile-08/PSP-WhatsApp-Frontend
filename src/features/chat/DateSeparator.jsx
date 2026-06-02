function formatDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffDays = Math.floor(
    (now.setHours(0,0,0,0) - date.setHours(0,0,0,0)) / 86400000
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function DateSeparator({ isoString }) {
  return (
    <div className="flex justify-center my-3">
      <span
        style={{
          backgroundColor: '#1e221e',
          color: '#8a958f',
          fontSize: '12.5px',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          padding: '5px 12px',
          borderRadius: '8px',
          border: '1px solid #262b27',
          userSelect: 'none',
        }}
      >
        {formatDate(isoString)}
      </span>
    </div>
  )
}
