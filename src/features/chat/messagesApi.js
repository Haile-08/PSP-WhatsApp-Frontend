// Streaming is handled by useStreamChat.js via fetch + ReadableStream.
// This file exposes a minimal RTK Query API for any REST-based message ops.
import { createApi } from '@reduxjs/toolkit/query/react'
import baseQuery from '../../lib/baseQuery'

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery,
  endpoints: () => ({}),
})
