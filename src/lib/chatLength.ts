/**
 * Reply length for AI chat. Standard is the reply the chat has always given;
 * In-depth asks for a long structured report with a larger output budget and
 * costs more daily quota (the server derives the cost from maxOutputTokens —
 * see quotaUnitsFor in server/geminiProxy.ts).
 */
export type ChatLength = 'standard' | 'in_depth';

export interface ChatLengthConfig {
  label: string;
  /** Undefined keeps the server default — exactly today's behaviour. */
  maxOutputTokens?: number;
  /** Appended to the latest user turn only, so the cached prefix is shared across lengths. */
  directive: string;
  /** Daily AI messages this reply uses; mirrors the server's charge for display. */
  quotaUnits: number;
}

export const CHAT_LENGTH_CONFIG: Readonly<Record<ChatLength, ChatLengthConfig>> = {
  standard: {
    label: 'Standard',
    directive: '',
    quotaUnits: 1,
  },
  in_depth: {
    label: 'In-depth',
    maxOutputTokens: 16384,
    quotaUnits: 2,
    directive: `RESPONSE LENGTH: IN-DEPTH REPORT.
The user explicitly asked for a long, in-depth report. Write 2,000–3,000 words — substantially longer and deeper than a normal chat answer. Use these markdown sections, adapted to the question:
## Overview
## Key Placements & Yogas
## Dasha & Transit Timing (dated relative to the reference date)
## Practical Guidance
## Summary
Each section needs several developed paragraphs (Summary may be short). Ground every claim in specific placements, houses, nakshatras, dignities, aspects and degrees from the provided data, and explain the reasoning behind each conclusion. Go deeper rather than wider; do not pad or repeat yourself.`,
  },
};

export function isChatLength(value: unknown): value is ChatLength {
  return value === 'standard' || value === 'in_depth';
}

const GO_DEEPER_QUOTE_MAX = 160;

/** Transcript line for a "Go deeper" request, quoting the question it expands. */
export function goDeeperLabel(question: string): string {
  const oneLine = question.replace(/\s+/g, ' ').trim();
  const quoted = oneLine.length > GO_DEEPER_QUOTE_MAX ? `${oneLine.slice(0, GO_DEEPER_QUOTE_MAX - 1)}…` : oneLine;
  return `Go deeper: "${quoted}"`;
}

export interface ChatTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Builds Gemini `contents` for a chat request. History is sent verbatim so the
 * prefix stays identical between requests (cache-friendly); everything that
 * varies per request — the current sky and the length directive — goes only
 * into the final user turn.
 */
export function buildChatContents(
  history: ReadonlyArray<{ role: string; content: string }>,
  question: string,
  currentSky: string,
  length: ChatLength,
): ChatTurn[] {
  const { directive } = CHAT_LENGTH_CONFIG[length];
  const finalText = [
    `<current_sky>\n${currentSky}\n</current_sky>`,
    `<question>\n${question}\n</question>`,
    directive,
  ].filter(Boolean).join('\n\n');

  return [
    ...history.map((m): ChatTurn => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: finalText }] },
  ];
}
