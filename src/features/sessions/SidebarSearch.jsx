import { useState } from 'react'
import { Search, ArrowLeft } from 'lucide-react'

const FILTERS = ['All', 'Unread', 'Favourites', 'Groups']

export default function SidebarSearch({ value, onChange, filter = 'All', onFilterChange }) {
  const [focused, setFocused] = useState(false)
  const hasQuery = value && value.length > 0

  return (
    <div
      className="shrink-0"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Search bar */}
      <div
        className="flex items-center"
        style={{ padding: '7px 12px 6px' }}
      >
        <div
          className="relative flex items-center w-full"
          style={{
            backgroundColor: '#f0f2f5',
            borderRadius: '8px',
            height: '35px',
            transition: 'box-shadow 0.15s',
            boxShadow: focused ? 'inset 0 0 0 1.5px #00a884' : 'none',
          }}
        >
          <button
            type="button"
            onClick={() => hasQuery && onChange('')}
            className="absolute flex items-center justify-center"
            style={{
              left: 0,
              top: 0,
              bottom: 0,
              width: '44px',
              color: hasQuery || focused ? '#00a884' : '#54656f',
              border: 'none',
              background: 'transparent',
              cursor: hasQuery ? 'pointer' : 'default',
              transition: 'color 0.15s',
            }}
            tabIndex={-1}
            aria-label={hasQuery ? 'Clear search' : 'Search'}
          >
            {hasQuery ? <ArrowLeft size={18} /> : <Search size={16} />}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              paddingLeft: '44px',
              paddingRight: '12px',
              fontSize: '14px',
              color: '#111b21',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          />
        </div>
      </div>

      {/* Filter pills */}
      {onFilterChange && (
        <div
          className="flex items-center"
          style={{ padding: '5px 12px 8px', gap: '6px', overflowX: 'auto' }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={`wa-pill${filter === f ? ' wa-pill-active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
