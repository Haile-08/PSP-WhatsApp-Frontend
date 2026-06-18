import { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  MoreVertical,
  AlertTriangle,
  Search,
  Phone,
  FileText,
  User as UserIcon,
  Mail,
  Calendar,
  Venus,
  MapPin,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  CircleDashed,
  ExternalLink,
  Stethoscope,
  Syringe,
  Pill,
  Activity,
} from 'lucide-react'
import Avatar from '../../components/Avatar'
import DropdownMenu from '../../components/DropdownMenu'
import MessageBubble from '../chat/MessageBubble'
import DateSeparator from '../chat/DateSeparator'
import ChatInput from '../chat/ChatInput'
import { logout } from '../auth/authSlice'
import {
  useAdminUsersQuery,
  useAdminUserProfileQuery,
  useAdminUserConversationQuery,
  useSendAdminMessageMutation,
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

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`

// The document endpoints are admin-only, so a plain <img src> / <a href>
// (which can't carry the bearer token) won't work. Fetch the file as a blob
// with the token and open the object URL in a new tab. ``path`` is the admin
// route segment, e.g. ``prescription`` or ``insurance-policy``.
async function openDocument(userId, path) {
  const token = localStorage.getItem('access_token')
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    // Revoke after a delay so the new tab has time to load the resource.
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (err) {
    console.error('Failed to load document', err)
  }
}

// Coarse 1..8 onboarding journey, surfaced as friendly labels in the profile
// pane header. Mirrors the phase constants in
// app/core/langgraph/agents/onboarding/phases.py.
const PHASE_LABELS = {
  1: 'Registration',
  2: 'Pre-Verification',
  3: 'Clinical Information',
  4: 'Consent',
  5: 'Scheduling',
  6: 'Broker & Shipment',
  7: 'Claim Follow-up',
  8: 'Additional Benefits',
}

// Canonical gender tokens persisted by the Phase 2 engine → display label.
const GENDER_LABELS = {
  femenino: 'Female',
  masculino: 'Male',
  otro: 'Other',
  no_especifica: 'Prefers not to say',
}

function genderLabel(g) {
  if (!g) return null
  return GENDER_LABELS[g] || g
}

// Render a tri-state boolean clinical answer: null/undefined stays "not
// captured" (handled by ProfileField), true → "Yes", false → "No".
function yesNoLabel(value) {
  if (value === null || value === undefined) return null
  return value ? 'Yes' : 'No'
}

function formatDob(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
}

// Compare a section's phase against the patient's current onboarding_phase to
// drive the status pill: a phase fully behind the cursor is complete, the
// phase the cursor sits on is in progress, and anything ahead is pending.
function phaseStatus(currentPhase, sectionPhase) {
  if (currentPhase > sectionPhase) return 'complete'
  if (currentPhase === sectionPhase) return 'active'
  return 'pending'
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
        backgroundColor: '#151815',
        borderBottom: '1px solid #262b27',
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
              color: '#e9edec',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              lineHeight: '21px',
            }}
          >
            PSP Admin Console
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#8a958f',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              lineHeight: '18px',
            }}
          >
            Patient onboarding & document review
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
  const subtitleColor = hasOpen ? '#f87171' : '#8a958f'
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
        backgroundColor: selected ? '#1e221e' : 'transparent',
        border: 'none',
        borderBottom: '1px solid #1a1d1a',
        borderLeft: selected ? '3px solid #a3e635' : '3px solid transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = '#171a17'
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
              color: '#e9edec',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {user.username}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: hasOpen ? '#f87171' : '#8a958f',
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
                backgroundColor: '#a3e635',
                color: '#0c0e0d',
                fontSize: '12px',
                fontWeight: 700,
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
    <div className="flex flex-col" style={{ width: '380px', borderRight: '1px solid #262b27', backgroundColor: '#101210' }}>
      <AdminHeader />
      <div style={{ padding: '8px 12px', backgroundColor: '#101210' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e221e',
            border: '1px solid #262b27',
            borderRadius: '8px',
            padding: '6px 12px',
          }}
        >
          <Search size={16} color="#8a958f" />
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
              color: '#e9edec',
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8a958f', fontSize: '14px' }}>
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
        backgroundColor: '#151815',
        padding: '10px 16px',
        gap: '12px',
        borderBottom: '1px solid #262b27',
      }}
    >
      <Avatar name={user.username} size={40} />
      <div className="min-w-0" style={{ flex: 1 }}>
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
          {user.username}
        </div>
        <div
          className="flex items-center"
          style={{
            fontSize: '13px',
            color: '#8a958f',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            lineHeight: '18px',
            gap: '4px',
          }}
        >
          <Phone size={11} />
          {user.phone}
        </div>
      </div>
      {user.has_prescription && (
        <button
          type="button"
          onClick={() => openDocument(user.id, 'prescription')}
          title="View the prescription image uploaded at registration"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#0c0e0d',
            backgroundColor: '#a3e635',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          <FileText size={14} />
          Prescription
        </button>
      )}
    </div>
  )
}

function ConversationPane({ user }) {
  const { data, isFetching } = useAdminUserConversationQuery(user.id)
  const [sendAdminMessage, { isLoading: isSending }] = useSendAdminMessageMutation()
  const messages = data?.messages || []

  const handleSend = async (text) => {
    const content = text.trim()
    if (!content) return
    try {
      await sendAdminMessage({ userId: user.id, content }).unwrap()
    } catch (err) {
      // RTK Query surfaces the failure via the mutation state; the message
      // simply won't appear if delivery failed.
      console.error('Failed to send message', err)
    }
  }

  if (isFetching && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center chat-bg">
        <span style={{ color: '#8a958f', fontSize: '14px' }}>Loading conversation…</span>
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
          <div style={{ textAlign: 'center', color: '#8a958f', fontSize: '13px', padding: '40px 0' }}>
            No messages in this conversation yet.
          </div>
        ) : (
          rendered
        )}
      </div>
      <ChatInput onSend={handleSend} isStreaming={isSending} />
    </div>
  )
}

// --- Patient profile pane (Phase 1 + Phase 2 onboarding) -----------------

const STATUS_META = {
  complete: { label: 'Complete', color: '#a3e635', Icon: CheckCircle2 },
  active: { label: 'In progress', color: '#fbbf24', Icon: Clock },
  pending: { label: 'Pending', color: '#8a958f', Icon: CircleDashed },
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  const { Icon } = meta
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: 600,
        color: meta.color,
        backgroundColor: `${meta.color}1a`,
        border: `1px solid ${meta.color}40`,
        borderRadius: '999px',
        padding: '3px 9px',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  )
}

// A single labelled datum. Falls back to a muted "Not captured yet" so the
// operator can tell an empty field from a captured one at a glance.
function ProfileField(props) {
  // Destructure in the body (not the param list) so the JSX-only ``Icon``
  // binding is matched by the uppercase varsIgnorePattern — this project's
  // ESLint config has no react/jsx-uses-vars rule.
  const { icon: Icon, label, value } = props
  const has = value !== null && value !== undefined && value !== ''
  return (
    <div className="flex items-start" style={{ gap: '10px', padding: '7px 0' }}>
      <Icon size={15} color="#6f7a74" style={{ marginTop: '2px', flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '11px',
            color: '#8a958f',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '14px',
            color: has ? '#e9edec' : '#5c655f',
            fontStyle: has ? 'normal' : 'italic',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            wordBreak: 'break-word',
            marginTop: '1px',
          }}
        >
          {has ? value : 'Not captured yet'}
        </div>
      </div>
    </div>
  )
}

// A document row with a status dot and, when present, a button that streams
// the file (auth-only) into a new tab.
function DocumentRow(props) {
  const { icon: Icon, label, available, onView } = props
  return (
    <div
      className="flex items-center justify-between"
      style={{
        gap: '10px',
        padding: '9px 11px',
        marginTop: '8px',
        backgroundColor: '#101210',
        border: '1px solid #262b27',
        borderRadius: '8px',
      }}
    >
      <div className="flex items-center" style={{ gap: '10px', minWidth: 0 }}>
        <Icon size={16} color={available ? '#a3e635' : '#6f7a74'} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div
            className="truncate"
            style={{
              fontSize: '13.5px',
              color: '#e9edec',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '11.5px',
              color: available ? '#8a958f' : '#5c655f',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {available ? 'Uploaded' : 'Awaiting upload'}
          </div>
        </div>
      </div>
      {available && (
        <button
          type="button"
          onClick={onView}
          title={`Open ${label.toLowerCase()} in a new tab`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#0c0e0d',
            backgroundColor: '#a3e635',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 10px',
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          <ExternalLink size={13} />
          View
        </button>
      )}
    </div>
  )
}

// A collapsible-looking section wrapping one onboarding phase. Header carries
// the phase number, name and a status pill computed from the live cursor.
function SectionCard(props) {
  const { phase, title, subtitle, icon: Icon, status, children } = props
  return (
    <div
      style={{
        backgroundColor: '#151815',
        border: '1px solid #262b27',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '14px',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          gap: '10px',
          padding: '13px 15px',
          borderBottom: '1px solid #262b27',
          backgroundColor: '#181c18',
        }}
      >
        <div className="flex items-center" style={{ gap: '11px', minWidth: 0 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: '#1f261c',
              border: '1px solid #2c3a26',
              flexShrink: 0,
            }}
          >
            <Icon size={17} color="#a3e635" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '11px',
                color: '#8a958f',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              }}
            >
              Phase {phase}
            </div>
            <div
              className="truncate"
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#e9edec',
                fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              }}
            >
              {title}
            </div>
          </div>
        </div>
        <StatusPill status={status} />
      </div>
      <div style={{ padding: '6px 15px 13px' }}>
        {subtitle && (
          <div
            style={{
              fontSize: '12px',
              color: '#8a958f',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              padding: '7px 0 2px',
            }}
          >
            {subtitle}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

const INSURANCE_STATUS_LABELS = {
  pending: 'Pending verification',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
}

function ProfilePane({ user }) {
  const { data: profile, isFetching } = useAdminUserProfileQuery(user.id)
  const currentPhase = user.onboarding_phase

  const p1 = profile?.phase1
  const p2 = profile?.phase2
  const p3 = profile?.phase3
  const ins = p2?.insurance

  return (
    <div
      className="flex flex-col"
      style={{
        width: '440px',
        borderLeft: '1px solid #262b27',
        backgroundColor: '#0e100e',
      }}
    >
      <div
        className="shrink-0"
        style={{
          height: '60px',
          backgroundColor: '#151815',
          padding: '10px 16px',
          borderBottom: '1px solid #262b27',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#e9edec',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          Patient Profile
        </div>
        <div
          style={{
            fontSize: '12.5px',
            color: '#8a958f',
            fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          Onboarding · {PHASE_LABELS[currentPhase] || `Phase ${currentPhase}`}
          {currentPhase >= 8 ? ' · Complete' : ` · Phase ${currentPhase} of 8`}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {isFetching && !profile && (
          <div style={{ color: '#8a958f', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
            Loading profile…
          </div>
        )}

        {profile && (
          <>
            {/* Identity summary */}
            <div
              className="flex items-center"
              style={{
                gap: '12px',
                padding: '13px 14px',
                marginBottom: '14px',
                backgroundColor: '#151815',
                border: '1px solid #262b27',
                borderRadius: '12px',
              }}
            >
              <Avatar name={p1?.full_name || user.username} size={48} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="truncate"
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#e9edec',
                    fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
                  }}
                >
                  {p1?.full_name || user.username}
                </div>
                <div
                  className="flex items-center truncate"
                  style={{
                    fontSize: '12.5px',
                    color: '#8a958f',
                    gap: '5px',
                    fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
                  }}
                >
                  <Phone size={11} />
                  {user.phone}
                </div>
              </div>
            </div>

            {/* Phase 1 — Registration */}
            <SectionCard
              phase={1}
              title="Registration"
              subtitle="Identity & prescription captured at intake."
              icon={UserIcon}
              status={phaseStatus(currentPhase, 1)}
            >
              <ProfileField icon={UserIcon} label="Full name" value={p1?.full_name} />
              <ProfileField icon={Mail} label="Email" value={p1?.email} />
              <ProfileField icon={Phone} label="Contact phone" value={p1?.contact_phone} />
              <DocumentRow
                icon={FileText}
                label="Prescription"
                available={!!p1?.has_prescription}
                onView={() => openDocument(user.id, 'prescription')}
              />
            </SectionCard>

            {/* Phase 2 — Pre-Verification */}
            <SectionCard
              phase={2}
              title="Pre-Verification"
              subtitle="Demographics, insurance & delivery address."
              icon={ShieldCheck}
              status={phaseStatus(currentPhase, 2)}
            >
              <ProfileField icon={Calendar} label="Date of birth" value={formatDob(p2?.date_of_birth)} />
              <ProfileField icon={Venus} label="Gender" value={genderLabel(p2?.gender)} />
              <ProfileField icon={MapPin} label="Delivery address" value={p2?.address_line} />

              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px dashed #262b27',
                }}
              >
                <div className="flex items-center justify-between" style={{ gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#c2ccc6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
                    }}
                  >
                    Insurance policy
                  </span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: p2?.insurance_status === 'pending' ? '#fbbf24' : '#a3e635',
                    }}
                  >
                    {INSURANCE_STATUS_LABELS[p2?.insurance_status] || p2?.insurance_status}
                  </span>
                </div>
                <ProfileField icon={ShieldCheck} label="Insurer" value={ins?.insurer} />
                <ProfileField icon={CreditCard} label="Policy number" value={ins?.policy_number} />
                <ProfileField icon={UserIcon} label="Policy holder" value={ins?.holder_name} />
                <ProfileField
                  icon={Calendar}
                  label="Validity"
                  value={
                    ins?.valid_from || ins?.valid_to
                      ? `${ins?.valid_from || '—'} → ${ins?.valid_to || '—'}`
                      : null
                  }
                />
                <ProfileField icon={CreditCard} label="Sum insured" value={ins?.sum_insured} />
                <DocumentRow
                  icon={FileText}
                  label="Insurance policy (PDF)"
                  available={!!p2?.has_insurance_policy}
                  onView={() => openDocument(user.id, 'insurance-policy')}
                />
              </div>
            </SectionCard>

            {/* Phase 3 — Clinical Information */}
            <SectionCard
              phase={3}
              title="Clinical Information"
              subtitle="Biological treatment history & diagnosis (health data)."
              icon={Stethoscope}
              status={phaseStatus(currentPhase, 3)}
            >
              <ProfileField
                icon={Syringe}
                label="First biological medicine"
                value={yesNoLabel(p3?.is_first_biologic)}
              />
              <ProfileField
                icon={Pill}
                label="Switching from another biological"
                value={yesNoLabel(p3?.is_switching_biologic)}
              />
              {p3?.is_switching_biologic && (
                <ProfileField
                  icon={Pill}
                  label="Previous biological"
                  value={p3?.previous_biologic_name}
                />
              )}
              <ProfileField
                icon={Activity}
                label="On steroid treatment"
                value={yesNoLabel(p3?.on_steroid_treatment)}
              />
              <ProfileField
                icon={Calendar}
                label="Year of initial diagnosis"
                value={p3?.diagnosis_year ? String(p3.diagnosis_year) : null}
              />
              <ProfileField
                icon={Clock}
                label="Years in treatment with physician"
                value={
                  p3?.treatment_years_with_physician !== null &&
                  p3?.treatment_years_with_physician !== undefined
                    ? String(p3.treatment_years_with_physician)
                    : null
                }
              />
            </SectionCard>
          </>
        )}
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
          color: '#d6ddd9',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        Select a user to view their conversation
      </div>
      <div style={{ fontSize: '13px', color: '#8a958f', maxWidth: '360px', textAlign: 'center' }}>
        Pick a contact on the left to see their full conversation alongside the
        full onboarding profile and uploaded documents.
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
        backgroundColor: '#0c0e0d',
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
          <ProfilePane user={selectedUser} />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
