import { useConversationQuery } from '../auth/authApi'
import { useStreamChat } from './useStreamChat'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatWindow() {
  const { data: conversation } = useConversationQuery()
  const sessionId = conversation?.session_id || null
  const serverMessages = conversation?.messages || []

  const { messages, sendMessage, isStreaming, cancelStream } = useStreamChat(
    sessionId,
    serverMessages
  )

  return (
    <div className="flex flex-col h-full">
      <ChatHeader session={conversation} />

      <div className="flex-1 overflow-hidden flex flex-col chat-bg">
        <MessageList
          sessionId={sessionId}
          serverMessages={messages}
          onSend={sendMessage}
          isStreaming={isStreaming}
        />
      </div>

      <ChatInput onSend={sendMessage} isStreaming={isStreaming} onCancel={cancelStream} />
    </div>
  )
}
