// src/store/chatStore.js
// Global state for conversations and messages using Zustand
// Zustand is a lightweight alternative to Redux — no boilerplate, React-friendly
import { create } from 'zustand';

// Unique numerical ID: timestamp (ms) × 1000 + 3-digit random
// Stays within Number.MAX_SAFE_INTEGER until ~year 2255
const generateId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

// Generate a conversation title from the first user message
const titleFromMessage = (text) => {
  const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length < text.trim().length ? `${words}…` : words;
};

// --- Mock conversation history for development (replace with API calls) ---
const MOCK_HISTORY = [
  {
    id: generateId(),
    title: 'Erasmus MC Installed Base Overview',
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
    messages: [
      { id: generateId(), role: 'user', content: 'Show me the installed base for Erasmus MC', timestamp: Date.now() - 86400000 * 2 },
      {
        id: generateId(), role: 'assistant', timestamp: Date.now() - 86400000 * 2,
        content: `## Erasmus MC — Installed Base Summary\n\n**Account:** Erasmus University Medical Center\n**Location:** Rotterdam, Netherlands\n\n| Metric | Value |\n|---|---|\n| Total Assets | 47 devices |\n| Active Contracts | 12 |\n| Expiring < 90 days | 3 |\n| EOL Flagged Assets | 5 |\n| Coverage Gap | 8% |\n\n### Lifecycle Risk Flags\n- **Philips CT 7500** — EOL in 43 days\n- **IntelliVue MX800** — EOS in 61 days\n- **EPIQ Elite** — Software version outdated (v3.1 → v4.2 available)\n\n> Data confidence: **91%** | Source: CIB + TIB | Freshness: 2h ago`,
        confidence: 0.91,
      },
    ],
  },
  {
    id: generateId(),
    title: 'Expiring contracts this quarter',
    createdAt: Date.now() - 86400000,
    messages: [
      { id: generateId(), role: 'user', content: 'Which contracts are expiring this quarter?', timestamp: Date.now() - 86400000 },
      {
        id: generateId(), role: 'assistant', timestamp: Date.now() - 86400000,
        content: `## Contracts Expiring This Quarter\n\nFound **7 contracts** expiring before **2026-09-30**:\n\n\`\`\`\nAccount           Contract ID   Type         Expiry       Value\nErasmus MC        CT-20224412   Full Service  2026-08-15  €240,000\nAMC Amsterdam     CT-20225891   Parts Only    2026-08-28  €85,000\nUMCG Groningen    CT-20221103   PM + Parts    2026-09-10  €175,000\n...\n\`\`\`\n\n### Renewal Blockers\n- Erasmus MC: Pending PO approval from procurement\n- AMC Amsterdam: Contract dispute — escalated to CSM\n\n> Data confidence: **87%** | Source: CIB (Salesforce) | Freshness: 4h ago`,
        confidence: 0.87,
      },
    ],
  },
];

// --- Store Definition ---
const useChatStore = create((set, get) => ({
  // All conversations (loaded from API / mock)
  conversations: MOCK_HISTORY,

  // Currently active conversation ID
  activeConversationId: null,

  // Whether the AI is currently streaming a response
  isStreaming: false,

  // Streaming buffer — the in-progress assistant message content
  streamingContent: '',

  // --- Selectors ---
  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((c) => c.id === activeConversationId) || null;
  },

  // --- Actions ---

  // Start a fresh conversation
  startNewChat: () => {
    const newConv = {
      id: generateId(),
      title: 'New conversation',
      createdAt: Date.now(),
      messages: [],
    };
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newConv.id,
      streamingContent: '',
      isStreaming: false,
    }));
    return newConv.id;
  },

  // Switch to an existing conversation
  selectConversation: (conversationId) => {
    set({ activeConversationId: conversationId, streamingContent: '', isStreaming: false });
  },

  // Add a user or assistant message to the active conversation
  appendMessage: (message) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id !== state.activeConversationId) return conv;
        const updatedMessages = [...conv.messages, message];
        // Auto-title the conversation from the first user message
        const title =
          conv.title === 'New conversation' && message.role === 'user'
            ? titleFromMessage(message.content)
            : conv.title;
        return { ...conv, messages: updatedMessages, title };
      }),
    }));
  },

  // Called repeatedly as streaming chunks arrive
  appendStreamChunk: (chunk) => {
    set((state) => ({ streamingContent: state.streamingContent + chunk }));
  },

  // Finalize streaming — commit the accumulated content as a real message
  finalizeStream: (confidence) => {
    const { streamingContent, activeConversationId } = get();
    if (!streamingContent || !activeConversationId) return;

    const finalMessage = {
      id: generateId(),
      role: 'assistant',
      content: streamingContent,
      timestamp: Date.now(),
      confidence,
    };

    set((state) => ({
      isStreaming: false,
      streamingContent: '',
      conversations: state.conversations.map((conv) => {
        if (conv.id !== activeConversationId) return conv;
        return { ...conv, messages: [...conv.messages, finalMessage] };
      }),
    }));
  },

  setStreaming: (value) => set({ isStreaming: value }),

  // Store a reaction on an assistant message
  setReaction: (conversationId, messageId, reaction) => {
    set((state) => ({
      conversations: state.conversations.map((conv) => {
        if (conv.id !== conversationId) return conv;
        return {
          ...conv,
          messages: conv.messages.map((msg) =>
            msg.id === messageId ? { ...msg, reaction } : msg
          ),
        };
      }),
    }));
  },
}));

export default useChatStore;
