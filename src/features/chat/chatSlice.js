import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    activeSessionId: null,
    streamingMessages: {},
    sessionTokens: {},
    toast: null,
  },
  reducers: {
    setActiveSession: (state, action) => {
      state.activeSessionId = action.payload
    },
    upsertStreamingMessages: (state, action) => {
      const { sessionId, messages } = action.payload
      state.streamingMessages[sessionId] = messages
    },
    clearStreamingMessages: (state, action) => {
      delete state.streamingMessages[action.payload]
    },
    setSessionToken: (state, action) => {
      const { sessionId, accessToken } = action.payload
      if (sessionId && accessToken) {
        state.sessionTokens[sessionId] = accessToken
      }
    },
    setSessionTokensBulk: (state, action) => {
      for (const { sessionId, accessToken } of action.payload || []) {
        if (sessionId && accessToken) state.sessionTokens[sessionId] = accessToken
      }
    },
    removeSessionToken: (state, action) => {
      delete state.sessionTokens[action.payload]
    },
    showToast: (state, action) => {
      state.toast = action.payload
    },
    clearToast: (state) => {
      state.toast = null
    },
  },
})

export const {
  setActiveSession,
  upsertStreamingMessages,
  clearStreamingMessages,
  setSessionToken,
  setSessionTokensBulk,
  removeSessionToken,
  showToast,
  clearToast,
} = chatSlice.actions

export default chatSlice.reducer

export const selectActiveSessionId = (state) => state.chat.activeSessionId
export const selectStreamingMessages = (sessionId) => (state) =>
  state.chat.streamingMessages[sessionId] || null
export const selectSessionToken = (sessionId) => (state) =>
  state.chat.sessionTokens[sessionId] || null
export const selectToast = (state) => state.chat.toast
