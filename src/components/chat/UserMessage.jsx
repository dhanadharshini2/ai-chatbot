// src/components/chat/UserMessage.jsx
// Right-aligned user message bubble
import './UserMessage.css';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function UserMessage({ message }) {
  return (
    <div className="user-message-row">
      <div className="user-message-bubble">
        <p className="user-message-text">{message.content}</p>
        <span className="user-message-time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

export default UserMessage;
