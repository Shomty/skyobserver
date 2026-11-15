import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createRequire } from 'module';
// openastrology-library's .mjs build uses `import * as swisseph` which doesn't
// work for a native CJS addon. Load the CJS build explicitly via createRequire.
import type { VedicChartCalculations, Planet, VedicTransitIngress } from 'openastrology-library';
import type { PlanetPosition } from '../src/vedic-utils.ts';
import type { VimshottariDashasResponse } from '../src/services/dashasService.ts';
import { assertIngressRange } from './ingressRange.ts';

const _require = createRequire(import.meta.url);
const { VedicAstrologyCalculator, VedicTransitCalculator } = _require('openastrology-library') as typeof import('openastrology-library');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Swiss Ephemeris calculators (singletons) — shared by the HTTP API and /mcp
// ---------------------------------------------------------------------------

const localEphePath = path.resolve(repoRoot, 'ephe');
const bundledEphePath = path.resolve(repoRoot, 'node_modules/swisseph/ephe');
const EPHE_PATH = process.env.EPHE_PATH
  || (existsSync(localEphePath) ? localEphePath : bundledEphePath);

const vedicCalc = new VedicAstrologyCalculator({
  ayanamsa: 'lahiri',
  houseSystem: 'wholehouse',
  ephePath: EPHE_PATH,
});

const transitCalc = new VedicTransitCalculator({
  ayanamsa: 'lahiri',
  ephePath: EPHE_PATH,
});

export const ALL_VEDIC_PLANETS: Planet[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

// Planet metadata for mapping library output → app PlanetPosition
const PLANET_META: Record<string, { symbol: string; color: string }> = {
  Sun:       { symbol: '☉', color: '#FFD700' },
  Moon:      { symbol: '☽', color: '#F0F8FF' },
  Mars:      { symbol: '♂', color: '#FF4500' },
  Mercury:   { symbol: '☿', color: '#00CED1' },
  Jupiter:   { symbol: '♃', color: '#DAA520' },
  Venus:     { symbol: '♀', color: '#FF69B4' },
  Saturn:    { symbol: '♄', color: '#708090' },
  Rahu:      { symbol: '☊', color: '#8A2BE2' },
  Ketu:      { symbol: '☋', color: '#A9A9A9' },
  Ascendant: { symbol: 'ASC', color: '#10B981' },
};

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Convert library nakshatra key (underscore/lowercase) to app title-case name
function normalizeNakshatra(n: string): string {
  const MAP: Record<string, string> = { moola: 'Mula' };
  if (MAP[n]) return MAP[n];
  return n.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Capitalize first letter of a zodiac sign or planet key
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Map a VedicChartCalculations → app PlanetPosition[] format
function mapChartToPositions(chart: VedicChartCalculations, includeAscendant: boolean): PlanetPosition[] {
  const { ayanamsa } = chart;
  const result: Array<Record<string, unknown>> = [];

  // Add planets in consistent order
  for (const key of ALL_VEDIC_PLANETS) {
    const p = chart.planets[key];
    if (!p) continue;
    const name = capitalize(key);
    const meta = PLANET_META[name];
    const siderealLon = ((p.longitude % 360) + 360) % 360;

    result.push({
      name,
      symbol: meta?.symbol ?? name,
      longitude: (siderealLon + ayanamsa + 360) % 360, // tropical
      siderealLongitude: siderealLon,
      rashi: capitalize(p.sign),
      nakshatra: normalizeNakshatra(p.nakshatra as string),
      pada: p.pada,
      degree: p.degreeDMS.degrees,
      minute: p.degreeDMS.minutes,
      isRetrograde: p.isRetrograde,
      isCombust: p.isCombust,
      color: meta?.color ?? '#FFFFFF',
      dignity: p.dignity ?? undefined,
      house: p.house ?? undefined,
    });
  }

  // Ascendant (only when location was supplied)
  if (includeAscendant) {
    const asc = chart.ascendant;
    const siderealLon = ((asc.longitude % 360) + 360) % 360;
    const nakshatraIdx = Math.floor(siderealLon / (360 / 27));
    const degInNak = siderealLon % (360 / 27);
    const pada = Math.floor(degInNak / (360 / (27 * 4))) + 1;
    // The library's ascendant degree is fractional — split it into degree and minute
    const fracDeg = siderealLon % 30;
    result.unshift({
      name: 'Ascendant',
      symbol: 'ASC',
      longitude: (siderealLon + ayanamsa + 360) % 360,
      siderealLongitude: siderealLon,
      rashi: capitalize(asc.sign),
      nakshatra: NAKSHATRA_NAMES[nakshatraIdx] ?? normalizeNakshatra(asc.nakshatra as string),
      pada,
      degree: Math.floor(fracDeg),
      minute: Math.floor((fracDeg % 1) * 60),
      isRetrograde: false,
      isCombust: false,
      color: '#10B981',
    });
  }

  return result as unknown as PlanetPosition[];
}

function buildBirthInfoFromIso(isoDate: string, lat: number, lon: number, timezone?: string) {
  const d = new Date(isoDate);
  if (timezone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    return {
      name: 'native',
      dateOfBirth: `${get('year')}-${get('month')}-${get('day')}`,
      timeOfBirth: `${get('hour')}:${get('minute')}`,
      latitude: lat,
      longitude: lon,
      timezone,
    };
  }

  return {
    name: 'native',
    dateOfBirth: d.toISOString().slice(0, 10),
    timeOfBirth: d.toISOString().slice(11, 16),
    latitude: lat,
    longitude: lon,
    timezone: 'UTC',
  };
}

/** IANA timezone from lat/lon via Open-Meteo (same provider as /api/geocode). */
export async function fetchTimezoneForCoords(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return null;
    const data = await response.json() as { timezone?: string };
    return typeof data.timezone === 'string' && data.timezone ? data.timezone : null;
  } catch {
    return null;
  }
}

function mapVimshottariDashas(chart: VedicChartCalculations, targetDate: Date): VimshottariDashasResponse {
  const vimshottari = chart.dashas?.vimshottari;
  if (!vimshottari?.dashaPeriods) {
    throw new Error('Vimshottari dasha data unavailable');
  }

  const dashaPeriods = vimshottari.dashaPeriods.map((md) => ({
    planet: capitalize(md.planet),
    startDate: md.startDate,
    endDate: md.endDate,
    subPeriods: (md.subPeriods ?? []).map((ad) => ({
      planet: capitalize(ad.planet),
      startDate: ad.startDate,
      endDate: ad.endDate,
    })),
  }));

  const current = vedicCalc.getCurrentDasha(vimshottari, targetDate);

  return {
    dashaPeriods,
    current: {
      mahadasha: current.mahaDasha
        ? {
            planet: capitalize(current.mahaDasha.planet),
            startDate: current.mahaDasha.startDate,
            endDate: current.mahaDasha.endDate,
          }
        : null,
      antardasha: current.antarDasha
        ? {
            planet: capitalize(current.antarDasha.planet),
            startDate: current.antarDasha.startDate,
            endDate: current.antarDasha.endDate,
          }
        : null,
    },
    birthNakshatra: normalizeNakshatra(chart.planets.moon.nakshatra as string),
    birthDashaLord: dashaPeriods[0]?.planet ?? '',
  } as unknown as VimshottariDashasResponse;
}

/**
 * Sidereal positions at an absolute instant. The Ascendant (and houses) are
 * only included when a location is supplied.
 */
export async function computePositions(date: Date, lat?: number, lon?: number): Promise<PlanetPosition[]> {
  if (isNaN(date.getTime())) throw new Error('Invalid date');
  const hasLocation = typeof lat === 'number' && typeof lon === 'number';
  const chart = await vedicCalc.calculateChart({
    name: 'transit',
    dateOfBirth: date.toISOString().slice(0, 10),  // YYYY-MM-DD (UTC)
    timeOfBirth: date.toISOString().slice(11, 16),  // HH:MM (UTC)
    latitude: hasLocation ? lat : 0,
    longitude: hasLocation ? lon : 0,
    timezone: 'UTC',
  });
  return mapChartToPositions(chart, hasLocation);
}

/** Full 120-year Vimshottari timeline with the periods active at `targetDate`. */
export async function computeDashas(
  isoDate: string,
  lat: number,
  lon: number,
  timezone?: string,
  targetDate: Date = new Date(),
): Promise<VimshottariDashasResponse> {
  const chart = await vedicCalc.calculateChart(buildBirthInfoFromIso(isoDate, lat, lon, timezone));
  return mapVimshottariDashas(chart, isNaN(targetDate.getTime()) ? new Date() : targetDate);
}

/**
 * Exact sign-change instants. Unknown planet keys are ignored. Throws
 * InvalidIngressRangeError for an invalid or over-long range, before any work.
 */
export function computeTransitIngresses(start: Date, end: Date, planets?: string[]): VedicTransitIngress[] {
  assertIngressRange(start, end);
  const requested = Array.isArray(planets) && planets.length > 0
    ? planets.filter((p): p is Planet => ALL_VEDIC_PLANETS.includes(p as Planet))
    : ALL_VEDIC_PLANETS;
  return transitCalc.calculateTransitIngresses(requested, start, end);
}

export function disposeEphemeris(): void {
  vedicCalc.dispose();
}
