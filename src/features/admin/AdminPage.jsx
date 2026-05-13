import { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { MoreVertical, AlertTriangle, Search, Phone } from 'lucide-react'
import Avatar from '../../components/Avatar'
import DropdownMenu from '../../components/DropdownMenu'
import MessageBubble from '../chat/MessageBubble'
import DateSeparator from '../chat/DateSeparator'
import { logout } from '../auth/authSlice'
import {
  useAdminUsersQuery,
  useAdminUserConversationQuery,
  useAdminUserEscalationsQuery,
  useResolveEscalationMutation,
} from './adminApi'

// Reason codes mirror app/models/escalation.py — we render friendly
// labels here so the operator does not see the raw enum.
const REASON_LABELS = {
  identity_failed: 'Identity verification failed',
  clinical_question: 'Clinical question',
  consent_refused: 'Consent refused',
}

function reasonLabel(reason) {
  return REASON_LABELS[reason] || reason
}

function isSameDay(a, b) {
  if (!a || !b) return false
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function formatRelativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (isSameDay(d, now)) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function AdminHeader() {
  const dispatch = useDispatch()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: '60px',
        backgroundColor: '#f0f2f5',
        padding: '10px 16px',
      }}
    >
      <div className="flex items-center" style={{ gap: '12px' }}>
        <Avatar name="Admin" size={40} isBot />
        <div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#111b21',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              lineHeight: '21px',
            }}
          >
            PSP Admin Console
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#667781',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              lineHeight: '18px',
            }}
          >
            Escalations from the agent land here
          </div>
        </div>
      </div>
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
  )
}

function UserListItem({ user, selected, onClick }) {
  const latest = user.latest_escalation
  const hasOpen = user.open_escalations > 0
  const subtitle = latest
    ? reasonLabel(latest.reason)
    : 'No escalations yet'
  const subtitleColor = hasOpen ? '#e11d48' : '#667781'
  const subtitleTimestamp = latest?.created_at
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        gap: '12px',
        padding: '10px 13px',
        backgroundColor: selected ? '#f0f2f5' : 'transparent',
        border: 'none',
        borderBottom: '1px solid #f0f2f5',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = '#f5f6f6'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <Avatar name={user.username} size={49} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between" style={{ gap: '8px' }}>
          <span
            className="truncate"
            style={{
              fontSize: '17px',
              color: '#111b21',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {user.username}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: hasOpen ? '#e11d48' : '#667781',
              whiteSpace: 'nowrap',
            }}
          >
            {formatRelativeTime(subtitleTimestamp || user.created_at)}
          </span>
        </div>
        <div className="flex items-center justify-between" style={{ gap: '8px', marginTop: '2px' }}>
          <span
            className="truncate"
            style={{
              fontSize: '14px',
              color: subtitleColor,
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {hasOpen && (
              <AlertTriangle
                size={13}
                style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}
              />
            )}
            {subtitle}
          </span>
          {hasOpen && (
            <span
              style={{
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                borderRadius: '10px',
                backgroundColor: '#25d366',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user.open_escalations}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function UserList({ users, selectedUserId, onSelect }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q),
    )
  }, [users, query])

  return (
    <div className="flex flex-col" style={{ width: '380px', borderRight: '1px solid #d1d7db', backgroundColor: '#ffffff' }}>
      <AdminHeader />
      <div style={{ padding: '8px 12px', backgroundColor: '#ffffff' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f0f2f5',
            borderRadius: '8px',
            padding: '6px 12px',
          }}
        >
          <Search size={16} color="#54656f" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or start new chat"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              color: '#111b21',
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#667781', fontSize: '14px' }}>
            No users yet
          </div>
        )}
        {filtered.map((u) => (
          <UserListItem
            key={u.id}
            user={u}
            selected={u.id === selectedUserId}
            onClick={() => onSelect(u.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ConversationHeader({ user }) {
  return (
    <div
      className="flex items-center shrink-0"
      style={{
        height: '60px',
        backgroundColor: '#f0f2f5',
        padding: '10px 16px',
        gap: '12px',
        borderBottom: '1px solid #d1d7db',
      }}
    >
      <Avatar name={user.username} size={40} />
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
          {user.username}
        </div>
        <div
          className="flex items-center"
          style={{
            fontSize: '13px',
            color: '#667781',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            lineHeight: '18px',
            gap: '4px',
          }}
        >
          <Phone size={11} />
          {user.phone}
        </div>
      </div>
    </div>
  )
}

function ConversationPane({ user }) {
  const { data, isFetching } = useAdminUserConversationQuery(user.id)
  const messages = data?.messages || []

  if (isFetching && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center chat-bg">
        <span style={{ color: '#667781', fontSize: '14px' }}>Loading conversation…</span>
      </div>
    )
  }

  const rendered = []
  let prevDate = null
  let prevRole = null
  messages.forEach((msg, idx) => {
    const ts = msg.created_at || msg.timestamp
    const role = msg.role || (msg.is_user ? 'user' : 'assistant')
    const isOutgoing = role === 'user'
    if (!isSameDay(ts, prevDate)) {
      rendered.push(<DateSeparator key={`sep-${idx}`} isoString={ts || new Date().toISOString()} />)
      prevDate = ts
      prevRole = null
    }
    const showTail = role !== prevRole
    rendered.push(
      <MessageBubble
        key={msg.id || `msg-${idx}`}
        message={msg}
        showTail={showTail}
        isOutgoing={isOutgoing}
      />,
    )
    prevRole = role
  })

  return (
    <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
      <ConversationHeader user={user} />
      <div className="flex-1 overflow-y-auto chat-bg" style={{ padding: '12px 6% 8px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#667781', fontSize: '13px', padding: '40px 0' }}>
            No messages in this conversation yet.
          </div>
        ) : (
          rendered
        )}
      </div>
      <div
        className="shrink-0"
        style={{
          backgroundColor: '#f0f2f5',
          padding: '14px 16px',
          borderTop: '1px solid #d1d7db',
          fontSize: '12.5px',
          color: '#667781',
          textAlign: 'center',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        Read-only view — admins observe the agent's conversation with the patient.
      </div>
    </div>
  )
}

function EscalationCard({ escalation }) {
  const resolved = !!escalation.resolved_at
  const [resolveEscalation, { isLoading: isResolving }] = useResolveEscalationMutation()

  const handleResolve = async () => {
    try {
      await resolveEscalation(escalation.id).unwrap()
    } catch (err) {
      // RTK Query will surface the failure via the mutation state; nothing
      // user-facing to do beyond logging.
      console.error('Failed to resolve escalation', err)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '12px 14px',
        marginBottom: '10px',
        boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
        borderLeft: `4px solid ${resolved ? '#25d366' : '#e11d48'}`,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
        <span
          style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#111b21',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          {reasonLabel(escalation.reason)}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: resolved ? '#25d366' : '#e11d48',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {resolved ? 'Resolved' : 'Open'}
        </span>
      </div>
      <div
        style={{
          fontSize: '12px',
          color: '#667781',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          marginBottom: '6px',
        }}
      >
        Stage: {escalation.stage} · {formatRelativeTime(escalation.created_at)}
      </div>
      {escalation.detail && (
        <div
          style={{
            fontSize: '13px',
            color: '#3b4a54',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            backgroundColor: '#f0f2f5',
            borderRadius: '4px',
            padding: '6px 8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginBottom: '8px',
          }}
        >
          {escalation.detail}
        </div>
      )}
      {!resolved && escalation.category !== 'guardrail' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleResolve}
            disabled={isResolving}
            style={{
              fontSize: '12.5px',
              fontWeight: 500,
              color: '#ffffff',
              backgroundColor: isResolving ? '#9aa7ad' : '#25d366',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: isResolving ? 'wait' : 'pointer',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
            title="Mark resolved and send the patient back into onboarding"
          >
            {isResolving ? 'Resolving…' : 'Resolve'}
          </button>
        </div>
      )}
    </div>
  )
}

function EscalationsPane({ user }) {
  const { data: escalations = [], isFetching } = useAdminUserEscalationsQuery(user.id)
  const openCount = escalations.filter((e) => !e.resolved_at).length

  return (
    <div
      className="flex flex-col"
      style={{
        width: '360px',
        borderLeft: '1px solid #d1d7db',
        backgroundColor: '#f7f8fa',
      }}
    >
      <div
        className="shrink-0"
        style={{
          height: '60px',
          backgroundColor: '#f0f2f5',
          padding: '10px 16px',
          borderBottom: '1px solid #d1d7db',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: '#111b21',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          Escalations
        </div>
        <div
          style={{
            fontSize: '12.5px',
            color: openCount > 0 ? '#e11d48' : '#667781',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          {escalations.length === 0
            ? 'No escalations'
            : `${openCount} open · ${escalations.length} total`}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {isFetching && escalations.length === 0 && (
          <div style={{ color: '#667781', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
            Loading…
          </div>
        )}
        {!isFetching && escalations.length === 0 && (
          <div style={{ color: '#667781', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
            The agent has not escalated for this user.
          </div>
        )}
        {escalations.map((e) => (
          <EscalationCard key={e.id} escalation={e} />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex-1 flex items-center justify-center chat-bg"
      style={{ flexDirection: 'column', gap: '12px' }}
    >
      <Avatar name="Admin" size={72} isBot />
      <div
        style={{
          fontSize: '20px',
          color: '#41525d',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        Select a user to view their conversation
      </div>
      <div style={{ fontSize: '13px', color: '#667781', maxWidth: '360px', textAlign: 'center' }}>
        When the agent escalates a turn it lands here. Pick a contact on the left
        to see the full chat and every escalation logged for that user.
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { data: users = [] } = useAdminUsersQuery()
  // ``null`` means "no manual selection yet" — the render then falls back
  // to the user with the most recent open escalation so the operator's
  // eye lands somewhere useful without us calling setState in an effect.
  const [selectedUserId, setSelectedUserId] = useState(null)

  const selectedUser = useMemo(() => {
    if (users.length === 0) return null
    if (selectedUserId !== null) {
      return users.find((u) => u.id === selectedUserId) || null
    }
    return users.find((u) => u.open_escalations > 0) || users[0] || null
  }, [users, selectedUserId])

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      <UserList
        users={users}
        selectedUserId={selectedUser?.id ?? null}
        onSelect={setSelectedUserId}
      />
      {selectedUser ? (
        <>
          <ConversationPane user={selectedUser} />
          <EscalationsPane user={selectedUser} />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
