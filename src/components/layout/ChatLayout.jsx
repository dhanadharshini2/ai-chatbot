// src/components/layout/ChatLayout.jsx
// Top-level layout: sidebar (left) + chat pane (right)
import Sidebar from '../sidebar/Sidebar';
import ChatPane from '../chat/ChatPane';
import './ChatLayout.css';

function ChatLayout() {
  return (
    <div className="chat-layout">
      <Sidebar />
      <ChatPane />
    </div>
  );
}

export default ChatLayout;
