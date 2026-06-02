import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Search, MoreVertical, Phone, Video } from 'lucide-react'
import Avatar from '../../components/Avatar'
import DropdownMenu from '../../components/DropdownMenu'
import { logout } from '../auth/authSlice'

export default function ChatHeader({ session }) {
  const name = session?.name || 'PSP Assist'
  const dispatch = useDispatch()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: '60px',
        backgroundColor: '#151815',
        borderBottom: '1px solid #262b27',
        padding: '10px 16px',
        gap: '4px',
      }}
    >
      {/* Avatar + name + subtitle — clickable "open contact info" affordance */}
      <button
        type="button"
        className="flex items-center flex-1 min-w-0"
        style={{
          gap: '12px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <Avatar name={name} size={40} isBot />
        <div className="min-w-0">
          <div
            className="truncate"
            style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#e9edec',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              lineHeight: '21px',
            }}
          >
            {name}
          </div>
          <div
            className="flex items-center"
            style={{
              fontSize: '13px',
              color: '#8a958f',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              lineHeight: '18px',
              gap: '6px',
            }}
          >
            <span
              aria-hidden
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#a3e635',
                boxShadow: '0 0 6px rgba(163,230,53,0.8)',
                display: 'inline-block',
              }}
            />
            online
          </div>
        </div>
      </button>

      {/* Right icons */}
      <div className="flex items-center shrink-0" style={{ gap: '2px' }}>
        <button className="icon-btn hidden lg:flex" title="Video call">
          <Video size={22} />
        </button>
        <button className="icon-btn hidden lg:flex" title="Voice call">
          <Phone size={20} />
        </button>
        <button className="icon-btn" title="Search">
          <Search size={20} />
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            title="More options"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical size={22} />
          </button>
          {menuOpen && (
            <DropdownMenu
              onClose={() => setMenuOpen(false)}
              style={{ top: '44px', right: '0' }}
              items={[
                {
                  label: 'Logout',
                  danger: true,
                  onClick: () => dispatch(logout()),
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  )
}
