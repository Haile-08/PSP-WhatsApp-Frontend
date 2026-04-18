import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCheck, Check, Clock } from 'lucide-react'

function BubbleTimestamp({ isoString, status, isOutgoing }) {
  const time = isoString
    ? new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : ''

  return (
    <span
      className="inline-flex items-center"
      style={{
        float: 'right',
        marginLeft: '8px',
        marginTop: '2px',
        marginBottom: '-2px',
        gap: '3px',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          color: '#667781',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          lineHeight: '15px',
          whiteSpace: 'nowrap',
        }}
      >
        {time}
      </span>
      {isOutgoing && (
        <>
          {status === 'sending' ? (
            <Clock size={13} color="#667781" />
          ) : status === 'streaming' ? (
            <Check size={15} color="#667781" />
          ) : status === 'read' ? (
            <CheckCheck size={15} color="#53bdeb" />
          ) : (
            <CheckCheck size={15} color="#667781" />
          )}
        </>
      )}
    </span>
  )
}

export default function MessageBubble({ message, showTail, isOutgoing }) {
  const isStreaming = message.status === 'streaming'
  const content = message.content || message.text || ''
  const isEmptyStreaming = isStreaming && !content

  const bubbleClass = isOutgoing
    ? showTail ? 'bubble-out' : 'bubble-out-notail'
    : showTail ? 'bubble-in' : 'bubble-in-notail'

  const bubbleStyle = {
    maxWidth: '65%',
    minWidth: isEmptyStreaming ? '56px' : '0',
    padding: '6px 9px 8px',
    boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
    backgroundColor: isOutgoing ? '#d9fdd3' : '#ffffff',
    fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: '14.2px',
    lineHeight: '19px',
    color: '#111b21',
    wordBreak: 'break-word',
  }

  return (
    <div
      className="bubble-anim"
      style={{
        display: 'flex',
        justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
        paddingLeft: isOutgoing ? '0' : '8px',
        paddingRight: isOutgoing ? '8px' : '0',
        marginBottom: showTail ? '8px' : '2px',
        marginTop: showTail ? '6px' : '0',
      }}
    >
      <div className={bubbleClass} style={bubbleStyle}>
        {isEmptyStreaming ? (
          <div className="wa-typing" aria-label="Typing">
            <span />
            <span />
            <span />
          </div>
        ) : isOutgoing ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>
            {content}
            <BubbleTimestamp
              isoString={message.created_at || message.timestamp}
              status={message.status}
              isOutgoing={isOutgoing}
            />
          </span>
        ) : (
          <div className="bubble-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            <BubbleTimestamp
              isoString={message.created_at || message.timestamp}
              status={message.status}
              isOutgoing={isOutgoing}
            />
          </div>
        )}
      </div>
    </div>
  )
}
