import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { ChevronDown } from 'lucide-react'
import Avatar from '../../components/Avatar'
import DropdownMenu from '../../components/DropdownMenu'
import { setActiveSession } from '../chat/chatSlice'
import { useRenameSessionMutation, useDeleteSessionMutation } from './sessionsApi'

function formatTimestamp(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffDays = Math.floor(
    (now.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / 86400000
  )
  if (diffDays === 0) {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return new Date(isoString).toLocaleDateString([], { weekday: 'short' })
  } else {
    return new Date(isoString).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
}

export default function SessionRow({ session, isActive }) {
  const dispatch = useDispatch()
  const [renameSession] = useRenameSessionMutation()
  const [deleteSession] = useDeleteSessionMutation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const lastMsg = session.last_message || session.messages?.[session.messages.length - 1]
  const preview = lastMsg?.content || lastMsg?.text || 'No messages yet'
  const ts = lastMsg?.created_at || session.updated_at || session.created_at
  const unread = session.unread_count || 0

  const handleRename = () => {
    const newName = window.prompt('Rename conversation:', session.name)
    if (newName && newName.trim()) renameSession({ id: session.id, name: newName.trim() })
  }

  const menuItems = [
    { label: 'Rename chat', onClick: handleRename },
    { label: 'Delete chat', danger: true, onClick: () => deleteSession(session.id) },
  ]

  const openMenu = (e) => {
    e.stopPropagation()
    setMenuOpen(true)
  }

  return (
    <div
      onClick={() => dispatch(setActiveSession(session.id))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: '72px',
        paddingLeft: '13px',
        paddingRight: '15px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#f0f2f5' : hovered ? '#f5f6f6' : '#ffffff',
        transition: 'background-color 0.1s',
      }}
    >
      {/* Avatar */}
      <div style={{ marginRight: '15px', flexShrink: 0 }}>
        <Avatar name={session.name || 'Chat'} size={49} isBot />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          borderBottom: isActive ? 'none' : '1px solid #e9edef',
          height: '72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingRight: '2px',
        }}
      >
        {/* Top row: name + timestamp */}
        <div className="flex items-center justify-between" style={{ marginBottom: '3px' }}>
          <span
            className="truncate"
            style={{
              fontSize: '17px',
              color: '#111b21',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              fontWeight: 400,
              flex: 1,
              minWidth: 0,
            }}
          >
            {session.name || 'New conversation'}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: unread > 0 ? '#25d366' : '#667781',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              flexShrink: 0,
              marginLeft: '6px',
              fontWeight: unread > 0 ? 500 : 400,
            }}
          >
            {formatTimestamp(ts)}
          </span>
        </div>

        {/* Bottom row: preview + badge / menu */}
        <div className="flex items-center justify-between">
          <span
            className="truncate"
            style={{
              fontSize: '14px',
              color: '#667781',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              flex: 1,
              minWidth: 0,
              lineHeight: '20px',
            }}
          >
            {preview}
          </span>

          <div
            style={{
              flexShrink: 0,
              marginLeft: '6px',
              position: 'relative',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {unread > 0 && !hovered && (
              <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
            )}
            {(hovered || menuOpen) && (
              <>
                <button
                  onClick={openMenu}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    background: 'transparent',
                    color: '#54656f',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="Menu"
                >
                  <ChevronDown size={18} />
                </button>
                {menuOpen && (
                  <DropdownMenu
                    items={menuItems}
                    onClose={() => setMenuOpen(false)}
                    style={{ top: 24, right: 0 }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
