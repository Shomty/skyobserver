import { GeminiType as Type } from '../../../lib/geminiSchema';
import { callGeminiProxy } from '../../../lib/api-utils';
import { hasAstrologyLeakage } from '../../personal/lib/personalPsychLeakage';
import type { DailyPlainEnergyProfile, DailyPlainGuidancePayload } from './dailyGuidanceFingerprint';
import type { DailyPsychSeed } from './dailyPsychProfile';

const ENERGY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scoreMeaning: { type: Type.STRING },
    mind: { type: Type.STRING },
    body: { type: Type.STRING },
    soul: { type: Type.STRING },
  },
  required: ['scoreMeaning', 'mind', 'body', 'soul'],
} as const;

const GUIDANCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    todayRead: { type: Type.STRING },
    weekDays: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          label: { type: Type.STRING },
          read: { type: Type.STRING },
          energy: ENERGY_SCHEMA,
        },
        required: ['date', 'label', 'read', 'energy'],
      },
    },
    innerFoundation: { type: Type.STRING },
    periodGuidance: { type: Type.STRING },
    practicalMoves: { type: Type.STRING },
  },
  required: ['todayRead', 'weekDays', 'innerFoundation', 'periodGuidance', 'practicalMoves'],
} as const;

const MAX_REGENERATIONS = 2;

function buildDailyPlainPrompt(seed: DailyPsychSeed): string {
  return `System/Role Prompt:
You are a grounded, secular psychologist-style coach. You draw on evidence-informed frameworks — CBT, ACT,
attachment theory, and strengths-based coaching. You do NOT use astrology, Vedic terminology, planet names,
house numbers, Sanskrit words, charts, transits, or destiny language. Speak warmly, directly, and practically —
like a thoughtful therapist explaining daily emotional weather.

Task Context:
You receive a plain-language profile of someone's inner baseline and a quantitative 7-day energy pattern
(already translated out of any astrological source). Turn this into a daily energy briefing: what today feels
like, how the week unfolds psychologically, and concrete moves. Do not diagnose. This is coaching, not therapy.

Location context: ${seed.locationLabel}

Today's energy signals:
${seed.todayEnergy}

7-day energy pattern (index 0–100 and tone per day):
${seed.weekPattern}

Day-by-day underlying timing signals (translate into human experience — never repeat jargon verbatim):
${seed.daySignals}

Inner baseline (who they are beneath daily weather):
${seed.innerBaseline}

Current life chapter:
${seed.lifeChapter}

Guidelines:
1. Ground every sentence in the profile above — no generic horoscope filler.
2. weekDays MUST contain exactly 7 entries matching the dates/labels implied in the week pattern, in order.
3. Each weekDays[].date MUST be copied exactly from the week pattern (YYYY-MM-DD). Each weekDays[].label MUST match the corresponding day label.
4. Each weekDays[].read is 2–3 short paragraphs on that day's psychological tone, relationships, and focus — no lists.
5. Each weekDays[].energy MUST include scoreMeaning, mind, body, soul — derived from that day's score and timing signals:
   - scoreMeaning: 1–2 sentences on what the 0–100 index feels like in everyday life (no astrology words).
   - mind: mental/emotional processing — focus, mood, decision-making, social tone.
   - body: physical vitality — sleep, tension, activity capacity, stress in the body.
   - soul: meaning, purpose, inner life, values, spiritual or reflective tone.
6. todayRead expands today's signals into an immediate, actionable read (morning-to-evening feel).
7. innerFoundation summarizes stable traits (not today's weather).
8. periodGuidance addresses the current life chapter in plain decisions/habits language.
9. practicalMoves: 2–3 concrete actions for this week.
10. Never mention planets, signs, houses, nakshatra, tithi, yoga, Sanskrit, charts, transits, or destiny language.

Return JSON with: todayRead, weekDays[{date,label,read,energy:{scoreMeaning,mind,body,soul}}], innerFoundation, periodGuidance, practicalMoves.`;
}

function parseEnergy(raw: unknown): DailyPlainEnergyProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const fields = ['scoreMeaning', 'mind', 'body', 'soul'] as const;
  for (const key of fields) {
    if (typeof e[key] !== 'string' || (e[key] as string).trim().length < 20) return null;
  }
  return {
    scoreMeaning: (e.scoreMeaning as string).trim(),
    mind: (e.mind as string).trim(),
    body: (e.body as string).trim(),
    soul: (e.soul as string).trim(),
  };
}

function parseGuidanceJson(text: string): DailyPlainGuidancePayload | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed.todayRead !== 'string' || parsed.todayRead.trim().length < 40) return null;
    if (!Array.isArray(parsed.weekDays) || parsed.weekDays.length < 5) return null;
    const weekDays = parsed.weekDays.map((raw) => {
      const d = raw as Record<string, unknown>;
      const energy = parseEnergy(d.energy);
      if (!energy) return null;
      return {
        date: String(d.date ?? ''),
        label: String(d.label ?? ''),
        read: String(d.read ?? '').trim(),
        energy,
      };
    });
    if (weekDays.some((d) => !d || d.read.length < 30)) return null;
    const strings = ['innerFoundation', 'periodGuidance', 'practicalMoves'] as const;
    for (const key of strings) {
      if (typeof parsed[key] !== 'string' || (parsed[key] as string).trim().length < 40) return null;
    }
    return {
      todayRead: parsed.todayRead.trim(),
      weekDays: weekDays as NonNullable<(typeof weekDays)[number]>[],
      innerFoundation: (parsed.innerFoundation as string).trim(),
      periodGuidance: (parsed.periodGuidance as string).trim(),
      practicalMoves: (parsed.practicalMoves as string).trim(),
    };
  } catch {
    return null;
  }
}

function guidancePayloadHasLeakage(g: DailyPlainGuidancePayload): boolean {
  const energyText = g.weekDays.flatMap((d) =>
    d.energy ? [d.energy.scoreMeaning, d.energy.mind, d.energy.body, d.energy.soul] : [],
  );
  const flat = [
    g.todayRead,
    g.innerFoundation,
    g.periodGuidance,
    g.practicalMoves,
    ...g.weekDays.map((d) => d.read),
    ...energyText,
  ];
  return flat.some((t) => hasAstrologyLeakage(t));
}

async function callOnce(seed: DailyPsychSeed): Promise<DailyPlainGuidancePayload> {
  const text = await callGeminiProxy({
    model: 'gemini-3-flash-preview',
    contents: buildDailyPlainPrompt(seed),
    config: {
      responseMimeType: 'application/json',
      responseSchema: GUIDANCE_SCHEMA,
    },
  });
  const guidance = parseGuidanceJson(text);
  if (!guidance) {
    throw new Error('Invalid AI response — could not parse daily plain guidance JSON');
  }
  return guidance;
}

export async function generateDailyPlainGuidance(seed: DailyPsychSeed): Promise<DailyPlainGuidancePayload> {
  for (let attempt = 0; attempt <= MAX_REGENERATIONS; attempt++) {
    const guidance = await callOnce(seed);
    if (!guidancePayloadHasLeakage(guidance)) {
      return guidance;
    }
  }
  throw new Error('Daily plain guidance failed — astrological terminology leaked into output');
}
