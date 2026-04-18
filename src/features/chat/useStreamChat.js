import { useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { upsertStreamingMessages, selectStreamingMessages } from './chatSlice'
import { sessionsApi } from '../sessions/sessionsApi'

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`

function makeId() {
  return Math.random().toString(36).slice(2)
}

export function useStreamChat(sessionId, serverMessages = [], sessionToken = null) {
  const dispatch = useDispatch()
  const streaming = useSelector(selectStreamingMessages(sessionId))
  const abortRef = useRef(null)
  const isStreaming = (streaming || serverMessages).some(
    (m) => m.status === 'streaming'
  )

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !sessionId || !sessionToken) return

      const userMsgId = makeId()
      const aiMsgId = makeId()
      const now = new Date().toISOString()

      const base = streaming ?? serverMessages

      // 1. Optimistic: append user message + empty AI bubble
      const withUser = [
        ...base,
        { id: userMsgId, role: 'user', content: text, created_at: now, status: 'sent' },
        { id: aiMsgId, role: 'assistant', content: '', created_at: now, status: 'streaming' },
      ]
      dispatch(upsertStreamingMessages({ sessionId, messages: withUser }))

      // 2. Fetch stream
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(`${BASE_URL}/chatbot/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: text }],
          }),
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let aiContent = ''
        let streamDone = false

        const snapshot = (msgs) => dispatch(upsertStreamingMessages({ sessionId, messages: msgs }))

        while (!streamDone) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          // SSE events are separated by blank lines (\n\n)
          const events = buffer.split('\n\n')
          buffer = events.pop() ?? ''

          for (const event of events) {
            const dataLine = event
              .split('\n')
              .find((l) => l.startsWith('data:'))
            if (!dataLine) continue
            const data = dataLine.slice(5).trim()
            if (!data || data === '[DONE]') {
              streamDone = true
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.done) {
                streamDone = true
                if (parsed.content) aiContent += parsed.content
                break
              }
              aiContent += parsed.content ?? ''
            } catch {
              aiContent += data
            }

            const updated = withUser.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: aiContent }
                : m.id === userMsgId
                ? { ...m, status: 'read' }
                : m
            )
            snapshot(updated)
          }
        }

        // 3. Finalize
        const final = withUser.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: aiContent, status: 'done' }
            : m.id === userMsgId
            ? { ...m, status: 'read' }
            : m
        )
        dispatch(upsertStreamingMessages({ sessionId, messages: final }))

        // Invalidate server cache so next full-load reflects new messages
        dispatch(sessionsApi.util.invalidateTags([{ type: 'Session', id: sessionId }, 'Session']))
      } catch (err) {
        if (err.name === 'AbortError') return

        const errSnapshot = withUser.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: '⚠️ Something went wrong. Please try again.',
                status: 'error',
              }
            : m.id === userMsgId
            ? { ...m, status: 'sent' }
            : m
        )
        dispatch(upsertStreamingMessages({ sessionId, messages: errSnapshot }))
      } finally {
        abortRef.current = null
      }
    },
    [sessionId, sessionToken, streaming, serverMessages, dispatch]
  )

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const messages = streaming ?? serverMessages

  return { messages, sendMessage, isStreaming, cancelStream }
}
