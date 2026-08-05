import { CAREER_READING_VERSION } from './careerFingerprint';

export const CAREER_PLAIN_SYNTHESIS_PROMPT_VERSION = 1;

export function careerPlainSynthesisFingerprint(birthFingerprint: string): string {
  return [
    `plain-syn-v${CAREER_PLAIN_SYNTHESIS_PROMPT_VERSION}`,
    `read-v${CAREER_READING_VERSION}`,
    birthFingerprint,
  ].join('|');
}

export function isValidCareerPlainSynthesisText(text: unknown): text is string {
  return typeof text === 'string' && text.trim().length >= 80 && text.length <= 12_000;
}
