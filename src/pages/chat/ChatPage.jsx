// src/pages/chat/ChatPage.jsx
// Index page for /chat and /chat/:conversationId routes
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatLayout from '../../components/layout/ChatLayout';
import useChatStore from '../../store/chatStore';

function ChatPage() {
  const { conversationId } = useParams();
  const selectConversation = useChatStore((s) => s.selectConversation);

  // Keep store in sync with the URL — parse string param back to number
  useEffect(() => {
    selectConversation(conversationId ? Number(conversationId) : null);
  }, [conversationId, selectConversation]);

  return <ChatLayout />;
}

export default ChatPage;
