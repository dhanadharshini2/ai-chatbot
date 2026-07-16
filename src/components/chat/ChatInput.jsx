// src/components/chat/ChatInput.jsx
// Text input bar at the bottom of the chat pane.
// Handles: send on Enter (Shift+Enter for newline), suggestion auto-fill,
// streaming lifecycle (start → chunks → finalize), and cancel.
import { useState, useRef, useEffect, useCallback } from 'react';
import useChatStore from '../../store/chatStore';
import { streamChatMessage } from '../../api/chatApi';
import useAccessToken from '../../auth/useAccessToken';
import './ChatInput.css';

function ChatInput() {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef(null);
  const cancelRef = useRef(null); // holds the cancel function from streamChatMessage

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const startNewChat = useChatStore((s) => s.startNewChat);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const appendStreamChunk = useChatStore((s) => s.appendStreamChunk);
  const finalizeStream = useChatStore((s) => s.finalizeStream);
  const setStreaming = useChatStore((s) => s.setStreaming);

  const { getToken } = useAccessToken();

  // Listen for suggestion clicks from the welcome screen
  useEffect(() => {
    const handler = (e) => {
      setInputValue(e.detail);
      textareaRef.current?.focus();
    };
    window.addEventListener('ignite:suggestion', handler);
    return () => window.removeEventListener('ignite:suggestion', handler);
  }, []);

  // Auto-resize textarea height to content (up to a max)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [inputValue]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    setInputValue('');

    // If no active conversation yet, create one first
    let convId = activeConversationId;
    if (!convId) {
      convId = startNewChat();
    }

    // Append the user message immediately (optimistic)
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    appendMessage(userMsg);
    setStreaming(true);

    // Get access token silently (may be null in mock mode)
    let token = null;
    try {
      token = await getToken();
    } catch {
      // No token — mock mode will handle it gracefully
    }

    // Start streaming
    cancelRef.current = streamChatMessage(
      convId,
      text,
      token,
      // onChunk
      (chunk) => appendStreamChunk(chunk),
      // onDone — finalize with a mock confidence score (backend will send real one)
      () => finalizeStream(0.88),
      // onError
      (err) => {
        console.error('Stream error:', err);
        finalizeStream(undefined);
      }
    );
  }, [inputValue, isStreaming, activeConversationId, startNewChat, appendMessage, appendStreamChunk, finalizeStream, setStreaming, getToken]);

  const handleKeyDown = (e) => {
    // Send on Enter; Shift+Enter inserts newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancel = () => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    finalizeStream(undefined);
  };

  const canSend = inputValue.trim().length > 0 && !isStreaming;

  return (
    <div className="chat-input-area">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder="Ask about installed base, contracts, lifecycle risks…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming}
        />

        <div className="chat-input-actions">
          {isStreaming ? (
            <button className="chat-input-btn chat-input-btn--cancel" onClick={handleCancel} title="Stop generating">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <rect x="5" y="5" width="10" height="10" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className={`chat-input-btn ${canSend ? 'chat-input-btn--send' : 'chat-input-btn--disabled'}`}
              onClick={handleSend}
              disabled={!canSend}
              title="Send message (Enter)"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="chat-input-hint">
        Enter to send · Shift+Enter for new line · Powered by Ignite Agents
      </p>
    </div>
  );
}

export default ChatInput;
