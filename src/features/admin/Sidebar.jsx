import { useDispatch } from 'react-redux'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'
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
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        color: isActive ? '#5FBA82' : '#8a958f',
        backgroundColor: isActive ? 'rgba(95, 186, 130, 0.12)' : 'transparent',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = '#e9edec'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = '#8a958f'
      }}
    >
      <Icon size={18} />
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
      }}
    >
      {/* Brand mark sits in a 60px-tall block carrying the same bottom border
          as the content headers, so that header line runs unbroken across the
          sidebar too. */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: '100%',
          height: '60px',
          borderBottom: '1px solid #262b27',
        }}
      >
        <img src="/icon.svg" alt="PSP" width={32} height={32} />
      </div>

      <div
        className="flex flex-col items-center"
        style={{ flex: 1, width: '100%', padding: '16px 0', gap: '8px' }}
      >
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
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            color: '#8a958f',
            backgroundColor: 'transparent',
            transition: 'color 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f87171'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8a958f'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
