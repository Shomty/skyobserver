import { callGeminiProxy } from '../../../lib/api-utils';
import type { CareerReading } from './careerReading';
import type { CareerSnapshot } from '../types';
import { buildCareerPlainSynthesisPrompt } from './careerPlainSynthesisPrompt';
import { isValidCareerPlainSynthesisText } from './careerPlainSynthesisFingerprint';

/** Single Gemini call — plain-English career synthesis. */
export async function generateCareerPlainSynthesisText(
  reading: CareerReading,
  snapshot: Pick<CareerSnapshot, 'tenthHouse' | 'tenthLord' | 'timing' | 'fields'>,
  fullName?: string,
): Promise<string> {
  const prompt = buildCareerPlainSynthesisPrompt(reading, snapshot, fullName);

  const text = await callGeminiProxy({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.65,
      maxOutputTokens: 3072,
    },
  });

  const trimmed = text.trim();
  if (!isValidCareerPlainSynthesisText(trimmed)) {
    throw new Error('Plain career synthesis response was empty or too short');
  }
  return trimmed;
}
