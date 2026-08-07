import { GeminiType as Type } from '../../../lib/geminiSchema';
import { callGeminiProxy } from '../../../lib/api-utils';
import type { PersonalGuidancePayload } from './personalGuidanceFingerprint';
import type { PersonalPsychProfile } from './personalPsychProfile';
import { guidanceHasLeakage } from './personalPsychLeakage';

export type PersonalPsychGuidance = PersonalGuidancePayload;

const GUIDANCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    selfUnderstanding: { type: Type.STRING },
    copingStrategies: { type: Type.STRING },
    dailyPractices: { type: Type.STRING },
    currentChapterGuidance: { type: Type.STRING },
    whenToSeekSupport: { type: Type.STRING },
  },
  required: [
    'selfUnderstanding',
    'copingStrategies',
    'dailyPractices',
    'currentChapterGuidance',
    'whenToSeekSupport',
  ],
} as const;

const MAX_REGENERATIONS = 2;

function buildPsychGuidancePrompt(profile: PersonalPsychProfile): string {
  return `System/Role Prompt:
You are a premium personal-development coach. You draw on attachment theory, cognitive behavioral
therapy (CBT), acceptance and commitment therapy (ACT), and strengths-based coaching. Write in warm,
direct, everyday language — as if speaking to a thoughtful client over coffee.

Hard rules for your output:
- Never mention astrology, charts, birth data, zodiac, planets, houses, dashas, or any esoteric system.
- Never mention Jung, Jungian concepts, Vedic, Jyotish, Sanskrit, or that anything was "translated" or
  "derived from" another framework.
- Never use framework labels (Persona, Shadow, individuation, archetype) — describe behavior and feelings plainly.

Task:
Turn the personal profile below into premium coaching guidance with insight AND concrete steps for inner work
(beliefs, emotions, self-talk) and outer work (behavior, relationships, habits, boundaries). Do not diagnose.

Profile:
- Temperament: ${profile.temperament}
- Core strengths: ${profile.coreStrengths}
- Growth edges: ${profile.growthEdges}
- Life direction: ${profile.lifeDirection}
- Current chapter: ${profile.currentChapter}
- Hidden patterns: ${profile.shadowThemes}

Guidelines:
1. Ground every suggestion in the profile — no generic self-help filler.
2. Name the underlying pattern plainly before offering the practice.
3. copingStrategies must include BOTH inner reframes (self-talk, emotional regulation, journaling prompts)
   AND outer actions (boundary scripts, behavioral experiments, conversation starters).
4. dailyPractices: 2–3 small practices for this week — specify when, how long, and what success looks like.
5. currentChapterGuidance: one thing to lean into and one thing to release for this life chapter.
6. Flag serious mental health concerns plainly — suggest a licensed therapist when appropriate.
7. Second person ("you"), 2–4 short paragraphs per field, plain prose.

Return JSON:
1. selfUnderstanding — how outer presentation, emotional patterns, and core drive show up daily.
2. copingStrategies — inner and outer coping for the named growth edges.
3. dailyPractices — 2–3 concrete weekly practices.
4. currentChapterGuidance — navigate the current chapter practically.
5. whenToSeekSupport — signs to loop in a therapist or counselor.`;
}

function isValidGuidanceField(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 40 && value.length <= 4_000;
}

function parseGuidanceJson(text: string): PersonalPsychGuidance | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (
      !isValidGuidanceField(parsed.selfUnderstanding) ||
      !isValidGuidanceField(parsed.copingStrategies) ||
      !isValidGuidanceField(parsed.dailyPractices) ||
      !isValidGuidanceField(parsed.currentChapterGuidance) ||
      !isValidGuidanceField(parsed.whenToSeekSupport)
    ) {
      return null;
    }
    return {
      selfUnderstanding: parsed.selfUnderstanding.trim(),
      copingStrategies: parsed.copingStrategies.trim(),
      dailyPractices: parsed.dailyPractices.trim(),
      currentChapterGuidance: parsed.currentChapterGuidance.trim(),
      whenToSeekSupport: parsed.whenToSeekSupport.trim(),
    };
  } catch {
    return null;
  }
}

async function callGuidanceOnce(profile: PersonalPsychProfile): Promise<PersonalPsychGuidance> {
  const text = await callGeminiProxy({
    model: 'gemini-3-flash-preview',
    contents: buildPsychGuidancePrompt(profile),
    config: {
      responseMimeType: 'application/json',
      responseSchema: GUIDANCE_SCHEMA,
    },
  });

  const guidance = parseGuidanceJson(text);
  if (!guidance) {
    throw new Error('Invalid AI response format — could not parse personal guidance JSON');
  }
  return guidance;
}

export async function generatePersonalPsychGuidance(
  profile: PersonalPsychProfile,
): Promise<PersonalPsychGuidance> {
  for (let attempt = 0; attempt <= MAX_REGENERATIONS; attempt++) {
    const guidance = await callGuidanceOnce(profile);
    if (!guidanceHasLeakage(guidance)) {
      return guidance;
    }
  }
  throw new Error('Personal guidance generation failed — forbidden terminology leaked into output');
}
