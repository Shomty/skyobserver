import { callGeminiProxy } from '../lib/api-utils';
import { buildChatContents, CHAT_LENGTH_CONFIG, type ChatLength } from '../lib/chatLength';
import { recentChatHistory } from '../lib/chatHistory';
import { buildCurrentSkyBlock, buildStableSystemInstruction, type ChatContextProps } from '../lib/chatUtils';

const CHAT_MODEL = 'gemini-3-flash-preview';

export interface ChatReplyRequest {
  /** Messages before the question being answered. Trimmed to the recent window here. */
  priorMessages: ReadonlyArray<{ role: string; content: string }>;
  question: string;
  ctx: ChatContextProps;
  length: ChatLength;
}

/**
 * One Gemini call for a chat reply, shared by AI Chat and the floating assistant.
 * Prompt layout is cache-first: stable system instruction → verbatim history →
 * a final turn holding the current sky, the question and the length directive.
 */
export function requestChatReply({ priorMessages, question, ctx, length }: ChatReplyRequest): Promise<string> {
  const { maxOutputTokens } = CHAT_LENGTH_CONFIG[length];
  return callGeminiProxy({
    model: CHAT_MODEL,
    contents: buildChatContents(recentChatHistory(priorMessages), question, buildCurrentSkyBlock(ctx), length),
    config: {
      systemInstruction: buildStableSystemInstruction(ctx),
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
    },
  });
}

export interface GoDeeperTarget {
  priorMessages: Array<{ role: string; content: string }>;
  question: string;
}

/**
 * For "Go deeper" on an assistant reply: the user question it answered and the
 * messages before that question — the same inputs as the original request, so
 * the prompt prefix (and its cache entry) is shared. Null when there is none.
 */
export function findGoDeeperTarget<T extends { id: string; role: string; content: string }>(
  messages: readonly T[],
  assistantId: string,
): GoDeeperTarget | null {
  const index = messages.findIndex((m) => m.id === assistantId);
  if (index <= 0 || messages[index].role !== 'assistant') return null;
  for (let j = index - 1; j >= 0; j--) {
    if (messages[j].role === 'user' && messages[j].content.trim()) {
      return { priorMessages: messages.slice(0, j), question: messages[j].content };
    }
  }
  return null;
}
