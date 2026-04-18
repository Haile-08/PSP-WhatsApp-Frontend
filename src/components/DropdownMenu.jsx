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
        backgroundColor: '#ffffff',
        borderRadius: '3px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.26), 0 2px 10px rgba(0,0,0,0.16)',
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
            color: item.danger ? '#f15c6d' : '#3b4a54',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f6f6' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
