import { configureStore } from '@reduxjs/toolkit'
import { authApi } from '../features/auth/authApi'
import { sessionsApi } from '../features/sessions/sessionsApi'
import { messagesApi } from '../features/chat/messagesApi'
import authReducer from '../features/auth/authSlice'
import chatReducer from '../features/chat/chatSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    [authApi.reducerPath]: authApi.reducer,
    [sessionsApi.reducerPath]: sessionsApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(sessionsApi.middleware)
      .concat(messagesApi.middleware),
})
