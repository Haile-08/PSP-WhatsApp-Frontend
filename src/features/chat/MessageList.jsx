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
          backgroundColor: '#fff3c4',
          color: '#54656f',
          fontSize: '12.5px',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          padding: '6px 12px',
          borderRadius: '7px',
          boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
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

export default function MessageList({ sessionId, serverMessages = [], onSend, isStreaming }) {
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
