import { useDispatch } from 'react-redux'
import { LayoutDashboard, Users, Boxes, LogOut } from 'lucide-react'
import { logout } from '../auth/authSlice'

// The far-left icon rail of the admin console. Two destinations only —
// the live Dashboard and the Patients workspace — mirroring the product
// shell in the design. ``active`` is one of 'dashboard' | 'patients'.
const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', Icon: Users },
]

function NavButton({ item, active, onClick }) {
  const isActive = active === item.id
  const { Icon } = item
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      title={item.label}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        color: isActive ? '#0c0e0d' : '#8a958f',
        backgroundColor: isActive ? '#a3e635' : 'transparent',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#1e221e'
          e.currentTarget.style.color = '#e9edec'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#8a958f'
        }
      }}
    >
      <Icon size={22} />
    </button>
  )
}

export default function Sidebar({ active, onNavigate }) {
  const dispatch = useDispatch()
  return (
    <div
      className="shrink-0"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '64px',
        height: '100%',
        backgroundColor: '#151815',
        borderRight: '1px solid #262b27',
        padding: '16px 0',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: '#1e221e',
          color: '#a3e635',
          marginBottom: '16px',
        }}
      >
        <Boxes size={24} />
      </div>

      {NAV.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={active}
          onClick={onNavigate}
        />
      ))}

      <button
        type="button"
        onClick={() => dispatch(logout())}
        title="Logout"
        aria-label="Logout"
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          color: '#8a958f',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2a1d1d'
          e.currentTarget.style.color = '#f87171'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#8a958f'
        }}
      >
        <LogOut size={20} />
      </button>
    </div>
  )
}
