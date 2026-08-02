import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';

/** Normalise email for stable cache keys (matches gift funnel). */
export function normalizeCareerEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Birth-details fingerprint — invalidates cache when chart inputs change.
 * Omits dasha dates / transit state (career direction is birth-stable).
 */
export function careerBirthFingerprint(
  birthInstant: BirthInstant,
  place: Pick<PlaceResolution, 'latitude' | 'longitude' | 'timezone'>,
): string {
  return [
    birthInstant.iso,
    birthInstant.offsetMinutes,
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
    place.timezone,
  ].join('|');
}
