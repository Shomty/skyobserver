import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';

export function normalizeDailyEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Bump when natal or forecast engines produce materially different output.
 */
export const DAILY_READING_VERSION = 1;

function localDayKey(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Cache key — birth details + local calendar day + current location.
 * Forecast refreshes daily and when the visitor moves.
 */
export function dailyReportFingerprint(
  birthInstant: BirthInstant,
  birthPlace: Pick<PlaceResolution, 'latitude' | 'longitude' | 'timezone'>,
  currentPlace: Pick<PlaceResolution, 'latitude' | 'longitude' | 'timezone'>,
  now: Date,
): string {
  return [
    `v${DAILY_READING_VERSION}`,
    birthInstant.iso,
    birthInstant.offsetMinutes,
    birthPlace.latitude.toFixed(4),
    birthPlace.longitude.toFixed(4),
    birthPlace.timezone,
    localDayKey(now, currentPlace.timezone),
    currentPlace.latitude.toFixed(3),
    currentPlace.longitude.toFixed(3),
    currentPlace.timezone,
  ].join('|');
}
