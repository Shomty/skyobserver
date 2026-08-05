import { format } from 'date-fns';
import { resolveBirthInstant } from '../../gift/lib/birthInstant';
import type { PlaceResolution } from '../../gift/types';
import { fetchPlanetPositions, fetchTransitIngresses } from '../../../services/positionsService';
import {
  analyzeNatalComparison,
  calculatePanchang,
  calculatePositions,
  predictTransits,
  type NatalComparisonResult,
  type PanchangData,
  type PlanetPosition,
  type TransitIngress,
  type TransitPrediction,
} from '../../../vedic-utils';

export type EnergyLevel = 'high' | 'balanced' | 'low' | 'caution';

export interface DayForecast {
  date: string;
  label: string;
  isToday: boolean;
  energyScore: number;
  energyLevel: EnergyLevel;
  panchang: PanchangData;
  highlights: string[];
  transitHits: NatalComparisonResult[];
}

export interface DailyForecast {
  computedAt: string;
  locationLabel: string;
  timezone: string;
  todayIndex: number;
  days: DayForecast[];
  upcomingPredictions: TransitPrediction[];
}

const FORECAST_DAYS = 7;

function localDayKey(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function addLocalDays(dateKey: string, days: number, timezone: string): string {
  const instant = resolveBirthInstant(dateKey, '12:00', timezone);
  if (!instant) return dateKey;
  const next = new Date(new Date(instant.iso).getTime() + days * 86400000);
  return localDayKey(next, timezone);
}

function dayLabel(dateKey: string, timezone: string, isToday: boolean): string {
  if (isToday) return 'Today';
  const instant = resolveBirthInstant(dateKey, '12:00', timezone);
  if (!instant) return dateKey;
  return format(new Date(instant.iso), 'EEE MMM d');
}

function scoreToLevel(score: number): EnergyLevel {
  if (score >= 72) return 'high';
  if (score >= 55) return 'balanced';
  if (score >= 38) return 'low';
  return 'caution';
}

function computeEnergyScore(
  hits: NatalComparisonResult[],
  panchang: PanchangData,
  dashaMdScore: number,
): number {
  let score = 50;

  for (const hit of hits.slice(0, 8)) {
    const weight = hit.intensity === 'high' ? 12 : hit.intensity === 'medium' ? 7 : 3;
    const positive =
      hit.type === 'conjunction' &&
      ['Jupiter', 'Venus', 'Moon', 'Mercury'].includes(hit.planet);
    const challenging =
      hit.type === 'aspect' &&
      ['Saturn', 'Rahu', 'Ketu', 'Mars'].includes(hit.planet) &&
      hit.intensity === 'high';

    if (positive) score += weight;
    else if (challenging) score -= weight;
    else if (hit.intensity === 'high') score += hit.category === 'major' ? 4 : 2;
  }

  if (panchang.tithi.phase === 'Shukla' && panchang.tithi.number >= 2 && panchang.tithi.number <= 12) {
    score += 4;
  }
  if (['Siddhi', 'Shiva', 'Sadhya', 'Brahma', 'Indra'].includes(panchang.yoga.name)) {
    score += 3;
  }

  score += Math.max(-8, Math.min(8, Math.round(dashaMdScore / 8)));

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildHighlights(
  hits: NatalComparisonResult[],
  panchang: PanchangData,
  predictions: TransitPrediction[],
  dateKey: string,
): string[] {
  const out: string[] = [];

  out.push(
    `${panchang.tithi.phase} ${panchang.tithi.name} · ${panchang.nakshatra.name} · ${panchang.vara}`,
  );

  for (const hit of hits.slice(0, 3)) {
    out.push(hit.description);
  }

  const dayPredictions = predictions.filter(
    (p) => localDayKey(p.date, 'UTC') === dateKey || p.date.toISOString().slice(0, 10) === dateKey,
  );
  for (const p of dayPredictions.slice(0, 2)) {
    if (p.type === 'Natal Conjunction' || p.type === 'Natal Aspect') {
      out.push(`${p.planet}: ${p.type} with natal ${p.natalPlanet ?? p.to}`);
    } else if (p.isImportant) {
      out.push(`${p.planet} enters ${p.to}`);
    }
  }

  return out.slice(0, 5);
}

async function fetchDayPositions(
  dateKey: string,
  place: PlaceResolution,
  useSwissEphemeris: boolean,
): Promise<PlanetPosition[]> {
  const instant = resolveBirthInstant(dateKey, '12:00', place.timezone);
  if (!instant) throw new Error(`Could not resolve local noon for ${dateKey}`);
  const date = new Date(instant.iso);
  if (useSwissEphemeris) {
    return fetchPlanetPositions(date, place.latitude, place.longitude);
  }
  return calculatePositions(date, place.latitude, place.longitude);
}

export async function buildDailyForecast(
  natalPositions: PlanetPosition[],
  currentPlace: PlaceResolution,
  now: Date,
  dashaMdScore: number,
): Promise<DailyForecast> {
  const todayKey = localDayKey(now, currentPlace.timezone);
  const dayKeys = Array.from({ length: FORECAST_DAYS }, (_, i) => addLocalDays(todayKey, i, currentPlace.timezone));

  const startInstant = resolveBirthInstant(todayKey, '00:00', currentPlace.timezone);
  const endKey = dayKeys[dayKeys.length - 1];
  const endInstant = resolveBirthInstant(endKey, '23:59', currentPlace.timezone);

  const [ingresses, todayPositions, ...futureDaySets] = await Promise.all([
    fetchTransitIngresses(
      startInstant ? new Date(startInstant.iso) : now,
      endInstant ? new Date(endInstant.iso) : new Date(now.getTime() + FORECAST_DAYS * 86400000),
    ),
    fetchDayPositions(todayKey, currentPlace, true),
    ...dayKeys.slice(1).map((key) => fetchDayPositions(key, currentPlace, false)),
  ]);
  const dayPositionSets = [todayPositions, ...futureDaySets];

  const currentPositions = dayPositionSets[0];
  const predictions = predictTransits(
    startInstant ? new Date(startInstant.iso) : now,
    currentPositions,
    natalPositions,
    ingresses,
  ).filter((p) => {
    const pKey = p.date.toISOString().slice(0, 10);
    return dayKeys.includes(pKey) || dayKeys.some((k) => p.date >= new Date(`${k}T00:00:00Z`));
  });

  const days: DayForecast[] = dayKeys.map((dateKey, index) => {
    const positions = dayPositionSets[index];
    const instant = resolveBirthInstant(dateKey, '12:00', currentPlace.timezone);
    const at = instant ? new Date(instant.iso) : now;
    const hits = analyzeNatalComparison(positions, natalPositions, at, ingresses);
    const panchang = calculatePanchang(at, positions);
    const energyScore = computeEnergyScore(hits, panchang, dashaMdScore);

    return {
      date: dateKey,
      label: dayLabel(dateKey, currentPlace.timezone, index === 0),
      isToday: index === 0,
      energyScore,
      energyLevel: scoreToLevel(energyScore),
      panchang,
      highlights: buildHighlights(hits, panchang, predictions, dateKey),
      transitHits: hits.slice(0, 6),
    };
  });

  return {
    computedAt: now.toISOString(),
    locationLabel: currentPlace.label,
    timezone: currentPlace.timezone,
    todayIndex: 0,
    days,
    upcomingPredictions: predictions.slice(0, 12),
  };
}

export function energyLevelColor(level: EnergyLevel): string {
  switch (level) {
    case 'high':
      return '#22c55e';
    case 'balanced':
      return '#D4AF37';
    case 'low':
      return '#94a3b8';
    case 'caution':
      return '#f97316';
  }
}

export type { TransitIngress, NatalComparisonResult, PanchangData };
