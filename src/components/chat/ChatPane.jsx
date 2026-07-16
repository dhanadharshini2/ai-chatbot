// src/components/chat/ChatPane.jsx
// Right-side panel: header, message list, input bar
import { useNavigate } from 'react-router-dom';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';
import './ChatPane.css';

function ChatPane() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  return (
    <main className="chat-pane">
      <ChatHeader />

      {activeConversationId ? (
        <>
          <MessageList />
          <ChatInput />
        </>
      ) : (
        <WelcomeScreen />
      )}
    </main>
  );
}

// Shown when no conversation is selected
function WelcomeScreen() {
  const navigate = useNavigate();
  const startNewChat = useChatStore((s) => s.startNewChat);

  const SUGGESTIONS = [
    'Show me the installed base for Erasmus MC',
    'Which contracts are expiring this quarter?',
    'List all EOL flagged assets across my accounts',
    'Show coverage gaps for AMC Amsterdam',
  ];

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="rgba(0,102,161,0.12)" />
            <circle cx="32" cy="32" r="24" fill="rgba(0,102,161,0.15)" />
            <path d="M20 22h10c5.5 0 10 4.5 10 10s-4.5 10-10 10h-4v6H20V22zm6 14h4c2.2 0 4-1.8 4-4s-1.8-4-4-4h-4v8z" fill="#0066A1" />
          </svg>
        </div>
        <h2 className="welcome-title">Ignite IB Intelligence</h2>
        <p className="welcome-subtitle">Ask me anything about installed base accounts, contracts, and lifecycle data</p>

        <div className="welcome-suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="welcome-suggestion"
              onClick={() => {
                const id = startNewChat();
                navigate(`/chat/${id}`);
                // Store the suggestion so ChatInput can auto-fill it
                // We use a simple custom event to communicate
                window.dispatchEvent(new CustomEvent('ignite:suggestion', { detail: s }));
              }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatPane;
