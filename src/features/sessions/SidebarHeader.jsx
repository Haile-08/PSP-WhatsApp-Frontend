import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MoreVertical, MessageSquarePlus, Users } from 'lucide-react'
import { logout, selectUser } from '../auth/authSlice'
import { useCreateSessionMutation } from './sessionsApi'
import { setActiveSession } from '../chat/chatSlice'
import Avatar from '../../components/Avatar'
import DropdownMenu from '../../components/DropdownMenu'

export default function SidebarHeader() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [createSession] = useCreateSessionMutation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleCreateSession = async () => {
    try {
      const created = await createSession().unwrap()
      if (created?.id) dispatch(setActiveSession(created.id))
    } catch {
      // Swallow; RTK Query exposes the error via the mutation result if needed.
    }
  }

  const displayName = user?.email || 'Me'

  const menuItems = [
    { label: 'New chat', onClick: handleCreateSession },
    { label: 'Log out', danger: true, onClick: () => dispatch(logout()) },
  ]

  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: '60px',
        backgroundColor: '#ffffff',
        padding: '10px 16px',
      }}
    >
      {/* Chats title */}
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#111b21',
          letterSpacing: '-0.2px',
          margin: 0,
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        Chats
      </h1>

      {/* Right icons */}
      <div className="flex items-center" style={{ gap: '2px' }}>
        <button className="icon-btn" title="Communities">
          <Users size={22} />
        </button>

        <button
          className="icon-btn"
          title="New chat"
          onClick={handleCreateSession}
        >
          <MessageSquarePlus size={22} />
        </button>

        <div className="relative">
          <button
            className="icon-btn"
            onClick={() => setMenuOpen((o) => !o)}
            title="Menu"
          >
            <MoreVertical size={22} />
          </button>
          {menuOpen && (
            <DropdownMenu
              items={menuItems}
              onClose={() => setMenuOpen(false)}
              style={{ top: '44px', right: 0 }}
            />
          )}
        </div>

        {/* Self avatar — tucked last for quick access */}
        <button
          className="rounded-full ml-1"
          style={{ outline: 'none', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}
          title={displayName}
        >
          <Avatar name={displayName} size={32} />
        </button>
      </div>
    </div>
  )
}
