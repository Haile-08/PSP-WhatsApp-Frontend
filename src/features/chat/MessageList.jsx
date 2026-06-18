import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Lock } from 'lucide-react'
import { selectStreamingMessages } from './chatSlice'
import MessageBubble from './MessageBubble'
import DateSeparator from './DateSeparator'

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

function EncryptionNotice() {
  return (
    <div className="flex justify-center my-3">
      <span
        className="flex items-center"
        style={{
          backgroundColor: 'rgba(163,230,53,0.10)',
          color: '#b3bdb7',
          fontSize: '12.5px',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          padding: '6px 12px',
          borderRadius: '7px',
          border: '1px solid rgba(163,230,53,0.18)',
          gap: '6px',
          maxWidth: '85%',
          textAlign: 'center',
          lineHeight: '17px',
        }}
      >
        <Lock size={12} />
        Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
      </span>
    </div>
  )
}

const CONSENT_PATTERN = /consentimiento.*Revise y firme aqu/is

function isConsentMessage(msg, role) {
  if (role !== 'assistant') return false
  const text = msg.content || msg.text || ''
  return CONSENT_PATTERN.test(text)
}

export default function MessageList({ sessionId, serverMessages = [], onSend, onUpload, isStreaming }) {
  const streamingMsgs = useSelector(selectStreamingMessages(sessionId))
  const messages = streamingMsgs ?? serverMessages
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Buttons are actionable only when the most recent message is the consent
  // prompt itself — anything after it means the user has already responded.
  const lastIdx = messages.length - 1
  const lastMsg = lastIdx >= 0 ? messages[lastIdx] : null
  const lastRole = lastMsg
    ? lastMsg.role || (lastMsg.is_user ? 'user' : 'assistant')
    : null
  const activeConsentIdx = isConsentMessage(lastMsg, lastRole) ? lastIdx : -1

  // Onboarding UI directive (phone-confirm buttons / upload widget) is only
  // interactive on the most recent assistant message and while not streaming.
  const lastDirective =
    lastMsg && lastRole === 'assistant' ? lastMsg.directive || null : null

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
    const isConsent = isConsentMessage(msg, role)
    // Only the last assistant message carries an interactive directive.
    const directive = role === 'assistant' && idx === lastIdx ? lastDirective : null
    rendered.push(
      <MessageBubble
        key={msg.id || `msg-${idx}`}
        message={msg}
        showTail={showTail}
        isOutgoing={isOutgoing}
        showConsentButtons={isConsent}
        consentActive={isConsent && idx === activeConsentIdx && !isStreaming}
        onConsentAccept={() => onSend && onSend('Acepto')}
        onConsentRefuse={() => onSend && onSend('Rechazo')}
        directive={directive}
        directiveActive={!!directive && !isStreaming}
        onDirectiveSend={(payload) => onSend && onSend(payload)}
        onUpload={onUpload}
      />
    )
    prevRole = role
  })

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ padding: '12px 6% 8px' }}
    >
      <EncryptionNotice />
      {rendered}
      <div ref={bottomRef} />
    </div>
  )
}
