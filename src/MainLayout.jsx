import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMeQuery } from './features/auth/authApi'
import { setUser, selectToken } from './features/auth/authSlice'
import ChatWindow from './features/chat/ChatWindow'

export default function MainLayout() {
  const dispatch = useDispatch()
  const token = useSelector(selectToken)
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
        backgroundColor: '#0c0e0d',
      }}
    >
      <div className="flex flex-col flex-1" style={{ height: '100%', overflow: 'hidden' }}>
        <ChatWindow />
      </div>
    </div>
  )
}
