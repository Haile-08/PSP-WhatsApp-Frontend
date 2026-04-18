import { Search, MoreVertical, ArrowLeft, Phone, Video } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setActiveSession } from '../chat/chatSlice'
import Avatar from '../../components/Avatar'

export default function ChatHeader({ session }) {
  const dispatch = useDispatch()
  const name = session?.name || 'PSP Assist'

  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: '60px',
        backgroundColor: '#f0f2f5',
        padding: '10px 16px',
        gap: '4px',
      }}
    >
      {/* Mobile-only back arrow */}
      <button
        className="icon-btn md:hidden shrink-0"
        onClick={() => dispatch(setActiveSession(null))}
        title="Back"
      >
        <ArrowLeft size={22} />
      </button>

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
              color: '#111b21',
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
              color: '#667781',
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
                backgroundColor: '#25d366',
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
        <button className="icon-btn" title="More options">
          <MoreVertical size={22} />
        </button>
      </div>
    </div>
  )
}
