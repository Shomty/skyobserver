import { YEAR_READING_VERSION } from './yearFingerprint';

export interface YearAiSynthesis {
  text: string;
  fingerprint: string;
  generatedAt: string;
}

export const YEAR_SYNTHESIS_PROMPT_VERSION = 1;

export function yearSynthesisFingerprint(reportFingerprint: string): string {
  return [`syn-v${YEAR_SYNTHESIS_PROMPT_VERSION}`, `read-v${YEAR_READING_VERSION}`, reportFingerprint].join('|');
}

export function isValidYearSynthesisText(text: unknown): text is string {
  return typeof text === 'string' && text.trim().length >= 400 && text.length <= 16_000;
}
