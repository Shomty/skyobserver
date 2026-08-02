/**
 * Gulika / Maandi (upagrahas) for the career reading.
 *
 * These points carry the karmic-delay layer of the reading (Step 1.4 and Step 3.5
 * of the career reading rules). They depend on sunrise and sunset, which do not
 * exist for every birth — inside the polar circles the Sun can stay up or down
 * for weeks. When the vedic day cannot be resolved we return the positions
 * untouched so every downstream karmic check yields nothing. An absent karmic
 * reading is correct; an invented one is not.
 *
 * `getRiseSetInfo` in vedic-utils falls back to a synthetic 06:00 sunrise in that
 * situation, which would fabricate a Gulika sign, so this module does its own
 * strict rise/set resolution instead.
 */

import { Body, Observer, SearchRiseSet } from 'astronomy-engine';
import { debugWarn } from '../../../lib/debug';
import {
  calculateKaalVelas,
  injectKaalVelaPoints,
  type PlanetPosition,
} from '../../../vedic-utils';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export interface VedicDayBounds {
  sunrise: Date;
  sunset: Date;
  isDayBirth: boolean;
  daytimeDurationMinutes: number;
  /** Weekday at the birth place (0 = Sunday), taken at sunrise — the vedic day start. */
  dayOfWeek: number;
}

/** Weekday at the birth place rather than at the machine running this code. */
function weekdayAtPlace(instant: Date, offsetMinutes: number): number {
  return new Date(instant.getTime() + offsetMinutes * MINUTE_MS).getUTCDay();
}

/**
 * Sunrise and sunset bounding the vedic day that contains `instant`.
 * Returns `null` when either cannot be found — no synthetic fallbacks.
 */
export function resolveVedicDayBounds(
  instant: Date,
  latitude: number,
  longitude: number,
  offsetMinutes: number,
): VedicDayBounds | null {
  const observer = new Observer(latitude, longitude, 0);

  // First sunrise in the 24h before the birth: the vedic day starts there.
  const sunrise = SearchRiseSet(Body.Sun, observer, 1, new Date(instant.getTime() - DAY_MS), 2)?.date;
  if (!sunrise || sunrise > instant) return null;

  const sunset = SearchRiseSet(Body.Sun, observer, -1, sunrise, 1)?.date;
  if (!sunset || sunset <= sunrise) return null;

  const daytimeDurationMinutes = (sunset.getTime() - sunrise.getTime()) / MINUTE_MS;
  if (daytimeDurationMinutes <= 0) return null;

  return {
    sunrise,
    sunset,
    isDayBirth: instant >= sunrise && instant <= sunset,
    daytimeDurationMinutes,
    dayOfWeek: weekdayAtPlace(sunrise, offsetMinutes),
  };
}

/**
 * Return `positions` with Gulika and Maandi appended, or unchanged when the
 * upagrahas cannot be resolved for this birth.
 */
export function withCareerKaalVelas(
  positions: PlanetPosition[],
  instant: Date,
  latitude: number,
  longitude: number,
  offsetMinutes: number,
): PlanetPosition[] {
  try {
    const bounds = resolveVedicDayBounds(instant, latitude, longitude, offsetMinutes);
    if (!bounds) {
      debugWarn('career', 'Sunrise/sunset unresolved — skipping Gulika/Maandi', {
        latitude,
        longitude,
      });
      return positions;
    }

    const kaalVelas = calculateKaalVelas(
      instant,
      bounds.daytimeDurationMinutes,
      bounds.isDayBirth,
      bounds.dayOfWeek,
      latitude,
      longitude,
      bounds.sunrise,
      bounds.sunset,
    );
    if (!kaalVelas) {
      debugWarn('career', 'calculateKaalVelas returned null — skipping Gulika/Maandi');
      return positions;
    }

    return injectKaalVelaPoints(positions, kaalVelas);
  } catch (e) {
    // A failure here must not cost the visitor their whole reading; the karmic
    // sections simply stay silent.
    debugWarn('career', 'Gulika/Maandi calculation failed — skipping karmic sections', e);
    return positions;
  }
}
