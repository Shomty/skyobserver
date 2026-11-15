import { toResolution, type OpenMeteoResult } from '../src/features/gift/lib/geocode.ts';
import type { PlaceResolution } from '../src/features/gift/types.ts';
import { TtlCache } from './mcp/ttlCache.ts';

const OPEN_METEO_SEARCH = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODE_TIMEOUT_MS = 8_000;

// Place names resolve to the same coordinates for days; repeat lookups (one per
// tool call for the same person) should not hit Open-Meteo every time.
const placeCache = new TtlCache<PlaceResolution[]>(2_000, 24 * 60 * 60 * 1000);

/**
 * Server-side place search over Open-Meteo (the provider behind /api/geocode).
 * Each result carries an IANA timezone, which is what turns a birth wall-clock
 * time into an absolute instant.
 */
export async function searchPlaces(query: string, limit = 5): Promise<PlaceResolution[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2 || trimmed.length > 200) return [];
  return placeCache.getOrCreate(`${limit}|${trimmed.toLowerCase()}`, () => fetchPlaces(trimmed, limit));
}

async function fetchPlaces(trimmed: string, limit: number): Promise<PlaceResolution[]> {
  const url = `${OPEN_METEO_SEARCH}?name=${encodeURIComponent(trimmed)}&count=${limit}&language=en&format=json`;
  const response = await fetch(url, { signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Geocoder responded ${response.status}`);
  }

  const body = (await response.json()) as { results?: OpenMeteoResult[] };
  const results = Array.isArray(body.results) ? body.results : [];
  return results
    .map(toResolution)
    .filter((place): place is PlaceResolution => place !== null)
    .slice(0, limit);
}
