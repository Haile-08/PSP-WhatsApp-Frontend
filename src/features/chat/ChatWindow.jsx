import { useGetSessionQuery } from '../sessions/sessionsApi'
import { useStreamChat } from './useStreamChat'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatWindow({ sessionId }) {
  const { data: session } = useGetSessionQuery(sessionId, { skip: !sessionId })
  const serverMessages = session?.messages || []
  const sessionToken = session?.token?.access_token || null

  const { messages, sendMessage, isStreaming, cancelStream } = useStreamChat(
    sessionId,
    serverMessages,
    sessionToken
  )

  return (
    <div className="flex flex-col h-full">
      <ChatHeader session={session} />

      {/* Message area with chat background */}
      <div className="flex-1 overflow-hidden flex flex-col chat-bg">
        <MessageList sessionId={sessionId} serverMessages={messages} />
      </div>

      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        onCancel={cancelStream}
      />
    </div>
  )
}
