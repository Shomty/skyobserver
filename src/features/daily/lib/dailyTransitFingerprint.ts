import { DAILY_READING_VERSION } from './dailyFingerprint';

export const DAILY_TRANSIT_PROMPT_VERSION = 1;

export function dailyTransitGuidanceFingerprint(reportFingerprint: string): string {
  return [
    `transit-v${DAILY_TRANSIT_PROMPT_VERSION}`,
    `read-v${DAILY_READING_VERSION}`,
    reportFingerprint,
  ].join('|');
}

export interface DailyTransitRead {
  id: string;
  meaning: string;
  action: string;
}

export interface DailyTransitGuidancePayload {
  transits: DailyTransitRead[];
}

export function isValidDailyTransitGuidance(guidance: unknown): guidance is DailyTransitGuidancePayload {
  if (!guidance || typeof guidance !== 'object') return false;
  const g = guidance as Record<string, unknown>;
  if (!Array.isArray(g.transits) || g.transits.length === 0) return false;
  return g.transits.every((raw) => {
    if (!raw || typeof raw !== 'object') return false;
    const t = raw as Record<string, unknown>;
    return (
      typeof t.id === 'string' &&
      typeof t.meaning === 'string' &&
      (t.meaning as string).trim().length >= 40 &&
      typeof t.action === 'string' &&
      (t.action as string).trim().length >= 15
    );
  });
}

/** Stable id for matching Gemini output to forecast transit hits. */
export function dailyTransitHitId(date: string, index: number, planet: string, type: string): string {
  return `${date}:${index}:${planet}:${type}`;
}
