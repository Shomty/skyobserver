import { callGeminiProxy } from '../../../lib/api-utils';
import type { YearReading } from './yearEngine';
import { buildYearSynthesisPrompt } from './yearSynthesisPrompt';
import { isValidYearSynthesisText } from './yearSynthesisFingerprint';

/** One Gemini call for the year consultation. */
export async function generateYearSynthesisText(reading: YearReading, fullName?: string): Promise<string> {
  const text = await callGeminiProxy({
    model: 'gemini-3-flash-preview',
    contents: buildYearSynthesisPrompt(reading, fullName),
    config: {
      temperature: 0.65,
      maxOutputTokens: 4096,
    },
  });

  const trimmed = text.trim();
  if (!isValidYearSynthesisText(trimmed)) {
    throw new Error('Year horoscope response was empty or too short');
  }
  return trimmed;
}
