import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  analyzeNatalComparison,
  analyzeTransits,
  calculateAshtakavarga,
  calculateCharakarakas,
  calculatePanchang,
  calculateSpecialPointsV2,
  detectAllYogas,
  getBirthInfo,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
  type TransitIngress,
} from '../../src/vedic-utils.ts';
import {
  computeDivisionalChart,
  DIVISIONAL_CHART_INFO,
  DIVISIONAL_CHART_TYPES,
} from '../../src/lib/divisionalChartUtils.ts';
import { extractDashaLevels } from '../../src/features/personal/lib/dashaPersonalEngine.ts';
import type { VimshottariDashasResponse } from '../../src/services/dashasService.ts';
import { computePositions, computeTransitIngresses } from '../ephemeris.ts';
import { searchPlaces } from '../geocode.ts';
import { getChartContext, type ChartContext } from './chartContext.ts';
import { momentShape, resolveMoment, type MomentInput } from './moment.ts';
import { runTool, type ToolContext } from './toolRunner.ts';
import { jsonResult, round, ToolInputError } from './toolResult.ts';

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

/** The fields a model needs; drops UI-only values such as colour and glyph. */
export function compactPosition(p: PlanetPosition) {
  return {
    name: p.name,
    sign: p.rashi,
    degree: p.degree,
    minute: p.minute,
    siderealLongitude: round(p.siderealLongitude, 3),
    nakshatra: p.nakshatra,
    pada: p.pada,
    ...(p.house !== undefined ? { house: p.house } : {}),
    ...(p.dignity ? { dignity: p.dignity } : {}),
    ...(p.isRetrograde ? { retrograde: true } : {}),
    ...(p.isCombust ? { combust: true } : {}),
  };
}

function birthSummary(chart: ChartContext) {
  return {
    utc: chart.instant.iso,
    utcOffsetMinutes: chart.instant.offsetMinutes,
    place: chart.place.label,
    latitude: chart.place.latitude,
    longitude: chart.place.longitude,
    timezone: chart.place.timezone,
  };
}

async function loadChart(input: MomentInput): Promise<ChartContext> {
  return getChartContext(await resolveMoment(input));
}

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const atSchema = z.string().max(40).optional();

function parseAt(at: string | undefined): Date {
  if (!at) return new Date();
  const d = new Date(at);
  if (!ISO_DATE_TIME.test(at) || isNaN(d.getTime())) {
    throw new ToolInputError('`at` must be an ISO-8601 date-time, e.g. 2026-10-15T09:00:00Z.');
  }
  return d;
}

function periodAt<T extends { startDate: string; endDate: string }>(periods: T[], at: Date): T | undefined {
  return periods.find((p) => at >= new Date(p.startDate) && at < new Date(p.endDate));
}

function dashaTimeline(dashas: VimshottariDashasResponse, at: Date, allAntardashas: boolean) {
  const currentMd = periodAt(dashas.dashaPeriods, at);
  return dashas.dashaPeriods.map((md) => ({
    planet: md.planet,
    startDate: md.startDate,
    endDate: md.endDate,
    ...(allAntardashas || md === currentMd ? { antardashas: md.subPeriods } : {}),
  }));
}

/** Whole-sign house of `sign` counted from the natal Lagna. */
function natalHouse(chart: ChartContext, sign: string): number {
  const asc = chart.positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant missing from chart');
  return ((RASHIS.indexOf(sign) - RASHIS.indexOf(asc.rashi) + 12) % 12) + 1;
}

function toIngresses(raw: ReturnType<typeof computeTransitIngresses>): TransitIngress[] {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return raw.map((i) => ({
    planet: cap(i.planet),
    sign: cap(i.sign),
    fromSign: cap(i.fromSign),
    date: new Date(i.date),
    isRetrograde: i.isRetrograde,
    longitude: i.longitude,
  }));
}

function specialPoints(chart: ChartContext) {
  const { positions, birthDate, place } = chart;
  const asc = positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant missing from chart');
  const info = getBirthInfo(birthDate, place.latitude, place.longitude);
  return calculateSpecialPointsV2(
    (RASHIS.indexOf(asc.rashi) + 1) as SignNumber,
    asc.siderealLongitude,
    positions,
    info.sunAbsoluteLongitudeAtSunrise,
    info.minutesSinceSunrise,
    info.isDayBirth,
    info.daytimeDurationMinutes,
    info.dayOfWeek,
    birthDate,
    place.latitude,
    place.longitude,
    info.sunrise,
    info.sunset,
  );
}

export function registerCalcTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool('find_place', {
    title: 'Find place',
    description: 'Geocode a place name to coordinates and IANA timezone. Use it to disambiguate a birthplace before charting.',
    inputSchema: { query: z.string().min(2).max(200) },
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, ({ query }) => runTool(ctx, 'find_place', 'calc', async () => ({
    result: jsonResult({ places: await searchPlaces(query, 5) }),
  })));

  server.registerTool('get_birth_chart', {
    title: 'Vedic birth chart (D1)',
    description: 'Sidereal (Lahiri) birth chart from Swiss Ephemeris: ascendant, the nine grahas with sign, degree, nakshatra/pada, whole-sign house, dignity, retrograde/combust flags, plus Gulika and Maandi.',
    inputSchema: momentShape,
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_birth_chart', 'calc', async () => {
    const chart = await loadChart(input);
    const names = new Set(chart.positions.map((p) => p.name));
    return {
      result: jsonResult({
        birth: birthSummary(chart),
        ayanamsa: 'Lahiri',
        houseSystem: 'whole-sign',
        planets: chart.positions.map(compactPosition),
        upagrahas: chart.positionsWithUpagrahas.filter((p) => !names.has(p.name)).map(compactPosition),
      }),
    };
  }));

  server.registerTool('get_vimshottari_dashas', {
    title: 'Vimshottari dashas',
    description: 'Active Mahadasha / Antardasha / Pratyantardasha at a date (default now) and the 120-year Mahadasha timeline. Antardashas are listed for the active Mahadasha unless includeAllAntardashas is true.',
    inputSchema: {
      ...momentShape,
      at: atSchema.describe('ISO-8601 date-time to evaluate; defaults to now'),
      includeAllAntardashas: z.boolean().optional(),
    },
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_vimshottari_dashas', 'calc', async () => {
    const chart = await loadChart(input);
    const at = parseAt(input.at);
    return {
      result: jsonResult({
        birth: birthSummary(chart),
        at: at.toISOString(),
        birthNakshatra: chart.dashas.birthNakshatra,
        birthDashaLord: chart.dashas.birthDashaLord,
        active: extractDashaLevels(chart.positions, chart.birthDate, at, chart.dashas),
        mahadashas: dashaTimeline(chart.dashas, at, input.includeAllAntardashas ?? false),
      }),
    };
  }));

  server.registerTool('get_yogas', {
    title: 'Yogas',
    description: 'All detected yogas in the birth chart (Raja, Dhana, Mahapurusha, Nabhasha, lunar/solar, Neechabhanga, Viparita, Kala Sarpa, Daridra, …) with strength and whether the current dasha activates them.',
    inputSchema: momentShape,
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_yogas', 'calc', async () => {
    const chart = await loadChart(input);
    const { mahadasha, antardasha } = chart.dashas.current;
    const { detectedAt: _ignored, ...yogas } = detectAllYogas(chart.positions, mahadasha?.planet, antardasha?.planet);
    return { result: jsonResult({ birth: birthSummary(chart), ...yogas }) };
  }));

  server.registerTool('get_panchang', {
    title: 'Panchang',
    description: 'Tithi, vara, nakshatra, yoga and karana for a moment at a place — a birth or any date.',
    inputSchema: momentShape,
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_panchang', 'calc', async () => {
    const { place, instant } = await resolveMoment(input);
    const at = new Date(instant.iso);
    const positions = await computePositions(at, place.latitude, place.longitude);
    return {
      result: jsonResult({
        at: instant.iso,
        place: place.label,
        panchang: calculatePanchang(at, positions),
      }),
    };
  }));

  server.registerTool('get_ashtakavarga', {
    title: 'Ashtakavarga',
    description: 'Bhinna (per planet) and Sarva ashtakavarga bindus for the twelve signs of the birth chart.',
    inputSchema: momentShape,
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_ashtakavarga', 'calc', async () => {
    const chart = await loadChart(input);
    return { result: jsonResult({ birth: birthSummary(chart), signs: RASHIS, ashtakavarga: calculateAshtakavarga(chart.positions) }) };
  }));

  server.registerTool('get_divisional_chart', {
    title: 'Divisional chart (varga)',
    description: 'Planet placements in a divisional chart, e.g. D9 Navamsha (relationships, dharma) or D10 Dashamsha (career).',
    inputSchema: {
      ...momentShape,
      chart: z.enum(DIVISIONAL_CHART_TYPES as [string, ...string[]]).describe('D1…D60'),
    },
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_divisional_chart', 'calc', async () => {
    const chart = await loadChart(input);
    const type = input.chart as keyof typeof DIVISIONAL_CHART_INFO;
    const division = computeDivisionalChart(chart.positions, type);
    return {
      result: jsonResult({
        birth: birthSummary(chart),
        chart: type,
        about: DIVISIONAL_CHART_INFO[type],
        ...division,
        positions: division.positions.map(compactPosition),
      }),
    };
  }));

  server.registerTool('get_special_points', {
    title: 'Jaimini & special points',
    description: 'Chara karakas (Atmakaraka, Amatyakaraka, …), Arudha and Upapada lagna, Ishta Devata, special lagnas and kaala velas for the birth chart.',
    inputSchema: momentShape,
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_special_points', 'calc', async () => {
    const chart = await loadChart(input);
    return {
      result: jsonResult({
        birth: birthSummary(chart),
        charakarakas: calculateCharakarakas(chart.positions),
        specialPoints: specialPoints(chart),
      }),
    };
  }));

  server.registerTool('get_transits', {
    title: 'Transits vs. natal',
    description: 'Current (or given) planetary transits compared to the birth chart: transit positions with the natal house they occupy, natal contacts with interpretations, notable transit events, and exact sign ingresses over the next N days.',
    inputSchema: {
      ...momentShape,
      at: atSchema.describe('ISO-8601 date-time; defaults to now'),
      days: z.number().int().min(1).max(365).optional().describe('Ingress look-ahead window in days (default 30)'),
    },
    annotations: READ_ONLY,
  }, (input) => runTool(ctx, 'get_transits', 'calc', async () => {
    const chart = await loadChart(input);
    const at = parseAt(input.at);
    const days = input.days ?? 30;
    const end = new Date(at.getTime() + days * 86_400_000);
    // Geocentric grahas only: houses are counted from the natal Lagna, which
    // is what a transit reading needs, not from a transit ascendant.
    const transitPositions = await computePositions(at);
    const ingresses = toIngresses(computeTransitIngresses(at, end));
    return {
      result: jsonResult({
        birth: birthSummary(chart),
        at: at.toISOString(),
        transitPositions: transitPositions.map((p) => ({
          ...compactPosition(p),
          house: natalHouse(chart, p.rashi),
        })),
        natalContacts: analyzeNatalComparison(transitPositions, chart.positions, at, ingresses),
        events: analyzeTransits(transitPositions, at, ingresses),
        ingresses: ingresses.map((i) => ({ ...i, date: i.date.toISOString(), longitude: round(i.longitude, 3) })),
      }),
    };
  }));
}
