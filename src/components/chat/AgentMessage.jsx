// src/components/chat/AgentMessage.jsx
// Left-aligned agent message bubble — renders markdown, shows confidence badge,
// and upvote/downvote reactions. Uses DOMPurify to prevent XSS from LLM output.
import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import useChatStore from '../../store/chatStore';
import { postReaction } from '../../api/chatApi';
import './AgentMessage.css';

// Configure marked to syntax-highlight code blocks via highlight.js
marked.setOptions({
  highlight: (code, lang) => {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  breaks: true,
  gfm: true,
});

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function confidenceLabel(score) {
  if (score >= 0.85) return { label: 'High', cls: 'confidence--high' };
  if (score >= 0.65) return { label: 'Medium', cls: 'confidence--medium' };
  return { label: 'Low', cls: 'confidence--low' };
}

function AgentMessage({ message, conversationId, isStreaming = false }) {
  const setReaction = useChatStore((s) => s.setReaction);
  const contentRef = useRef(null);

  // Parse markdown → sanitized HTML
  const rawHtml = marked.parse(message.content || '');
  const safeHtml = DOMPurify.sanitize(rawHtml, {
    // Allow highlight.js classes but block scripts/iframes
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li',
      'blockquote', 'h1', 'h2', 'h3', 'h4', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'span', 'a', 'hr',
    ],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
    FORCE_BODY: true,
  });

  // Apply highlight.js to any code blocks that weren't caught by marked
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }, [safeHtml]);

  const handleReaction = async (reaction) => {
    // Toggle off if already selected
    const newReaction = message.reaction === reaction ? null : reaction;
    setReaction(conversationId, message.id, newReaction);
    try {
      await postReaction(conversationId, message.id, newReaction, null);
    } catch {
      // Reaction is best-effort — don't block the user
    }
  };

  const confidence = message.confidence;
  const confInfo = confidence !== undefined ? confidenceLabel(confidence) : null;

  return (
    <div className="agent-message-row">
      {/* Agent avatar */}
      <div className="agent-avatar">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="12" fill="#0066A1" />
          <path d="M7 8.5h4c2 0 3.5 1.5 3.5 3.5S13 15.5 11 15.5H9.5V18H7V8.5zm2.5 5h1.5c.8 0 1.5-.7 1.5-1.5S11.8 10.5 11 10.5H9.5v3z" fill="white" />
        </svg>
      </div>

      <div className="agent-message-content">
        {/* Markdown-rendered response */}
        <div
          ref={contentRef}
          className={`agent-message-bubble ${isStreaming ? 'agent-message-bubble--streaming' : ''}`}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        {/* Cursor blink while streaming */}
        {isStreaming && <span className="streaming-cursor" />}

        {/* Footer: time + confidence badge + reactions */}
        {!isStreaming && (
          <div className="agent-message-footer">
            <span className="agent-message-time">{formatTime(message.timestamp)}</span>

            {confInfo && (
              <span className={`confidence-badge ${confInfo.cls}`}>
                <svg viewBox="0 0 12 12" fill="currentColor">
                  <circle cx="6" cy="6" r="6" fillOpacity="0.2" />
                  <path d="M5 4l1-1 1 1M5 6l1 1 1-1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
                {confInfo.label} confidence · {Math.round(confidence * 100)}%
              </span>
            )}

            <div className="agent-reactions">
              <button
                className={`reaction-btn ${message.reaction === 'upvote' ? 'reaction-btn--active' : ''}`}
                onClick={() => handleReaction('upvote')}
                title="Helpful"
                aria-label="Mark as helpful"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
              </button>
              <button
                className={`reaction-btn ${message.reaction === 'downvote' ? 'reaction-btn--active reaction-btn--negative' : ''}`}
                onClick={() => handleReaction('downvote')}
                title="Not helpful"
                aria-label="Mark as not helpful"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentMessage;
