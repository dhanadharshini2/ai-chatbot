// src/components/sidebar/Sidebar.jsx
// Left sidebar: branding, New Chat button, grouped conversation history
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import useChatStore from '../../store/chatStore';
import './Sidebar.css';

// Group conversations by date for the history list
function groupConversations(conversations) {
  const now = Date.now();
  const ONE_DAY = 86400000;
  const groups = { Today: [], Yesterday: [], 'Previous 7 days': [], Older: [] };

  conversations.forEach((conv) => {
    const diff = now - conv.createdAt;
    if (diff < ONE_DAY) groups['Today'].push(conv);
    else if (diff < ONE_DAY * 2) groups['Yesterday'].push(conv);
    else if (diff < ONE_DAY * 7) groups['Previous 7 days'].push(conv);
    else groups['Older'].push(conv);
  });

  return groups;
}

function Sidebar() {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const startNewChat = useChatStore((s) => s.startNewChat);

  const handleNewChat = () => {
    const id = startNewChat();
    navigate(`/chat/${id}`);
  };

  const user = accounts?.[0];
  const userName = user?.name || user?.username || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const grouped = groupConversations(conversations);

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  };

  return (
    <aside className="sidebar">
      {/* Brand header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#0066A1" />
            <path d="M7 8.5h4c2 0 3.5 1.5 3.5 3.5S13 15.5 11 15.5H9.5V18H7V8.5zm2.5 5h1.5c.8 0 1.5-.7 1.5-1.5S11.8 10.5 11 10.5H9.5v3z" fill="white" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Ignite</span>
          <span className="sidebar-brand-sub">IB Intelligence</span>
        </div>
      </div>

      {/* New Chat button */}
      <button className="new-chat-btn" onClick={handleNewChat}>
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        New Chat
      </button>

      {/* Conversation history */}
      <nav className="sidebar-history">
        {Object.entries(grouped).map(([groupName, convs]) => {
          if (convs.length === 0) return null;
          return (
            <div key={groupName} className="history-group">
              <p className="history-group-label">{groupName}</p>
              <ul className="history-list">
                {convs.map((conv) => (
                  <li key={conv.id}>
                    <button
                      className={`history-item ${conv.id === activeConversationId ? 'history-item--active' : ''}`}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      title={conv.title}
                    >
                      <svg className="history-item-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="history-item-title">{conv.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User profile & logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-email">{user?.username}</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
