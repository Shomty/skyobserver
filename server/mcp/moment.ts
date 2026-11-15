import { z } from 'zod';
import { resolveBirthInstant, zoneOffsetMinutes, type BirthInstant } from '../../src/features/gift/lib/birthInstant.ts';
import type { PlaceResolution } from '../../src/features/gift/types.ts';
import { fetchTimezoneForCoords } from '../ephemeris.ts';
import { searchPlaces } from '../geocode.ts';
import { ToolInputError } from './toolResult.ts';

/**
 * A local wall-clock moment at a place — a birth, or any moment to cast a
 * chart for. Location is either a free-text place (geocoded) or coordinates.
 */
export const momentShape = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Local date, YYYY-MM-DD'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).describe('Local 24-hour time, HH:mm'),
  place: z.string().min(2).max(200).optional()
    .describe('City/town, e.g. "Belgrade, Serbia". Used when latitude/longitude are not given.'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().min(1).max(64).optional()
    .describe('IANA zone, e.g. "Europe/Belgrade". Looked up from the location when omitted.'),
};

const momentSchema = z.object(momentShape);
export type MomentInput = z.infer<typeof momentSchema>;

export interface ResolvedMoment {
  place: PlaceResolution;
  instant: BirthInstant;
}

function isValidZone(zone: string): boolean {
  return zoneOffsetMinutes(new Date(), zone) !== null;
}

export async function resolvePlace(input: Omit<MomentInput, 'date' | 'time'>): Promise<PlaceResolution> {
  const hasCoords = typeof input.latitude === 'number' && typeof input.longitude === 'number';

  if (hasCoords) {
    const timezone = input.timezone ?? await fetchTimezoneForCoords(input.latitude!, input.longitude!);
    if (!timezone) {
      throw new ToolInputError('Could not determine the timezone for these coordinates; pass `timezone`.');
    }
    if (!isValidZone(timezone)) throw new ToolInputError(`Unknown timezone "${timezone}".`);
    return {
      label: input.place ?? `${input.latitude!.toFixed(3)}, ${input.longitude!.toFixed(3)}`,
      latitude: input.latitude!,
      longitude: input.longitude!,
      timezone,
    };
  }

  if (!input.place) {
    throw new ToolInputError('Provide either `place` or both `latitude` and `longitude`.');
  }

  let best: PlaceResolution | undefined;
  try {
    [best] = await searchPlaces(input.place, 1);
  } catch {
    throw new ToolInputError('Place lookup is temporarily unavailable; pass `latitude`, `longitude` and `timezone` instead.');
  }
  if (!best) throw new ToolInputError(`No location found for "${input.place}". Try "City, Country".`);
  if (input.timezone && !isValidZone(input.timezone)) {
    throw new ToolInputError(`Unknown timezone "${input.timezone}".`);
  }
  return input.timezone ? { ...best, timezone: input.timezone } : best;
}

export async function resolveMoment(input: MomentInput): Promise<ResolvedMoment> {
  const place = await resolvePlace(input);
  const instant = resolveBirthInstant(input.date, input.time, place.timezone);
  if (!instant) throw new ToolInputError('Invalid date or time.');
  return { place, instant };
}
