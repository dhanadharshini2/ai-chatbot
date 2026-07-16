# Philips Ignite — IB Intelligence Web Chat (POC)

A React-based conversational AI chat interface for the **Philips Ignite Installed Base Intelligence Platform**. Enables commercial and service engineers to query installed base accounts, contracts, and lifecycle data through a streaming AI agent.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19, Create React App |
| Routing | react-router-dom v7 |
| State Management | Zustand v5 |
| Auth | Microsoft Entra ID via MSAL.js (`@azure/msal-browser`, `@azure/msal-react`) |
| Markdown Rendering | marked v18 + DOMPurify |
| Syntax Highlighting | highlight.js |
| Styling | Plain CSS (component-scoped) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 24
- An Azure App Registration (Entra ID) with a configured redirect URI

### Install & Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/chat` and requires Entra ID sign-in.

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
src/
├── App.js                        # Root — BrowserRouter, MSAL provider, route definitions
├── api/
│   └── chatApi.js                # Streaming API client (SSE / fetch)
├── auth/
│   ├── msalConfig.js             # MSAL instance config & login request scopes
│   ├── RequireAuth.jsx           # Auth guard — renders LoginPage if unauthenticated
│   └── useAccessToken.js        # Hook — acquires Bearer token silently
├── components/
│   ├── chat/
│   │   ├── AgentMessage.jsx/css  # Markdown-rendered AI response bubble
│   │   ├── ChatHeader.jsx/css    # Conversation title bar
│   │   ├── ChatInput.jsx/css     # Message input with send / streaming state
│   │   ├── ChatPane.jsx/css      # Right panel — header + message list + input
│   │   ├── MessageList.jsx/css   # Scrollable message thread + streaming bubble
│   │   ├── UserMessage.jsx/css   # User message bubble
│   │   └── WelcomeScreen         # (inline in ChatPane) — shown when no conversation is active
│   ├── layout/
│   │   └── ChatLayout.jsx/css    # Top-level layout — sidebar + chat pane
│   └── sidebar/
│       └── Sidebar.jsx/css       # Left sidebar — branding, New Chat, conversation history
├── pages/
│   ├── chat/
│   │   └── ChatPage.jsx          # Route index for /chat and /chat/:conversationId
│   └── login/
│       ├── LoginPage.jsx         # Unauthenticated landing page
│       └── LoginPage.css
└── store/
    └── chatStore.js              # Zustand store — conversations, messages, streaming state
```

---

## Client-Side Routes

| Path | Page | Description |
|---|---|---|
| `/` | — | Redirects to `/chat` |
| `/chat` | `ChatPage` | Welcome screen (no active conversation) |
| `/chat/:conversationId` | `ChatPage` | Active conversation by numeric ID |

`ChatPage` reads `conversationId` from `useParams`, converts it to a number, and syncs it to the Zustand store. All child components (`ChatPane`, `MessageList`, etc.) read from the store.

---

## State Management

Zustand store (`src/store/chatStore.js`) holds:

| State | Type | Description |
|---|---|---|
| `conversations` | `Conversation[]` | All conversations (mock history + new chats) |
| `activeConversationId` | `number \| null` | Currently selected conversation |
| `isStreaming` | `boolean` | Whether the AI is currently streaming a response |
| `streamingContent` | `string` | Accumulated in-progress streaming text |

Conversation and message IDs are pure numbers: `Date.now() * 1000 + Math.floor(Math.random() * 1000)` — 16-digit integers within `Number.MAX_SAFE_INTEGER`.

---

## Auth Flow

1. App initializes MSAL (`msalInstance.initialize()`) before rendering.
2. `RequireAuth` checks `useIsAuthenticated()` — renders `LoginPage` if not authenticated.
3. `LoginPage` triggers `loginRedirect` via MSAL.
4. On return, MSAL handles the redirect and sets the authenticated account.
5. `useAccessToken` acquires tokens silently for downstream API calls.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server at [http://localhost:3000](http://localhost:3000) |
| `npm test` | Run tests in interactive watch mode |
| `npm run build` | Production build to `build/` |
