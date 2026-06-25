import { useState, useRef, useEffect, useCallback } from 'react'
import { Smile, Plus, Mic, Send, StopCircle } from 'lucide-react'

export default function ChatInput({ onSend, isStreaming, onCancel }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  // Auto-grow textarea, max 5 rows
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const lineHeight = 22
    const maxHeight = lineHeight * 5 + 18
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px'
  }, [text])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (text.trim() && !isStreaming) {
        onSend(text)
        setText('')
      }
    }
  }, [text, isStreaming, onSend])

  const handleSend = () => {
    if (text.trim() && !isStreaming) {
      onSend(text)
      setText('')
    }
  }

  const hasText = text.trim().length > 0

  return (
    <div
      className="shrink-0"
      style={{
        backgroundColor: '#151815',
        borderTop: '1px solid #262b27',
        padding: '5px 16px 7px',
      }}
    >
      <div className="flex items-end" style={{ gap: '8px' }}>
        {/* Emoji */}
        <button
          className="icon-btn shrink-0"
          title="Emoji"
          style={{ marginBottom: '2px' }}
        >
          <Smile size={24} />
        </button>

        {/* Attach (plus icon, modern WhatsApp) */}
        <button
          className="icon-btn shrink-0"
          title="Attach"
          style={{ marginBottom: '2px' }}
        >
          <Plus size={24} />
        </button>

        {/* Textarea wrapper */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#1e221e',
            border: '1px solid #262b27',
            borderRadius: '8px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'flex-end',
            minHeight: '42px',
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            disabled={false}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              backgroundColor: 'transparent',
              fontSize: '15px',
              lineHeight: '22px',
              color: '#e9edec',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              maxHeight: `${22 * 5 + 18}px`,
              overflowY: 'auto',
              padding: 0,
            }}
          />
        </div>

        {/* Send / Mic / Cancel button */}
        {isStreaming ? (
          <button
            className="shrink-0 flex items-center justify-center rounded-full"
            onClick={onCancel}
            title="Stop generating"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f15c6d',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '1px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d94a59')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f15c6d')}
          >
            <StopCircle size={20} />
          </button>
        ) : hasText ? (
          <button
            onClick={handleSend}
            className="shrink-0 flex items-center justify-center rounded-full"
            title="Send"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#5FBA82',
              color: '#0c0e0d',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '1px',
              boxShadow: '0 0 12px rgba(163,230,53,0.35)',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b6f04a')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5FBA82')}
          >
            <Send size={18} style={{ transform: 'translateX(-1px)' }} />
          </button>
        ) : (
          <button
            className="icon-btn shrink-0"
            title="Voice message"
            style={{ marginBottom: '2px' }}
          >
            <Mic size={24} />
          </button>
        )}
      </div>
    </div>
  )
}
