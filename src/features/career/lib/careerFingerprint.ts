import type { BirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';

/** Normalise email for stable cache keys (matches gift funnel). */
export function normalizeCareerEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Reading-engine version. The whole snapshot — including the rendered reading —
 * is cached under the fingerprint, so a cached report is never recomputed while
 * the birth details stay the same. Bump this whenever the engine produces
 * materially different output, or returning visitors keep the old reading.
 *
 * 2 — Gulika/Maandi karmic layer + nakshatra (Shakti, Tara, Gana) section.
 */
export const CAREER_READING_VERSION = 2;

/**
 * Birth-details fingerprint — invalidates cache when chart inputs or the
 * reading engine change.
 */
export function careerBirthFingerprint(
  birthInstant: BirthInstant,
  place: Pick<PlaceResolution, 'latitude' | 'longitude' | 'timezone'>,
): string {
  return [
    `v${CAREER_READING_VERSION}`,
    birthInstant.iso,
    birthInstant.offsetMinutes,
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
    place.timezone,
  ].join('|');
}
