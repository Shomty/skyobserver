import { CAREER_READING_VERSION } from './careerFingerprint';

/**
 * Prompt / synthesis version. Bump when the Gemini instructions or fact
 * payload change so cached interpretations regenerate.
 */
export const CAREER_SYNTHESIS_PROMPT_VERSION = 1;

/** Cache key for the AI synthesis paragraph — tied to birth fingerprint + engine. */
export function careerSynthesisFingerprint(birthFingerprint: string): string {
  return [
    `syn-v${CAREER_SYNTHESIS_PROMPT_VERSION}`,
    `read-v${CAREER_READING_VERSION}`,
    birthFingerprint,
  ].join('|');
}

export function isValidCareerSynthesisText(text: unknown): text is string {
  return typeof text === 'string' && text.trim().length >= 80 && text.length <= 12_000;
}
