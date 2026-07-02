import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  CalendarCheck,
  PhoneCall,
  PackageCheck,
  Building2,
  Sparkles,
  AlertCircle,
  Truck,
  Gauge,
  ClipboardCheck,
  Award,
  BadgeCheck,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
} from 'lucide-react'
import Avatar from '../../components/Avatar'
import DropdownMenu from '../../components/DropdownMenu'
import Sidebar from './Sidebar'
import DashboardView from './DashboardView'
import MessageBubble from '../chat/MessageBubble'
import DateSeparator from '../chat/DateSeparator'
import ChatInput from '../chat/ChatInput'
import { logout } from '../auth/authSlice'
import {
  adminApi,
  USERS_POLL_MS,
  DETAIL_POLL_MS,
  useAdminUsersQuery,
  useAdminUserProfileQuery,
  useAdminUserConversationQuery,
  useSendAdminMessageMutation,
  useConfirmAppointmentMutation,
  useAuthorizeShipmentMutation,
  useRejectShipmentMutation,
  useApproveClaimMutation,
  useRejectClaimMutation,
} from './adminApi'

// Shared hook options for the live queries: pause polling in background tabs
// and refetch the moment the operator refocuses (see setupListeners in
// app/store.js).
const LIVE_QUERY_OPTS = { skipPollingIfUnfocused: true, refetchOnFocus: true }

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
  const [refreshing, setRefreshing] = useState(false)

  // Invalidate every admin tag: RTK Query refetches whichever queries are on
  // screen (patient list, conversation, profile) right away instead of waiting
  // for the next poll tick. The brief spin is visual feedback that the refetch
  // was kicked off.
  const handleRefresh = () => {
    dispatch(
      adminApi.util.invalidateTags([
        'AdminUsers',
        'AdminConversation',
        'AdminProfile',
        'AdminEscalations',
        'AdminStats',
      ]),
    )
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 900)
  }
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
      <div className="flex items-center" style={{ position: 'relative', gap: '4px' }}>
        <button
          className="icon-btn"
          title="Refresh data"
          aria-label="Refresh data"
          onClick={handleRefresh}
        >
          <RefreshCw
            size={20}
            style={refreshing ? { animation: 'spin 0.9s linear' } : undefined}
          />
        </button>
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
        borderLeft: selected ? '3px solid #5FBA82' : '3px solid transparent',
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
                backgroundColor: '#5FBA82',
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

function UserList({ users, selectedUserId, onSelect, collapsed, onToggleCollapse }) {
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

  // Collapsed rail: a slim strip of avatars so the operator can still switch
  // patients without the full list eating horizontal space.
  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center shrink-0"
        style={{ width: '64px', borderRight: '1px solid #262b27', backgroundColor: '#101210' }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{ height: '60px', width: '100%', borderBottom: '1px solid #262b27' }}
        >
          <button
            type="button"
            className="icon-btn"
            title="Expand patient list"
            aria-label="Expand patient list"
            onClick={onToggleCollapse}
          >
            <PanelLeftOpen size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', width: '100%', padding: '8px 0' }}>
          {users.map((u) => {
            const selected = u.id === selectedUserId
            return (
              <button
                key={u.id}
                type="button"
                title={u.username}
                onClick={() => onSelect(u.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '6px 0',
                  border: 'none',
                  borderLeft: selected ? '3px solid #5FBA82' : '3px solid transparent',
                  backgroundColor: selected ? '#1e221e' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Avatar name={u.username} size={36} />
                {u.open_escalations > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '12px',
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      backgroundColor: '#f87171',
                      border: '2px solid #101210',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col shrink-0" style={{ width: '380px', borderRight: '1px solid #262b27', backgroundColor: '#101210' }}>
      <AdminHeader />
      <div className="flex items-center" style={{ padding: '8px 12px', gap: '8px', backgroundColor: '#101210' }}>
        <div
          style={{
            flex: 1,
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
        <button
          type="button"
          className="icon-btn"
          title="Collapse patient list"
          aria-label="Collapse patient list"
          onClick={onToggleCollapse}
        >
          <PanelLeftClose size={20} />
        </button>
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
            backgroundColor: '#5FBA82',
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
  const { data, isFetching } = useAdminUserConversationQuery(user.id, {
    pollingInterval: DETAIL_POLL_MS,
    ...LIVE_QUERY_OPTS,
  })
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

  // Only show the loading screen before the first response arrives — polls
  // set isFetching too, and an empty-but-loaded conversation should keep
  // showing its "No messages" state instead of flashing this every tick.
  if (isFetching && !data) {
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
        showDateStamp
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
  complete: { label: 'Complete', color: '#5FBA82', Icon: CheckCircle2 },
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
        <Icon size={16} color={available ? '#5FBA82' : '#6f7a74'} style={{ flexShrink: 0 }} />
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
            backgroundColor: '#5FBA82',
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
            <Icon size={17} color="#5FBA82" />
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

// Phase 6 — Innovaderm risk band → display meta (drives the verdict banner).
const RISK_BAND_META = {
  low: { label: 'Low risk', color: '#5FBA82' },
  medium: { label: 'Medium risk', color: '#fbbf24' },
  high: { label: 'High risk', color: '#f87171' },
}

const RECOMMENDATION_META = {
  recommend: { label: 'Recommended', color: '#5FBA82' },
  review: { label: 'Needs review', color: '#fbbf24' },
  not_recommended: { label: 'Not recommended', color: '#f87171' },
}

// Colour per scored-factor status in the "why this score" breakdown.
const FACTOR_STATUS_COLOR = {
  ok: '#5FBA82',
  warn: '#fbbf24',
  risk: '#f87171',
  gap: '#9aa5ad',
}

const HOLDER_TYPE_LABELS = {
  persona_fisica: 'Persona física',
  persona_moral: 'Persona moral',
}

const POLICY_KIND_LABELS = {
  individual: 'Individual',
  collective: 'Collective (group)',
}

function contratanteLabel(holderType, policyKind) {
  const h = HOLDER_TYPE_LABELS[holderType]
  const p = POLICY_KIND_LABELS[policyKind]
  if (h && p) return `${h} → ${p}`
  return h || p || null
}

// The three lenses the operator/broker can switch the profile pane between.
// Mirrors the patient's data domains: identity/clinical, the insurance policy,
// and the operational broker/scheduling track.
const PROFILE_VIEWS = [
  { key: 'personal', label: 'Personal', icon: UserIcon },
  { key: 'insurance', label: 'Insurance', icon: ShieldCheck },
  { key: 'other', label: 'Broker', icon: PackageCheck },
]

function ProfileViewToggle({ view, onChange }) {
  return (
    <div
      className="flex"
      style={{
        gap: '4px',
        padding: '4px',
        marginBottom: '14px',
        backgroundColor: '#151815',
        border: '1px solid #262b27',
        borderRadius: '10px',
      }}
    >
      {PROFILE_VIEWS.map((item) => {
        // Destructure in the body so the uppercase ``Icon`` matches the lint
        // varsIgnorePattern (this config has no react/jsx-uses-vars rule).
        const { key, label, icon: Icon } = item
        const active = view === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 8px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 600,
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              backgroundColor: active ? '#5FBA82' : 'transparent',
              color: active ? '#0c0e0d' : '#8a958f',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function ProfilePane({ user }) {
  const { data: profile, isFetching } = useAdminUserProfileQuery(user.id, {
    pollingInterval: DETAIL_POLL_MS,
    ...LIVE_QUERY_OPTS,
  })
  const currentPhase = user.onboarding_phase
  const [view, setView] = useState('personal')

  const p1 = profile?.phase1
  const p2 = profile?.phase2
  const p3 = profile?.phase3
  const p5 = profile?.phase5
  const p6 = profile?.phase6
  const p7 = profile?.phase7
  const p8 = profile?.phase8
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

            <ProfileViewToggle view={view} onChange={setView} />

            {view === 'personal' && (
            <>
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
            </>
            )}

            {view === 'insurance' && (
            <>
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
                      color: p2?.insurance_status === 'pending' ? '#fbbf24' : '#5FBA82',
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
            </>
            )}

            {view === 'personal' && (
            <>
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

            {view === 'other' && (
            <>
            {/* Phase 5 — Scheduling */}
            <SchedulingSection userId={user.id} phase5={p5} currentPhase={currentPhase} />

            {/* Phase 6 — Broker Evaluation & Galderma Shipment */}
            <BrokerShipmentSection
              userId={user.id}
              phase6={p6}
              insurance={ins}
              currentPhase={currentPhase}
            />

            {/* Phase 7 — Claim Follow-up (Day 20) */}
            <ClaimFollowUpSection
              userId={user.id}
              phase7={p7}
              currentPhase={currentPhase}
            />

            {/* Phase 8 — Additional Benefits */}
            <BenefitsSection phase8={p8} currentPhase={currentPhase} />
            </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatSlot(iso, timezone) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined,
    })
  } catch {
    return new Date(iso).toLocaleString()
  }
}

function SchedulingSection({ userId, phase5, currentPhase }) {
  const [confirmAppointment, { isLoading }] = useConfirmAppointmentMutation()
  const status = phase5?.status
  const isConfirmed = status === 'confirmed'
  const canConfirm = phase5?.has_appointment && status === 'booked'

  const handleConfirm = async () => {
    try {
      await confirmAppointment(userId).unwrap()
    } catch {
      // Surfaced by the disabled state resetting; the operator can retry.
    }
  }

  return (
    <SectionCard
      phase={5}
      title="Scheduling"
      subtitle="Welcome-call appointment with the broker."
      icon={CalendarCheck}
      status={phaseStatus(currentPhase, 5)}
    >
      {!phase5?.has_appointment && (
        <ProfileField icon={Clock} label="Appointment" value={null} />
      )}
      {phase5?.has_appointment && (
        <>
          <ProfileField
            icon={Calendar}
            label="Welcome call"
            value={formatSlot(phase5.slot_start, phase5.timezone)}
          />
          <ProfileField
            icon={CheckCircle2}
            label="Status"
            value={isConfirmed ? 'Confirmed' : 'Booked — awaiting call'}
          />
          {phase5.broker_notified_at && (
            <ProfileField
              icon={Mail}
              label="Broker notified"
              value={formatRelativeTime(phase5.broker_notified_at)}
            />
          )}
          {!isConfirmed && (
            <button
              type="button"
              disabled={!canConfirm || isLoading}
              onClick={handleConfirm}
              style={{
                marginTop: '10px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: canConfirm && !isLoading ? 'pointer' : 'not-allowed',
                opacity: canConfirm && !isLoading ? 1 : 0.55,
                backgroundColor: '#5FBA82',
                color: '#0c0e0d',
                border: '1px solid #5FBA82',
              }}
            >
              <PhoneCall size={15} />
              {isLoading ? 'Confirmando…' : 'Confirmar cita'}
            </button>
          )}
        </>
      )}
    </SectionCard>
  )
}

// One row in the "why this score" factor breakdown: a status-coloured dot, the
// factor label + detail, and its contribution to the risk score.
function FactorRow({ factor }) {
  const color = FACTOR_STATUS_COLOR[factor.status] || '#8a958f'
  return (
    <div className="flex items-start" style={{ gap: '9px', padding: '6px 0' }}>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          marginTop: '6px',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="flex items-center justify-between" style={{ gap: '8px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#e9edec',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {factor.label}
          </span>
          {factor.weight !== 0 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color, whiteSpace: 'nowrap' }}>
              {factor.weight > 0 ? `+${factor.weight}` : factor.weight}
            </span>
          )}
        </div>
        {factor.detail && (
          <div
            style={{
              fontSize: '12px',
              color: '#9aa5ad',
              marginTop: '1px',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {factor.detail}
          </div>
        )}
      </div>
    </div>
  )
}

function formatMxn(value) {
  if (value === null || value === undefined) return null
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

// Phase 6 — the Broker Decision card. Surfaces the Innovaderm coverage-risk
// verdict, the policy summary the broker asked for (plan + Básica coverage +
// contratante type), the scored factors, the financial outlook and the AI note,
// then the Authorize / Reject actions. Everything the broker needs to make the
// Galderma-shipment call without leaving the panel.
function BrokerShipmentSection({ userId, phase6, insurance, currentPhase }) {
  const [authorizeShipment, { isLoading: authing }] = useAuthorizeShipmentMutation()
  const [rejectShipment, { isLoading: rejecting }] = useRejectShipmentMutation()
  const busy = authing || rejecting
  const status = phaseStatus(currentPhase, 6)

  const sectionProps = {
    phase: 6,
    title: 'Broker Evaluation',
    subtitle: 'Coverage-risk assessment & Galderma shipment.',
    icon: PackageCheck,
    status,
  }

  if (currentPhase < 6) {
    return (
      <SectionCard {...sectionProps}>
        <div style={{ fontSize: '13px', color: '#5c655f', fontStyle: 'italic', padding: '6px 0' }}>
          Available once the welcome call is confirmed.
        </div>
      </SectionCard>
    )
  }

  if (!phase6?.has_evaluation) {
    return (
      <SectionCard {...sectionProps}>
        <div style={{ fontSize: '13px', color: '#8a958f', padding: '6px 0' }}>
          Scoring coverage with the Innovaderm algorithm…
        </div>
      </SectionCard>
    )
  }

  const band = RISK_BAND_META[phase6.risk_band] || { label: phase6.risk_band, color: '#8a958f' }
  const rec = RECOMMENDATION_META[phase6.recommendation] || {
    label: phase6.recommendation,
    color: '#8a958f',
  }
  const decided = phase6.broker_decision !== 'pending'
  const authorized = phase6.broker_decision === 'authorized'
  const fin = phase6.financial || {}
  const contratante = contratanteLabel(phase6.holder_type, phase6.policy_kind)

  const handleAuthorize = async () => {
    try {
      await authorizeShipment(userId).unwrap()
    } catch {
      // Disabled state resets; the operator can retry.
    }
  }
  const handleReject = async () => {
    try {
      await rejectShipment(userId).unwrap()
    } catch {
      // Disabled state resets; the operator can retry.
    }
  }

  return (
    <SectionCard {...sectionProps}>
      {/* Verdict banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '11px 13px',
          borderRadius: '10px',
          backgroundColor: `${rec.color}14`,
          border: `1px solid ${rec.color}40`,
          marginTop: '4px',
        }}
      >
        <Gauge size={22} color={rec.color} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: rec.color }}>{rec.label}</div>
          <div style={{ fontSize: '12px', color: '#c2ccc6' }}>
            {band.label} · Score {phase6.risk_score}/100
          </div>
        </div>
      </div>

      {/* Policy summary — the broker's asks */}
      <div style={{ marginTop: '6px' }}>
        <ProfileField icon={Building2} label="Contratante" value={contratante} />
        <ProfileField icon={Sparkles} label="Plan" value={insurance?.plan} />
        <ProfileField icon={CreditCard} label="Sum insured" value={insurance?.sum_insured} />
        <ProfileField icon={ShieldCheck} label="Deductible" value={insurance?.deductible} />
        <ProfileField icon={Activity} label="Coinsurance" value={insurance?.coinsurance} />
        <ProfileField icon={UserIcon} label="Client ref" value={phase6.client_ref} />
      </div>

      {/* Why this score */}
      {phase6.factors?.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #262b27' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#c2ccc6',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: '2px',
            }}
          >
            Why this score
          </div>
          {phase6.factors.map((f, i) => (
            <FactorRow key={i} factor={f} />
          ))}
        </div>
      )}

      {/* Financial outlook */}
      {(fin.tope_coaseguro_mxn || fin.deductible_mxn) && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #262b27' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#c2ccc6',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Financial outlook
          </div>
          <ProfileField icon={CreditCard} label="Deductible" value={formatMxn(fin.deductible_mxn)} />
          <ProfileField
            icon={Activity}
            label="Coinsurance"
            value={fin.coinsurance_pct ? `${fin.coinsurance_pct}%` : null}
          />
          <ProfileField
            icon={CreditCard}
            label="Coaseguro cap (tope)"
            value={formatMxn(fin.tope_coaseguro_mxn)}
          />
        </div>
      )}

      {/* AI asesor note */}
      {phase6.note && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 11px',
            backgroundColor: '#101210',
            border: '1px solid #262b27',
            borderRadius: '8px',
          }}
        >
          <div
            className="flex items-center"
            style={{ gap: '6px', fontSize: '11.5px', color: '#8a958f', marginBottom: '5px' }}
          >
            <Sparkles size={13} color="#5FBA82" />
            Asesor note (AI)
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#d6ddd9',
              whiteSpace: 'pre-wrap',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
            }}
          >
            {phase6.note}
          </div>
        </div>
      )}

      {/* Decision actions / result */}
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #262b27' }}>
        {!decided && (
          <div className="flex" style={{ gap: '8px' }}>
            <button
              type="button"
              disabled={busy}
              onClick={handleAuthorize}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.55 : 1,
                backgroundColor: '#5FBA82',
                color: '#0c0e0d',
                border: '1px solid #5FBA82',
              }}
            >
              <PackageCheck size={15} />
              {authing ? 'Authorizing…' : 'Authorize shipment'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.55 : 1,
                backgroundColor: 'transparent',
                color: '#f87171',
                border: '1px solid #f8717155',
              }}
            >
              <AlertCircle size={15} />
              {rejecting ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        )}

        {decided && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 11px',
              borderRadius: '8px',
              backgroundColor: authorized ? '#1f261c' : '#26201f',
              border: `1px solid ${authorized ? '#2c3a26' : '#3a2626'}`,
            }}
          >
            {authorized ? (
              <CheckCircle2 size={17} color="#5FBA82" style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={17} color="#f87171" style={{ flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#e9edec' }}>
                {authorized ? 'Shipment authorized' : 'Policy not supported'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#8a958f' }}>
                {formatRelativeTime(phase6.decided_at)}
                {authorized && phase6.doses_shipped ? ` · ${phase6.doses_shipped} doses` : ''}
              </div>
            </div>
          </div>
        )}

        {authorized && (
          <div style={{ marginTop: '8px' }}>
            <ProfileField
              icon={Truck}
              label="Galderma shipment"
              value={
                phase6.shipment_status === 'confirmed'
                  ? 'Confirmed'
                  : phase6.shipment_status === 'dispatched'
                    ? 'Dispatched'
                    : 'Pending'
              }
            />
            {phase6.galderma_notified_at && (
              <ProfileField
                icon={Mail}
                label="Galderma notified"
                value={formatRelativeTime(phase6.galderma_notified_at)}
              />
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function formatDueDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return new Date(iso).toLocaleDateString()
  }
}

// Phase 7 — the Claim Follow-up (Day 20) card. Once the first doses ship the
// broker follows up on the patient's insurance claim ~20 days later, reviews the
// full enrollment record, and then approves the patient (unlocking Phase 8 — full
// benefits) or marks the claim not approved. The single "Approve patient" button
// is the operator action that tags the patient approved and messages them.
function ClaimFollowUpSection({ userId, phase7, currentPhase }) {
  const [approveClaim, { isLoading: approving }] = useApproveClaimMutation()
  const [rejectClaim, { isLoading: rejecting }] = useRejectClaimMutation()
  const busy = approving || rejecting
  const status = phaseStatus(currentPhase, 7)

  const sectionProps = {
    phase: 7,
    title: 'Claim Follow-up',
    subtitle: 'Day-20 claim review & patient approval.',
    icon: ClipboardCheck,
    status,
  }

  if (currentPhase < 7) {
    return (
      <SectionCard {...sectionProps}>
        <div style={{ fontSize: '13px', color: '#5c655f', fontStyle: 'italic', padding: '6px 0' }}>
          Available once the Galderma shipment is authorized.
        </div>
      </SectionCard>
    )
  }

  if (!phase7?.has_claim_follow_up) {
    return (
      <SectionCard {...sectionProps}>
        <div style={{ fontSize: '13px', color: '#8a958f', padding: '6px 0' }}>
          Preparing the Day-20 claim review…
        </div>
      </SectionCard>
    )
  }

  const decided = phase7.decision !== 'pending'
  const approved = phase7.decision === 'approved'
  const dueLabel = formatDueDate(phase7.follow_up_due_at)

  const handleApprove = async () => {
    try {
      await approveClaim(userId).unwrap()
    } catch {
      // Disabled state resets; the operator can retry.
    }
  }
  const handleReject = async () => {
    try {
      await rejectClaim(userId).unwrap()
    } catch {
      // Disabled state resets; the operator can retry.
    }
  }

  return (
    <SectionCard {...sectionProps}>
      <div style={{ marginTop: '4px' }}>
        <ProfileField icon={Clock} label="Day-20 review due" value={dueLabel || 'Due now'} />
        <ProfileField icon={UserIcon} label="Client ref" value={phase7.client_ref} />
      </div>

      {phase7.note && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 11px',
            backgroundColor: '#101210',
            border: '1px solid #262b27',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#d6ddd9',
            whiteSpace: 'pre-wrap',
          }}
        >
          {phase7.note}
        </div>
      )}

      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #262b27' }}>
        {!decided && (
          <div className="flex" style={{ gap: '8px' }}>
            <button
              type="button"
              disabled={busy}
              onClick={handleApprove}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.55 : 1,
                backgroundColor: '#5FBA82',
                color: '#0c0e0d',
                border: '1px solid #5FBA82',
              }}
            >
              <BadgeCheck size={15} />
              {approving ? 'Approving…' : 'Approve patient'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.55 : 1,
                backgroundColor: 'transparent',
                color: '#f87171',
                border: '1px solid #f8717155',
              }}
            >
              <AlertCircle size={15} />
              {rejecting ? 'Saving…' : 'Not approved'}
            </button>
          </div>
        )}

        {decided && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 11px',
              borderRadius: '8px',
              backgroundColor: approved ? '#1f261c' : '#26201f',
              border: `1px solid ${approved ? '#2c3a26' : '#3a2626'}`,
            }}
          >
            {approved ? (
              <CheckCircle2 size={17} color="#5FBA82" style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={17} color="#f87171" style={{ flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#e9edec' }}>
                {approved ? 'Patient approved' : 'Claim not approved'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#8a958f' }}>
                {formatRelativeTime(phase7.decided_at)}
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

// Phase 8 — Additional Benefits. The terminal phase: a read-only banner that
// surfaces the patient's "approved" tag and the moment their full benefits were
// unlocked (the approval lives in the Phase 7 action above).
function BenefitsSection({ phase8, currentPhase }) {
  const status = phaseStatus(currentPhase, 8)
  const sectionProps = {
    phase: 8,
    title: 'Additional Benefits',
    subtitle: 'Full program benefits unlocked on approval.',
    icon: Award,
    status,
  }

  if (!phase8?.approved) {
    return (
      <SectionCard {...sectionProps}>
        <div style={{ fontSize: '13px', color: '#5c655f', fontStyle: 'italic', padding: '6px 0' }}>
          Unlocked once the patient is approved at the Day-20 review.
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard {...sectionProps}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          marginTop: '4px',
          padding: '9px 11px',
          borderRadius: '8px',
          backgroundColor: '#1f261c',
          border: '1px solid #2c3a26',
        }}
      >
        <Award size={17} color="#5FBA82" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#e9edec' }}>
            Approved · Full benefits unlocked
          </div>
          <div style={{ fontSize: '11.5px', color: '#8a958f' }}>
            {phase8.benefits_unlocked_at
              ? formatRelativeTime(phase8.benefits_unlocked_at)
              : 'Patient notified'}
          </div>
        </div>
      </div>
    </SectionCard>
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

// The Patients workspace: the live contact list (collapsible), the read-only
// conversation feed, and the per-phase onboarding profile pane.
function PatientsView() {
  const { data: users = [] } = useAdminUsersQuery(undefined, {
    pollingInterval: USERS_POLL_MS,
    ...LIVE_QUERY_OPTS,
  })
  // ``null`` means "no manual selection yet" — the render then falls back
  // to the user with the most recent open escalation so the operator's
  // eye lands somewhere useful without us calling setState in an effect.
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [listCollapsed, setListCollapsed] = useState(false)

  const selectedUser = useMemo(() => {
    if (users.length === 0) return null
    if (selectedUserId !== null) {
      return users.find((u) => u.id === selectedUserId) || null
    }
    return users.find((u) => u.open_escalations > 0) || users[0] || null
  }, [users, selectedUserId])

  return (
    <>
      <UserList
        users={users}
        selectedUserId={selectedUser?.id ?? null}
        onSelect={setSelectedUserId}
        collapsed={listCollapsed}
        onToggleCollapse={() => setListCollapsed((v) => !v)}
      />
      {selectedUser ? (
        <>
          <ConversationPane user={selectedUser} />
          <ProfilePane user={selectedUser} />
        </>
      ) : (
        <EmptyState />
      )}
    </>
  )
}

export default function AdminPage() {
  // Which workspace the icon rail has selected: the live Dashboard or the
  // Patients console. Persisted in the URL (``?view=patients``) so a page
  // reload keeps the admin on the same workspace instead of snapping back to
  // the Dashboard. Defaults to the Dashboard when no view is in the URL.
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'patients' ? 'patients' : 'dashboard'
  const setView = (next) =>
    setSearchParams(next === 'patients' ? { view: 'patients' } : {}, {
      replace: true,
    })

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
      <Sidebar active={view} onNavigate={setView} />
      {view === 'dashboard' ? <DashboardView /> : <PatientsView />}
    </div>
  )
}
