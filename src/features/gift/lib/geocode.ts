import type { PlaceResolution } from '../types';

/**
 * Place lookup over the app's existing Open-Meteo proxy (`server.ts:/api/geocode`),
 * the same endpoint Onboarding uses. Open-Meteo already returns an IANA timezone
 * with each result, so resolving a birth instant needs no extra dependency.
 */

interface OpenMeteoResult {
  name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  country?: string;
  country_code?: string;
  admin1?: string;
}

/** Thrown when the geocoder itself is unreachable, as opposed to finding nothing. */
export class GeocoderUnavailableError extends Error {
  constructor(message = 'Geocoder unavailable') {
    super(message);
    this.name = 'GeocoderUnavailableError';
  }
}

function toLabel(result: OpenMeteoResult): string {
  return [result.name, result.admin1, result.country].filter(Boolean).join(', ');
}

function toResolution(result: OpenMeteoResult): PlaceResolution | null {
  if (
    typeof result.latitude !== 'number' ||
    typeof result.longitude !== 'number' ||
    typeof result.timezone !== 'string' ||
    !result.timezone
  ) {
    // Without coordinates and a zone the result cannot produce a chart, so it is
    // not worth offering as a choice.
    return null;
  }
  return {
    label: toLabel(result),
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
    countryCode: result.country_code,
  };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResolution[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  let res: Response;
  try {
    res = await fetch(`/api/geocode?name=${encodeURIComponent(trimmed)}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new GeocoderUnavailableError();
  }

  if (!res.ok) {
    // 400 means the query was rejected, not that the service is down.
    if (res.status === 400) return [];
    throw new GeocoderUnavailableError(`Geocoder responded ${res.status}`);
  }

  const body = (await res.json()) as { results?: OpenMeteoResult[] };
  const results = Array.isArray(body.results) ? body.results : [];
  return results
    .map(toResolution)
    .filter((place): place is PlaceResolution => place !== null)
    .slice(0, 5);
}
