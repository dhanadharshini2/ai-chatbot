// src/components/chat/MessageList.jsx
// Scrollable message thread. Handles auto-scroll and streaming bubble.
import { useEffect, useRef } from 'react';
import useChatStore from '../../store/chatStore';
import UserMessage from './UserMessage';
import AgentMessage from './AgentMessage';
import './MessageList.css';

function MessageList() {
  const getActiveConversation = useChatStore((s) => s.getActiveConversation);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);

  const conv = getActiveConversation();
  const messages = conv?.messages || [];

  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new message arrives or streaming content grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="message-list message-list--empty">
        <p>Start the conversation below…</p>
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef}>
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserMessage key={msg.id} message={msg} />
        ) : (
          <AgentMessage key={msg.id} message={msg} conversationId={conv.id} />
        )
      )}

      {/* Streaming in-progress bubble */}
      {isStreaming && (
        <AgentMessage
          key="streaming"
          message={{ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() }}
          conversationId={conv?.id}
          isStreaming
        />
      )}

      {/* Invisible anchor to scroll to */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
