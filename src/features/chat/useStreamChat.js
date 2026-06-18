import { useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  upsertStreamingMessages,
  clearStreamingMessages,
  selectStreamingMessages,
} from './chatSlice'
import { authApi } from '../auth/authApi'

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`

function makeId() {
  return Math.random().toString(36).slice(2)
}

export function useStreamChat(sessionId, serverMessages = []) {
  const dispatch = useDispatch()
  const streaming = useSelector(selectStreamingMessages(sessionId))
  const abortRef = useRef(null)
  const isStreaming = (streaming || serverMessages).some(
    (m) => m.status === 'streaming'
  )

  // Pull the canonical conversation back from the server, then drop the local
  // streaming snapshot so the freshly fetched messages (which carry the
  // onboarding ``directive`` and the final assistant text) become the source
  // of truth. Falls back to keeping the snapshot if the refetch fails.
  const refreshFromServer = useCallback(async () => {
    try {
      await dispatch(
        authApi.endpoints.conversation.initiate(undefined, { forceRefetch: true })
      ).unwrap()
      dispatch(clearStreamingMessages(sessionId))
    } catch {
      /* keep the local snapshot as a fallback */
    }
  }, [dispatch, sessionId])

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !sessionId) return
      const userToken = localStorage.getItem('access_token')
      if (!userToken) return

      const userMsgId = makeId()
      const aiMsgId = makeId()
      const now = new Date().toISOString()

      const base = streaming ?? serverMessages

      const withUser = [
        ...base,
        { id: userMsgId, role: 'user', content: text, created_at: now, status: 'sent' },
        { id: aiMsgId, role: 'assistant', content: '', created_at: now, status: 'streaming' },
      ]
      dispatch(upsertStreamingMessages({ sessionId, messages: withUser }))

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(`${BASE_URL}/chatbot/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
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
          const events = buffer.split('\n\n')
          buffer = events.pop() ?? ''

          for (const event of events) {
            const dataLine = event.split('\n').find((l) => l.startsWith('data:'))
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

        const final = withUser.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: aiContent, status: 'done' }
            : m.id === userMsgId
            ? { ...m, status: 'read' }
            : m
        )
        dispatch(upsertStreamingMessages({ sessionId, messages: final }))

        // Refetch the conversation so persisted history (and any onboarding
        // directive) reflects the new turn, then drop the local snapshot.
        await refreshFromServer()
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
    [sessionId, streaming, serverMessages, dispatch, refreshFromServer]
  )

  // Upload the Phase 1 prescription (image or PDF) to the onboarding endpoint,
  // then refresh from the server so the engine's next prompt (or the "what to
  // fix" message) appears in the thread.
  const uploadPrescription = useCallback(
    async (file) => {
      if (!file || !sessionId) return
      const token = localStorage.getItem('access_token')
      if (!token) return

      const base = streaming ?? serverMessages
      const userMsgId = makeId()
      const now = new Date().toISOString()
      const optimistic = [
        ...base,
        {
          id: userMsgId,
          role: 'user',
          content: 'Receta adjuntada',
          created_at: now,
          status: 'sending',
        },
      ]
      dispatch(upsertStreamingMessages({ sessionId, messages: optimistic }))

      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`${BASE_URL}/onboarding/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        await refreshFromServer()
      } catch {
        const errSnapshot = optimistic.map((m) =>
          m.id === userMsgId
            ? {
                ...m,
                content: '⚠️ No se pudo subir el archivo. Inténtalo de nuevo.',
                status: 'error',
              }
            : m
        )
        dispatch(upsertStreamingMessages({ sessionId, messages: errSnapshot }))
      }
    },
    [sessionId, streaming, serverMessages, dispatch, refreshFromServer]
  )

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const messages = streaming ?? serverMessages

  return { messages, sendMessage, isStreaming, cancelStream, uploadPrescription }
}
