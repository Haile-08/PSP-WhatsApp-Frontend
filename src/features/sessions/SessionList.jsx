import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetSessionsQuery } from './sessionsApi'
import { selectActiveSessionId } from '../chat/chatSlice'
import SessionRow from './SessionRow'
import SidebarHeader from './SidebarHeader'
import SidebarSearch from './SidebarSearch'

export default function SessionList() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const activeId = useSelector(selectActiveSessionId)
  const { data: sessions = [], isLoading } = useGetSessionsQuery(undefined, {
    pollingInterval: 30000,
  })

  const filtered = sessions
    .filter((s) => (s.name || '').toLowerCase().includes(search.toLowerCase()))
    .filter((s) => {
      if (filter === 'Unread') return (s.unread_count || 0) > 0
      return true
    })

  return (
    <div
      className="flex flex-col h-full"
      style={{ borderRight: '1px solid #d1d7db', backgroundColor: '#ffffff' }}
    >
      <SidebarHeader />
      <SidebarSearch
        value={search}
        onChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Session list — scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
        {isLoading && (
          <div
            style={{ padding: '24px 16px', textAlign: 'center', color: '#667781', fontSize: '14px' }}
          >
            Loading…
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div
            style={{ padding: '40px 24px', textAlign: 'center', color: '#667781', fontSize: '14px', lineHeight: '20px' }}
          >
            {search
              ? 'No chats match your search.'
              : filter !== 'All'
                ? `No ${filter.toLowerCase()} chats.`
                : 'No conversations yet. Start a new chat!'}
          </div>
        )}

        {filtered.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            isActive={session.id === activeId}
          />
        ))}
      </div>
    </div>
  )
}
