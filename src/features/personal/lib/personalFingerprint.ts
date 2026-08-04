import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';

export function normalizePersonalEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Bump when the personal reading engine produces materially different output. */
export const PERSONAL_READING_VERSION = 2;

export function personalBirthFingerprint(
  birthInstant: BirthInstant,
  place: Pick<PlaceResolution, 'latitude' | 'longitude' | 'timezone'>,
): string {
  return [
    `v${PERSONAL_READING_VERSION}`,
    birthInstant.iso,
    birthInstant.offsetMinutes,
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
    place.timezone,
  ].join('|');
}
