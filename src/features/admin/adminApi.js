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
  tagTypes: ['AdminUsers', 'AdminConversation', 'AdminEscalations', 'AdminProfile'],
  endpoints: (builder) => ({
    adminUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['AdminUsers'],
      pollingInterval: USERS_POLL_MS,
    }),
    adminUserProfile: builder.query({
      query: (userId) => `/admin/users/${userId}/profile`,
      providesTags: (_r, _e, userId) => [{ type: 'AdminProfile', id: userId }],
      // The patient keeps filling in onboarding fields over WhatsApp while the
      // operator watches, so refresh the profile on the same live cadence as
      // the conversation feed.
      pollingInterval: DETAIL_POLL_MS,
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
    sendAdminMessage: builder.mutation({
      query: ({ userId, content }) => ({
        url: `/admin/users/${userId}/messages`,
        method: 'POST',
        body: { content },
      }),
      // Refresh the conversation immediately rather than waiting for the
      // next poll, so the operator sees their own message appear right away.
      invalidatesTags: (_r, _e, { userId }) => [{ type: 'AdminConversation', id: userId }],
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
  useAdminUserProfileQuery,
  useAdminUserConversationQuery,
  useAdminUserEscalationsQuery,
  useSendAdminMessageMutation,
  useResolveEscalationMutation,
} = adminApi
