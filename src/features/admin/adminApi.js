import { createApi } from '@reduxjs/toolkit/query/react'
import baseQuery from '../../lib/baseQuery'

// Polling cadence for the contact list and the per-user feeds. The admin
// console is meant to feel live: when the agent calls log_escalation,
// the badge should light up without the operator refreshing.
const USERS_POLL_MS = 5000
const DETAIL_POLL_MS = 4000

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['AdminUsers', 'AdminConversation', 'AdminEscalations'],
  endpoints: (builder) => ({
    adminUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['AdminUsers'],
      pollingInterval: USERS_POLL_MS,
    }),
    adminUserConversation: builder.query({
      query: (userId) => `/admin/users/${userId}/conversation`,
      providesTags: (_r, _e, userId) => [{ type: 'AdminConversation', id: userId }],
      pollingInterval: DETAIL_POLL_MS,
    }),
    adminUserEscalations: builder.query({
      query: (userId) => `/admin/users/${userId}/escalations`,
      providesTags: (_r, _e, userId) => [{ type: 'AdminEscalations', id: userId }],
      pollingInterval: DETAIL_POLL_MS,
    }),
    resolveEscalation: builder.mutation({
      query: (escalationId) => ({
        url: `/admin/escalations/${escalationId}/resolve`,
        method: 'POST',
      }),
      // Resolving sends the patient back into the onboarding greeting
      // stage, which changes the contact list subtitle and clears the
      // open-escalation badge — refresh both.
      invalidatesTags: ['AdminUsers', 'AdminEscalations'],
    }),
  }),
})

export const {
  useAdminUsersQuery,
  useAdminUserConversationQuery,
  useAdminUserEscalationsQuery,
  useResolveEscalationMutation,
} = adminApi
