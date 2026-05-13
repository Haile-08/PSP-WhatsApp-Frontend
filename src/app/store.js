import { configureStore } from '@reduxjs/toolkit'
import { adminApi } from '../features/admin/adminApi'
import { authApi } from '../features/auth/authApi'
import { messagesApi } from '../features/chat/messagesApi'
import authReducer from '../features/auth/authSlice'
import chatReducer from '../features/chat/chatSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    [authApi.reducerPath]: authApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(messagesApi.middleware)
      .concat(adminApi.middleware),
})
