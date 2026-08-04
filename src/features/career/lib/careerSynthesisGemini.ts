import { callGeminiProxy } from '../../../lib/api-utils';
import type { CareerReading } from './careerReading';
import type { CareerSnapshot } from '../types';
import { buildCareerSynthesisPrompt } from './careerSynthesisPrompt';
import { isValidCareerSynthesisText } from './careerSynthesisFingerprint';

/** Single Gemini call — premium career synthesis paragraph. */
export async function generateCareerSynthesisText(
  reading: CareerReading,
  snapshot: Pick<CareerSnapshot, 'tenthHouse' | 'tenthLord' | 'timing' | 'fields'>,
  fullName?: string,
): Promise<string> {
  const prompt = buildCareerSynthesisPrompt(reading, snapshot, fullName);

  const text = await callGeminiProxy({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.65,
      maxOutputTokens: 2048,
    },
  });

  const trimmed = text.trim();
  if (!isValidCareerSynthesisText(trimmed)) {
    throw new Error('Career synthesis response was empty or too short');
  }
  return trimmed;
}
