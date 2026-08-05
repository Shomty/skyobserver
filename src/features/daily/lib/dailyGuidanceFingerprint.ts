import { DAILY_READING_VERSION } from './dailyFingerprint';

export const DAILY_GUIDANCE_PROMPT_VERSION = 2;

export function dailyGuidanceFingerprint(reportFingerprint: string): string {
  return [`plain-v${DAILY_GUIDANCE_PROMPT_VERSION}`, `read-v${DAILY_READING_VERSION}`, reportFingerprint].join('|');
}

export interface DailyPlainEnergyProfile {
  scoreMeaning: string;
  mind: string;
  body: string;
  soul: string;
}

export interface DailyPlainDayRead {
  date: string;
  label: string;
  read: string;
  energy?: DailyPlainEnergyProfile;
}

export interface DailyPlainGuidancePayload {
  todayRead: string;
  weekDays: DailyPlainDayRead[];
  innerFoundation: string;
  periodGuidance: string;
  practicalMoves: string;
}

export function isValidDailyPlainGuidance(guidance: unknown): guidance is DailyPlainGuidancePayload {
  if (!guidance || typeof guidance !== 'object') return false;
  const g = guidance as Record<string, unknown>;
  const strings = ['todayRead', 'innerFoundation', 'periodGuidance', 'practicalMoves'] as const;
  if (!strings.every((f) => typeof g[f] === 'string' && (g[f] as string).trim().length >= 40)) {
    return false;
  }
  if (!Array.isArray(g.weekDays) || g.weekDays.length < 5) return false;
  return g.weekDays.every((day) => {
    if (!day || typeof day !== 'object') return false;
    const d = day as Record<string, unknown>;
    if (
      typeof d.date !== 'string' ||
      typeof d.label !== 'string' ||
      typeof d.read !== 'string' ||
      (d.read as string).trim().length < 30
    ) {
      return false;
    }
    const energy = d.energy as Record<string, unknown> | undefined;
    if (!energy || typeof energy !== 'object') return false;
    const fields = ['scoreMeaning', 'mind', 'body', 'soul'] as const;
    return fields.every(
      (f) => typeof energy[f] === 'string' && (energy[f] as string).trim().length >= 20,
    );
  });
}
