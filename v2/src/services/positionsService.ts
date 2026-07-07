import type { PlanetPosition, TransitIngress } from '../vedic-utils';

/**
 * Fetch high-precision sidereal planet positions from the server-side
 * Swiss Ephemeris calculator (openastrology-library / swisseph).
 *
 * Falls back gracefully: on network failure the caller retains its last
 * known positions so the UI never goes blank.
 *
 * In-flight deduplication: if two callers request identical parameters at
 * nearly the same time (e.g. React StrictMode double-firing effects), they
 * share a single outgoing request instead of hammering the server twice.
 */

// Key → in-flight Promise. Keyed by minute-precision timestamp + lat/lon so
// simultaneous transit and birth position fetches don't conflict.
const inflight = new Map<string, Promise<PlanetPosition[]>>();

export async function fetchPlanetPositions(
  date: Date,
  lat?: number,
  lon?: number,
): Promise<PlanetPosition[]> {
  // Round to the nearest minute for the deduplication key — two calls within
  // the same minute with the same coordinates are treated as identical.
  const minuteTs = Math.floor(date.getTime() / 60_000) * 60_000;
  const dedupKey = `${minuteTs}_${lat ?? ''}_${lon ?? ''}`;

  const existing = inflight.get(dedupKey);
  if (existing) return existing;

  const body: Record<string, unknown> = { isoDate: date.toISOString() };
  if (lat !== undefined && lon !== undefined) {
    body.lat = lat;
    body.lon = lon;
  }

  const promise = fetch('/api/planet-positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Planet positions request failed (${response.status})`);
      }
      return response.json() as Promise<PlanetPosition[]>;
    })
    .finally(() => {
      inflight.delete(dedupKey);
    });

  inflight.set(dedupKey, promise);
  return promise;
}

interface RawTransitIngress {
  planet: string;
  sign: string;
  fromSign: string;
  date: string;
  isRetrograde: boolean;
  longitude: number;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ingressInflight = new Map<string, Promise<TransitIngress[]>>();

export async function fetchTransitIngresses(
  startDate: Date,
  endDate: Date,
  planets?: string[],
): Promise<TransitIngress[]> {
  const dedupKey = `${startDate.getTime()}_${endDate.getTime()}_${(planets ?? []).join(',')}`;

  const existing = ingressInflight.get(dedupKey);
  if (existing) return existing;

  const body: Record<string, unknown> = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
  if (planets && planets.length > 0) {
    body.planets = planets;
  }

  const promise = fetch('/api/transit-ingresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Transit ingresses request failed (${response.status})`);
      }
      const raw = await response.json() as RawTransitIngress[];
      return raw.map((ingress): TransitIngress => ({
        planet: capitalize(ingress.planet),
        sign: capitalize(ingress.sign),
        fromSign: capitalize(ingress.fromSign),
        date: new Date(ingress.date),
        isRetrograde: ingress.isRetrograde,
        longitude: ingress.longitude,
      }));
    })
    .finally(() => {
      ingressInflight.delete(dedupKey);
    });

  ingressInflight.set(dedupKey, promise);
  return promise;
}
