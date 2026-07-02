import { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCheck, Check, Clock, Paperclip } from 'lucide-react'

function BubbleTimestamp({ isoString, status, isOutgoing, showDate = false }) {
  let stamp = ''
  if (isoString) {
    const d = new Date(isoString)
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    stamp = showDate
      ? `${d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })} ${time}`
      : time
  }

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
          color: isOutgoing ? 'rgba(233,247,223,0.55)' : '#8a958f',
          fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
          lineHeight: '15px',
          whiteSpace: 'nowrap',
        }}
      >
        {stamp}
      </span>
      {isOutgoing && (
        <>
          {status === 'sending' ? (
            <Clock size={13} color="rgba(233,247,223,0.55)" />
          ) : status === 'streaming' ? (
            <Check size={15} color="rgba(233,247,223,0.55)" />
          ) : status === 'read' ? (
            <CheckCheck size={15} color="#5FBA82" />
          ) : (
            <CheckCheck size={15} color="rgba(233,247,223,0.55)" />
          )}
        </>
      )}
    </span>
  )
}

function ConsentButtons({ active, onAccept, onRefuse }) {
  const baseStyle = {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid #2f352f',
    cursor: active ? 'pointer' : 'not-allowed',
    opacity: active ? 1 : 0.55,
    transition: 'background-color 0.15s ease',
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <button
        type="button"
        disabled={!active}
        onClick={active ? onAccept : undefined}
        style={{
          ...baseStyle,
          backgroundColor: '#5FBA82',
          color: '#0c0e0d',
          borderColor: '#5FBA82',
        }}
      >
        Acepto
      </button>
      <button
        type="button"
        disabled={!active}
        onClick={active ? onRefuse : undefined}
        style={{
          ...baseStyle,
          backgroundColor: 'transparent',
          color: '#c2ccc6',
        }}
      >
        Rechazo
      </button>
    </div>
  )
}

function directiveButtonStyle(active) {
  return {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid #2f352f',
    cursor: active ? 'pointer' : 'not-allowed',
    opacity: active ? 1 : 0.55,
    transition: 'background-color 0.15s ease',
  }
}

function PhoneConfirmButtons({ active, directive, onSend }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <button
        type="button"
        disabled={!active}
        onClick={active ? () => onSend(directive.yes || 'Sí') : undefined}
        style={{
          ...directiveButtonStyle(active),
          backgroundColor: '#5FBA82',
          color: '#0c0e0d',
          borderColor: '#5FBA82',
        }}
      >
        Sí
      </button>
      <button
        type="button"
        disabled={!active}
        onClick={active ? () => onSend(directive.no || 'No') : undefined}
        style={{
          ...directiveButtonStyle(active),
          backgroundColor: 'transparent',
          color: '#c2ccc6',
        }}
      >
        No
      </button>
    </div>
  )
}

function UploadWidget({ active, directive, onUpload, kind = 'prescription', buttonText }) {
  const inputRef = useRef(null)
  const accept = Array.isArray(directive.accepts) ? directive.accepts.join(',') : 'image/*,application/pdf'

  const handleChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file && onUpload) onUpload(file, kind)
    e.target.value = '' // allow re-selecting the same file after a fix
  }

  return (
    <div
      style={{
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        disabled={!active}
        onClick={active ? () => inputRef.current?.click() : undefined}
        style={{
          ...directiveButtonStyle(active),
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: '#5FBA82',
          color: '#0c0e0d',
          borderColor: '#5FBA82',
        }}
      >
        <Paperclip size={16} />
        {buttonText}
      </button>
    </div>
  )
}

function ListSelect({ active, directive, onSend }) {
  // Phase 5 date / time pickers: a vertical list of choices. Tapping sends the
  // option's canonical `value` (ISO date or HH:MM), which the engine validates.
  const options = Array.isArray(directive.options) ? directive.options : []
  if (options.length === 0) return null
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={!active}
          onClick={active ? () => onSend(opt.value) : undefined}
          style={{
            ...directiveButtonStyle(active),
            flex: 'none',
            width: '100%',
            textAlign: 'left',
            backgroundColor: 'transparent',
            color: '#e9edec',
          }}
        >
          {opt.label || opt.value}
        </button>
      ))}
    </div>
  )
}

function DirectiveControls({ directive, active, onSend, onUpload }) {
  if (!directive) return null
  if (directive.type === 'date_select' || directive.type === 'time_select') {
    return <ListSelect active={active} directive={directive} onSend={onSend} />
  }
  if (directive.type === 'phone_confirm' || directive.type === 'yesno_select') {
    // Both render a Sí / No pair driven by directive.yes / directive.no; the
    // Phase 3 clinical yes/no questions reuse the same control as phone-confirm.
    return <PhoneConfirmButtons active={active} directive={directive} onSend={onSend} />
  }
  if (directive.type === 'upload_request') {
    return (
      <UploadWidget
        active={active}
        directive={directive}
        onUpload={onUpload}
        kind="prescription"
        buttonText="Subir receta (imagen o PDF)"
      />
    )
  }
  if (directive.type === 'insurance_upload') {
    return (
      <UploadWidget
        active={active}
        directive={directive}
        onUpload={onUpload}
        kind="insurance"
        buttonText="Subir póliza de seguro (PDF)"
      />
    )
  }
  return null
}

export default function MessageBubble({
  message,
  showTail,
  isOutgoing,
  showConsentButtons = false,
  consentActive = false,
  onConsentAccept,
  onConsentRefuse,
  directive = null,
  directiveActive = false,
  onDirectiveSend,
  onUpload,
  showDateStamp = false,
}) {
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
    boxShadow: '0 1px 1px rgba(0,0,0,0.35)',
    backgroundColor: isOutgoing ? '#14361f' : '#1e221e',
    border: isOutgoing ? '1px solid rgba(163,230,53,0.25)' : '1px solid #262b27',
    fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: '14.2px',
    lineHeight: '19px',
    color: isOutgoing ? '#e9f7df' : '#e9edec',
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
              showDate={showDateStamp}
            />
          </span>
        ) : (
          <div className="bubble-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {showConsentButtons && (
              <ConsentButtons
                active={consentActive}
                onAccept={onConsentAccept}
                onRefuse={onConsentRefuse}
              />
            )}
            <DirectiveControls
              directive={directive}
              active={directiveActive}
              onSend={onDirectiveSend}
              onUpload={onUpload}
            />
            <BubbleTimestamp
              isoString={message.created_at || message.timestamp}
              status={message.status}
              isOutgoing={isOutgoing}
              showDate={showDateStamp}
            />
          </div>
        )}
      </div>
    </div>
  )
}
