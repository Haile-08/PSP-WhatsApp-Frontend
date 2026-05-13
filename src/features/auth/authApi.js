import { createApi } from '@reduxjs/toolkit/query/react'
import baseQuery from '../../lib/baseQuery'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation({
      // `phone` should be E.164 (e.g. +525512345678). The OAuth2
      // password-grant convention keeps the form key `username`.
      query: ({ phone, password }) => {
        const form = new URLSearchParams()
        form.append('username', phone)
        form.append('password', password)
        return {
          url: '/auth/login',
          method: 'POST',
          body: form,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      },
    }),
    register: builder.mutation({
      // body: { phone, username, password, date_of_birth: 'YYYY-MM-DD' }
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    me: builder.query({
      query: () => '/auth/me',
    }),
    conversation: builder.query({
      query: () => '/auth/conversation',
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
  useConversationQuery,
} = authApi
