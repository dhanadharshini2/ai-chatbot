// src/api/chatApi.js
// REST API layer for chat — sends messages and reads SSE streaming responses
// Falls back to a mock streaming simulator when no backend is configured

const API_URL = process.env.REACT_APP_API_URL || '';

// ---------------------------------------------------------------------------
// Mock streaming simulator (used when REACT_APP_API_URL is not configured)
// Generates a realistic Ignite-style response and yields it token by token
// ---------------------------------------------------------------------------
const MOCK_RESPONSES = {
  default: `## Ignite IB Intelligence\n\nI can help you with:\n- **Account search** and installed base details\n- **Contract status** and renewal readiness\n- **Lifecycle risk flags** — EOL and EOS alerts\n- **Coverage gap** analysis and reconciliation\n- **Data confidence** and source transparency\n\nTry asking: *"Show me the installed base for Erasmus MC"* or *"Which contracts expire this quarter?"*`,
  account: `## Account Overview\n\nSearching the **Commercial Installed Base** for matching accounts...\n\n| Account | Location | Assets | Contracts |\n|---|---|---|---|\n| Erasmus MC | Rotterdam, NL | 47 | 12 |\n| AMC Amsterdam | Amsterdam, NL | 31 | 8 |\n| UMCG Groningen | Groningen, NL | 28 | 6 |\n\n> Data confidence: **89%** | Source: CIB (Salesforce) | Freshness: 1h ago`,
  contract: `## Contract Status\n\n### Expiring in < 90 days\n\n\`\`\`\nAccount        Contract ID   Expiry       Status\nErasmus MC     CT-20224412   2026-08-15   ⚠️ At Risk\nAMC Amsterdam  CT-20225891   2026-08-28   🔴 Blocked\nUMCG           CT-20221103   2026-09-10   ✅ On Track\n\`\`\`\n\n**Renewal blockers detected on 2 accounts.** Recommend escalating to CSM.\n\n> Data confidence: **87%** | Source: CIB + SIB | Freshness: 4h ago`,
  eol: `## Lifecycle Risk Report\n\n### EOL / EOS Flagged Assets\n\n- 🔴 **Philips CT 7500** — EOL in **43 days** (2026-08-24)\n- 🟡 **IntelliVue MX800** — EOS in **61 days** (2026-09-11)\n- 🟡 **EPIQ Elite v3.1** — Software outdated (upgrade to v4.2 available)\n- ⚪ **Lumify Tablet Probe** — EOL in **180 days** (2027-01-09)\n\nRecommended action: Initiate upgrade conversations for CT 7500 immediately.\n\n> Data confidence: **93%** | Source: Lifecycle MCP | Freshness: 12h ago`,
  coverage: `## Coverage Gap Analysis\n\n**Reconciliation Status:** 3 gaps found across 2 accounts\n\n| Asset | Serial | Contract | Gap Type |\n|---|---|---|---|\n| CT 7500 | SN-448821 | None | No coverage |\n| MR 5300W | SN-119043 | CT-20224510 | Wrong contract type |\n| IntelliVue | SN-885541 | Expired | Lapsed |\n\n> Data confidence: **85%** | Source: TIB + CIB reconciliation | Freshness: 6h ago`,
};

function getMockResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('account') || q.includes('hospital') || q.includes('installed base') || q.includes('ib')) return MOCK_RESPONSES.account;
  if (q.includes('contract') || q.includes('expir') || q.includes('renewal') || q.includes('quarter')) return MOCK_RESPONSES.contract;
  if (q.includes('eol') || q.includes('eos') || q.includes('lifecycle') || q.includes('end of life') || q.includes('risk')) return MOCK_RESPONSES.eol;
  if (q.includes('coverage') || q.includes('gap') || q.includes('reconcil')) return MOCK_RESPONSES.coverage;
  return MOCK_RESPONSES.default;
}

async function* mockStreamGenerator(query) {
  const fullResponse = getMockResponse(query);
  // Simulate streaming: yield word by word with a small delay
  const words = fullResponse.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    await new Promise((r) => setTimeout(r, 25 + Math.random() * 30));
    yield chunk;
  }
}

// ---------------------------------------------------------------------------
// Real SSE streaming from the REST API backend
// ---------------------------------------------------------------------------
async function* realStreamGenerator(conversationId, userMessage, accessToken) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ conversationId, message: userMessage }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const raw = decoder.decode(value, { stream: true });
    // Parse SSE lines: "data: <content>\n\n"
    const lines = raw.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API — used by ChatInput component
// ---------------------------------------------------------------------------

/**
 * Send a user message and stream back the AI response chunk by chunk.
 *
 * @param {string} conversationId - Active conversation ID
 * @param {string} userMessage    - The user's query text
 * @param {string|null} accessToken - Bearer token (null in mock mode)
 * @param {(chunk: string) => void} onChunk - Called for each streamed token
 * @param {() => void} onDone    - Called when streaming is complete
 * @param {(err: Error) => void} onError - Called on failure
 * @returns {() => void} Abort function to cancel in-flight requests
 */
export function streamChatMessage(conversationId, userMessage, accessToken, onChunk, onDone, onError) {
  let cancelled = false;

  const run = async () => {
    try {
      const useMock = !API_URL || !accessToken;
      const generator = useMock
        ? mockStreamGenerator(userMessage)                                   // dev/demo mode
        : realStreamGenerator(conversationId, userMessage, accessToken);    // production mode

      for await (const chunk of generator) {
        if (cancelled) break;
        onChunk(chunk);
      }

      if (!cancelled) onDone();
    } catch (err) {
      // Backend unreachable (e.g. local API not running yet) — fall back to mock
      if (!cancelled) {
        console.warn('[chatApi] Backend unreachable, falling back to mock response:', err.message);
        try {
          for await (const chunk of mockStreamGenerator(userMessage)) {
            if (cancelled) break;
            onChunk(chunk);
          }
          if (!cancelled) onDone();
        } catch (mockErr) {
          if (!cancelled) onError(mockErr);
        }
      }
    }
  };

  run();

  // Return a cancel function
  return () => { cancelled = true; };
}

// ---------------------------------------------------------------------------
// Conversation history — fetch paginated list of past conversations
// ---------------------------------------------------------------------------
export async function fetchConversations(accessToken) {
  if (!API_URL || !accessToken) {
    // Return empty list in mock mode — store already seeds mock data
    return [];
  }

  const res = await fetch(`${API_URL}/api/conversations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Post a reaction (upvote / downvote) on a message
// ---------------------------------------------------------------------------
export async function postReaction(conversationId, messageId, reaction, accessToken) {
  if (!API_URL || !accessToken) return; // no-op in mock mode

  await fetch(`${API_URL}/api/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ conversationId, messageId, reaction }),
  });
}
