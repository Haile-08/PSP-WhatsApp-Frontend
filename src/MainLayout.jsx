import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMeQuery } from './features/auth/authApi'
import { setUser, selectToken } from './features/auth/authSlice'
import { selectActiveSessionId } from './features/chat/chatSlice'
import SessionList from './features/sessions/SessionList'
import ChatWindow from './features/chat/ChatWindow'
import EmptyState from './features/chat/EmptyState'

export default function MainLayout() {
  const dispatch = useDispatch()
  const token = useSelector(selectToken)
  const activeId = useSelector(selectActiveSessionId)
  const { data: user } = useMeQuery(undefined, { skip: !token })

  useEffect(() => {
    if (user) dispatch(setUser(user))
  }, [user, dispatch])

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: '30%',
          minWidth: '340px',
          maxWidth: '500px',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
        }}
        className="hidden md:flex flex-col"
      >
        <SessionList />
      </div>

      {/* Mobile: show sidebar or chat */}
      <div
        className="flex md:hidden flex-col"
        style={{ flex: 1, height: '100%', overflow: 'hidden' }}
      >
        {activeId ? (
          <ChatWindow sessionId={activeId} />
        ) : (
          <SessionList />
        )}
      </div>

      {/* Chat pane (desktop) */}
      <div
        className="hidden md:flex flex-col flex-1"
        style={{ height: '100%', overflow: 'hidden' }}
      >
        {activeId ? (
          <ChatWindow sessionId={activeId} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}
