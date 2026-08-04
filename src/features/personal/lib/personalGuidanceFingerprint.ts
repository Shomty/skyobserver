import { PERSONAL_READING_VERSION } from './personalFingerprint';

export const PERSONAL_GUIDANCE_PROMPT_VERSION = 1;

export function personalGuidanceFingerprint(birthFingerprint: string): string {
  return [
    `guide-v${PERSONAL_GUIDANCE_PROMPT_VERSION}`,
    `read-v${PERSONAL_READING_VERSION}`,
    birthFingerprint,
  ].join('|');
}

export interface PersonalGuidancePayload {
  selfUnderstanding: string;
  copingStrategies: string;
  dailyPractices: string;
  currentChapterGuidance: string;
  whenToSeekSupport: string;
}

export function isValidPersonalGuidance(
  guidance: unknown,
): guidance is PersonalGuidancePayload {
  if (!guidance || typeof guidance !== 'object') return false;
  const g = guidance as Record<string, unknown>;
  const fields = [
    'selfUnderstanding',
    'copingStrategies',
    'dailyPractices',
    'currentChapterGuidance',
    'whenToSeekSupport',
  ] as const;
  return fields.every(
    (f) => typeof g[f] === 'string' && (g[f] as string).trim().length >= 40,
  );
}
