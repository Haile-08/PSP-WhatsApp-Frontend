import { createSlice } from '@reduxjs/toolkit'

const token = localStorage.getItem('access_token')

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: token || null,
    user: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.access_token
      localStorage.setItem('access_token', action.payload.access_token)
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.token = null
      state.user = null
      localStorage.removeItem('access_token')
    },
  },
})

export const { setCredentials, setUser, logout } = authSlice.actions
export default authSlice.reducer

export const selectToken = (state) => state.auth.token
export const selectUser = (state) => state.auth.user
