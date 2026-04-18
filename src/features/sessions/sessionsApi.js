import { createApi } from '@reduxjs/toolkit/query/react'
import baseQuery from '../../lib/baseQuery'

const normalizeSession = (s) =>
  s && typeof s === 'object'
    ? { ...s, id: s.session_id ?? s.id }
    : s

export const sessionsApi = createApi({
  reducerPath: 'sessionsApi',
  baseQuery,
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    getSessions: builder.query({
      query: () => '/auth/sessions',
      transformResponse: (response) =>
        Array.isArray(response) ? response.map(normalizeSession) : [],
      providesTags: ['Session'],
    }),
    createSession: builder.mutation({
      query: () => ({
        url: '/auth/session',
        method: 'POST',
      }),
      transformResponse: normalizeSession,
      invalidatesTags: ['Session'],
    }),
    getSession: builder.query({
      query: (id) => `/auth/session/${id}`,
      transformResponse: normalizeSession,
      providesTags: (_r, _e, id) => [{ type: 'Session', id }],
    }),
    renameSession: builder.mutation({
      query: ({ id, name }) => ({
        url: `/auth/session/${id}/name`,
        method: 'PATCH',
        body: { name },
      }),
      transformResponse: normalizeSession,
      invalidatesTags: ['Session'],
    }),
    deleteSession: builder.mutation({
      query: (id) => ({
        url: `/auth/session/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),
  }),
})

export const {
  useGetSessionsQuery,
  useCreateSessionMutation,
  useGetSessionQuery,
  useRenameSessionMutation,
  useDeleteSessionMutation,
} = sessionsApi
