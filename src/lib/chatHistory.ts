/** Turns of prior conversation sent with each chat request. The server accepts at most 60 turns. */
export const MAX_CHAT_HISTORY = 30;

/**
 * The most recent non-empty messages, trimmed so the history still starts with
 * a user turn — keeps prompts bounded however long a session runs.
 */
export function recentChatHistory<T extends { role: string; content: string }>(
  messages: readonly T[],
  max: number = MAX_CHAT_HISTORY,
): T[] {
  const recent = messages.filter((m) => m.content).slice(-max);
  const firstUser = recent.findIndex((m) => m.role === 'user');
  return firstUser <= 0 ? recent : recent.slice(firstUser);
}
