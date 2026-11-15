import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';

export const YEAR_READING_VERSION = 1;

export function normalizeYearEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Birth details plus the calendar year and the active Vimshottari lords.
 * A new antardasha or a new year asks for a new reading.
 */
export function yearReportFingerprint(
  birthInstant: BirthInstant,
  place: Pick<PlaceResolution, 'latitude' | 'longitude' | 'timezone'>,
  year: number,
  mahadashaLord: string,
  antardashaLord: string,
): string {
  return [
    `v${YEAR_READING_VERSION}`,
    birthInstant.iso,
    birthInstant.offsetMinutes,
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
    place.timezone,
    year,
    mahadashaLord,
    antardashaLord,
  ].join('|');
}
