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

/** Raw ingress as returned by the Swiss Ephemeris engine (lowercase keys). */
export interface RawTransitIngress {
  planet: string;
  sign: string;
  fromSign: string;
  date: string | Date;
  isRetrograde: boolean;
  longitude: number;
}

/**
 * Where positions and ingresses come from. The browser default POSTs to the
 * server's /api routes; the Node server swaps in the Swiss Ephemeris engine
 * directly so feature engines (e.g. the daily forecast) run in-process.
 */
export interface PositionsBackend {
  planetPositions(body: { isoDate: string; lat?: number; lon?: number }): Promise<PlanetPosition[]>;
  transitIngresses(body: { startDate: string; endDate: string; planets?: string[] }): Promise<RawTransitIngress[]>;
}

async function postJson<T>(url: string, body: unknown, label: string): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `${label} request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

const httpBackend: PositionsBackend = {
  planetPositions: (body) => postJson<PlanetPosition[]>('/api/planet-positions', body, 'Planet positions'),
  transitIngresses: (body) => postJson<RawTransitIngress[]>('/api/transit-ingresses', body, 'Transit ingresses'),
};

let backend: PositionsBackend = httpBackend;

/** Server-side only: compute in-process instead of calling relative /api URLs. */
export function configurePositionsBackend(next: PositionsBackend): void {
  backend = next;
}

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

  const body = lat !== undefined && lon !== undefined
    ? { isoDate: date.toISOString(), lat, lon }
    : { isoDate: date.toISOString() };

  const promise = backend.planetPositions(body)
    .finally(() => {
      inflight.delete(dedupKey);
    });

  inflight.set(dedupKey, promise);
  return promise;
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

  const body = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ...(planets && planets.length > 0 ? { planets } : {}),
  };

  const promise = backend.transitIngresses(body)
    .then((raw) => {
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
