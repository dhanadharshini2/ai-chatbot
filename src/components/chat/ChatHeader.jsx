// src/components/chat/ChatHeader.jsx
// Displays the active conversation title and source/model info
import useChatStore from '../../store/chatStore';
import './ChatHeader.css';

function ChatHeader() {
  const getActiveConversation = useChatStore((s) => s.getActiveConversation);
  const conv = getActiveConversation();

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <h2 className="chat-header-title">
          {conv ? conv.title : 'Ignite IB Intelligence'}
        </h2>
        <span className="chat-header-model">GPT-4o (mock) · Azure OpenAI</span>
      </div>
      <div className="chat-header-right">
        <div className="chat-header-badge">
          <span className="badge-dot" />
          Live
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;
