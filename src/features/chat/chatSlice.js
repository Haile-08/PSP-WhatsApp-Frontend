import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    streamingMessages: {},
    toast: null,
  },
  reducers: {
    upsertStreamingMessages: (state, action) => {
      const { sessionId, messages } = action.payload
      state.streamingMessages[sessionId] = messages
    },
    clearStreamingMessages: (state, action) => {
      delete state.streamingMessages[action.payload]
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
  upsertStreamingMessages,
  clearStreamingMessages,
  showToast,
  clearToast,
} = chatSlice.actions

export default chatSlice.reducer

export const selectStreamingMessages = (sessionId) => (state) =>
  state.chat.streamingMessages[sessionId] || null
export const selectToast = (state) => state.chat.toast
