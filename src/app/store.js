import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { adminApi } from '../features/admin/adminApi'
import { authApi } from '../features/auth/authApi'
import { messagesApi } from '../features/chat/messagesApi'
import authReducer from '../features/auth/authSlice'
import chatReducer from '../features/chat/chatSlice'
import langReducer from '../features/i18n/langSlice'

const appReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  lang: langReducer,
  [authApi.reducerPath]: authApi.reducer,
  [messagesApi.reducerPath]: messagesApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
})

// On logout we wipe the whole store so RTK Query caches (e.g. the
// previous user's /auth/me role) cannot bleed into the next session and
// briefly route the new user to the wrong page. The chosen language is a
// UI preference, not session data, so it is preserved across the wipe.
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    return appReducer({ lang: state?.lang }, action)
  }
  return appReducer(state, action)
}

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(messagesApi.middleware)
      .concat(adminApi.middleware),
})
