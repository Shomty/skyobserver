import type { NatalComparisonResult } from '../../../vedic-utils';
import type { DailyTransitGuidancePayload } from './dailyTransitFingerprint';
import { dailyTransitHitId } from './dailyTransitFingerprint';

export interface ResolvedTransitRead {
  meaning: string;
  action: string | null;
  fromAi: boolean;
}

const VAGUE_PATTERN = /\b(observe how|simply observe|just notice|watch how this)\b/i;

export function resolveTransitRead(
  guidance: DailyTransitGuidancePayload | null | undefined,
  date: string,
  hit: NatalComparisonResult,
  index: number,
): ResolvedTransitRead {
  const id = dailyTransitHitId(date, index, hit.planet, hit.type);
  const ai = guidance?.transits.find((t) => t.id === id);
  if (ai) {
    return { meaning: ai.meaning, action: ai.action, fromAi: true };
  }

  const fallbackAction =
    hit.actionableAdvice && !VAGUE_PATTERN.test(hit.actionableAdvice) ? hit.actionableAdvice : null;

  return {
    meaning: hit.interpretation,
    action: fallbackAction,
    fromAi: false,
  };
}
