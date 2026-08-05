import { Type } from '@google/genai';
import { callGeminiProxy } from '../../../lib/api-utils';
import type { DailyTransitGuidancePayload } from './dailyTransitFingerprint';
import type { DailyTransitSeed } from './dailyTransitSeed';

const GUIDANCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          meaning: { type: Type.STRING },
          action: { type: Type.STRING },
        },
        required: ['id', 'meaning', 'action'],
      },
    },
  },
  required: ['transits'],
} as const;

const MAX_REGENERATIONS = 1;

function buildTransitPrompt(seed: DailyTransitSeed): string {
  const transitLines = seed.transits
    .map(
      (t) =>
        `- id: ${t.id}\n  day: ${t.dayLabel} (${t.date})\n  event: ${t.description}\n  type: ${t.type} · intensity: ${t.intensity}`,
    )
    .join('\n');

  return `System/Role Prompt:
You are a practical Vedic astrologer writing for a daily forecast. Explain each transit in clear, actionable
life terms — what the person may feel, where it shows up (work, relationships, mood, health habits), and what
to do about it today or this week. Use classical Vedic language (planets, signs, aspects, dasha context) but
NEVER give vague advice like "observe", "notice", or "reflect on" without naming concrete situations and moves.

Task Context:
Ascendant: ${seed.ascendant}
Mahadasha: ${seed.mahadasha} · Antardasha: ${seed.antardasha}
Location: ${seed.locationLabel}

For EACH transit below, return practical meaning + action. Copy each id exactly.

Transits:
${transitLines}

Guidelines:
1. meaning: 2–3 sentences — specific psychological and life-area effects tied to this exact transit event.
2. action: 1–2 concrete, doable steps (timing, conversation, task, boundary, ritual — not "stay aware").
3. Match intensity — high transits deserve stronger, more direct guidance.
4. Return one entry per input id — same count, same ids, same order.
5. Do not repeat generic filler across entries.

Return JSON: { transits: [{ id, meaning, action }] }`;
}

function parseTransitJson(text: string, expectedIds: string[]): DailyTransitGuidancePayload | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!Array.isArray(parsed.transits)) return null;
    const transits = parsed.transits.map((raw) => {
      const t = raw as Record<string, unknown>;
      return {
        id: String(t.id ?? ''),
        meaning: String(t.meaning ?? '').trim(),
        action: String(t.action ?? '').trim(),
      };
    });
    if (transits.length < expectedIds.length * 0.8) return null;
    if (transits.some((t) => t.meaning.length < 40 || t.action.length < 15)) return null;
    const idSet = new Set(transits.map((t) => t.id));
    if (expectedIds.filter((id) => idSet.has(id)).length < expectedIds.length * 0.8) return null;
    return { transits };
  } catch {
    return null;
  }
}

function hasVagueAdvice(text: string): boolean {
  return /\b(observe how|simply observe|just notice|watch how this|reflect on how)\b/i.test(text);
}

async function callOnce(seed: DailyTransitSeed): Promise<DailyTransitGuidancePayload> {
  const expectedIds = seed.transits.map((t) => t.id);
  const text = await callGeminiProxy({
    model: 'gemini-3-flash-preview',
    contents: buildTransitPrompt(seed),
    config: {
      responseMimeType: 'application/json',
      responseSchema: GUIDANCE_SCHEMA,
    },
  });
  const guidance = parseTransitJson(text, expectedIds);
  if (!guidance) {
    throw new Error('Invalid AI response — could not parse daily transit guidance JSON');
  }
  return guidance;
}

export async function generateDailyTransitGuidance(
  seed: DailyTransitSeed,
): Promise<DailyTransitGuidancePayload> {
  for (let attempt = 0; attempt <= MAX_REGENERATIONS; attempt++) {
    const guidance = await callOnce(seed);
    const vague = guidance.transits.some((t) => hasVagueAdvice(t.meaning) || hasVagueAdvice(t.action));
    if (!vague) return guidance;
  }
  throw new Error('Daily transit guidance failed — output too vague');
}
