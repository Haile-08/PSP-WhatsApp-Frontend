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

export default function MessageList({ sessionId, serverMessages = [] }) {
  const streamingMsgs = useSelector(selectStreamingMessages(sessionId))
  const messages = streamingMsgs ?? serverMessages
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
