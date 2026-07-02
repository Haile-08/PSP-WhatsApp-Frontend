import { createApi } from '@reduxjs/toolkit/query/react'
import baseQuery from '../../lib/baseQuery'

// Polling cadence for the contact list and the per-user feeds. The admin
// console is meant to feel live: when the agent calls log_escalation,
// the badge should light up without the operator refreshing.
// NOTE: RTK Query only honours `pollingInterval` as a *hook* option, not an
// endpoint option, so these are exported for the components to pass at the
// call sites (useAdminUsersQuery(undefined, { pollingInterval: ... })).
export const USERS_POLL_MS = 5000
export const DETAIL_POLL_MS = 4000

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['AdminUsers', 'AdminConversation', 'AdminEscalations', 'AdminProfile', 'AdminStats'],
  endpoints: (builder) => ({
    adminUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['AdminUsers'],
    }),
    adminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),
    adminUserProfile: builder.query({
      query: (userId) => `/admin/users/${userId}/profile`,
      providesTags: (_r, _e, userId) => [{ type: 'AdminProfile', id: userId }],
    }),
    adminUserConversation: builder.query({
      query: (userId) => `/admin/users/${userId}/conversation`,
      providesTags: (_r, _e, userId) => [{ type: 'AdminConversation', id: userId }],
    }),
    adminUserEscalations: builder.query({
      query: (userId) => `/admin/users/${userId}/escalations`,
      providesTags: (_r, _e, userId) => [{ type: 'AdminEscalations', id: userId }],
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
    confirmAppointment: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}/appointment/confirm`,
        method: 'POST',
      }),
      // Confirming the welcome call flips the appointment status, advances the
      // patient past Phase 5, and messages them — refresh the profile (status +
      // onboarding phase) and the conversation (the confirmation message).
      invalidatesTags: (_r, _e, userId) => [
        { type: 'AdminProfile', id: userId },
        { type: 'AdminConversation', id: userId },
        'AdminUsers',
      ],
    }),
    authorizeShipment: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}/broker/authorize`,
        method: 'POST',
      }),
      // Authorizing dispatches the Galderma order, advances the patient past
      // Phase 6, and messages them — refresh profile + conversation + list.
      invalidatesTags: (_r, _e, userId) => [
        { type: 'AdminProfile', id: userId },
        { type: 'AdminConversation', id: userId },
        'AdminUsers',
      ],
    }),
    rejectShipment: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}/broker/reject`,
        method: 'POST',
      }),
      // Rejecting parks the patient at "policy not supported" and messages them.
      invalidatesTags: (_r, _e, userId) => [
        { type: 'AdminProfile', id: userId },
        { type: 'AdminConversation', id: userId },
        'AdminUsers',
      ],
    }),
    approveClaim: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}/claim/approve`,
        method: 'POST',
      }),
      // Approving the Day-20 claim tags the patient approved, advances them into
      // Phase 8 (full benefits unlocked), and messages them — refresh profile +
      // conversation + list.
      invalidatesTags: (_r, _e, userId) => [
        { type: 'AdminProfile', id: userId },
        { type: 'AdminConversation', id: userId },
        'AdminUsers',
      ],
    }),
    rejectClaim: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}/claim/reject`,
        method: 'POST',
      }),
      // Marking the claim not approved parks the patient and messages them.
      invalidatesTags: (_r, _e, userId) => [
        { type: 'AdminProfile', id: userId },
        { type: 'AdminConversation', id: userId },
        'AdminUsers',
      ],
    }),
  }),
})

export const {
  useAdminUsersQuery,
  useAdminStatsQuery,
  useAdminUserProfileQuery,
  useAdminUserConversationQuery,
  useAdminUserEscalationsQuery,
  useSendAdminMessageMutation,
  useResolveEscalationMutation,
  useConfirmAppointmentMutation,
  useAuthorizeShipmentMutation,
  useRejectShipmentMutation,
  useApproveClaimMutation,
  useRejectClaimMutation,
} = adminApi
