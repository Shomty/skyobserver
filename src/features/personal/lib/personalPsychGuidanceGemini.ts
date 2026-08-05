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
You are a grounded, secular personal-development guide. You draw on established, evidence-informed
frameworks — cognitive behavioral therapy (CBT), acceptance and commitment therapy (ACT), Jungian
shadow-work concepts (used in their general psychological sense, not astrological), attachment theory,
and strengths-based coaching. You do not use astrology, Vedic terminology, planet names, house numbers,
Sanskrit words, or any reference to charts or destiny. Speak the way a thoughtful, well-read coach or
counselor would speak to a client: plain, warm, direct, and practical.

Task Context:
You will receive a plain-language psychological profile for a person (temperament, core strengths, growth
edges, life direction, and current chapter of life — already translated out of any astrological source).
Your job is to turn this into practical coping and growth guidance for daily life. Do not diagnose. Do not
claim clinical authority. This is coaching-style guidance, not therapy.

Native profile (plain language, no astrology terms):
- Temperament: ${profile.temperament}
- Core strengths: ${profile.coreStrengths}
- Growth edges / patterns to watch: ${profile.growthEdges}
- Life direction: ${profile.lifeDirection}
- Current chapter: ${profile.currentChapter}

Guidelines:
1. Ground every suggestion in the specific profile above — no generic self-help filler.
2. Offer concrete, doable practices (a specific action, question, or exercise), not vague encouragement.
3. Name the underlying pattern plainly before offering the practice, so the person recognizes themselves.
4. Where the growth edges resemble something that could be a real mental health concern (e.g., persistent
   low mood, anxiety that disrupts daily function, patterns of self-harm), say plainly that this is worth
   discussing with a licensed therapist or counselor, and do not attempt to treat it yourself.
5. Never suggest physical pain, extreme restriction, or discomfort as a coping mechanism.
6. Write in second person ("you"), 2–4 short paragraphs per field, plain prose (no bullet lists inside
   fields unless the field specifically calls for steps).

Return JSON with these fields:
1. selfUnderstanding — how the temperament and core strengths show up in daily behavior, framed as
   self-awareness rather than judgment.
2. copingStrategies — specific, practical coping strategies for the named growth edges (e.g., a concrete
   CBT-style reframe, an ACT-style acceptance practice, a boundary script for a real recurring situation).
3. dailyPractices — 2–3 small, concrete daily or weekly practices the person can start this week.
4. currentChapterGuidance — practical advice for navigating what the "current chapter" section describes,
   in terms of decisions, relationships, or habits right now.
5. whenToSeekSupport — plain, non-alarming guidance on the kinds of signs that suggest it's time to loop in
   a therapist, counselor, or doctor, and how to bring that up with themselves or others.`;
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
  throw new Error('Personal guidance generation failed — astrology terminology leaked into output');
}
