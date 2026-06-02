import { useEffect, useRef } from 'react'

export default function DropdownMenu({ items, onClose, style = {} }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        width: '220px',
        backgroundColor: '#1e221e',
        border: '1px solid #262b27',
        borderRadius: '8px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        zIndex: 50,
        overflow: 'hidden',
        ...style,
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose() }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '13px 24px',
            fontSize: '14.5px',
            color: item.danger ? '#f87171' : '#d6ddd9',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#262b27' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
