import type { NatalComparisonResult } from '../../../vedic-utils';
import type { DailySnapshot } from '../types';
import { dailyTransitHitId } from './dailyTransitFingerprint';

export interface DailyTransitSeedItem {
  id: string;
  date: string;
  dayLabel: string;
  description: string;
  type: string;
  planet: string;
  intensity: string;
  category: string;
  existingHint?: string;
}

export interface DailyTransitSeed {
  ascendant: string;
  mahadasha: string;
  antardasha: string;
  locationLabel: string;
  transits: DailyTransitSeedItem[];
}

export function buildDailyTransitSeed(snapshot: DailySnapshot): DailyTransitSeed {
  const transits: DailyTransitSeedItem[] = [];

  for (const day of snapshot.forecast.days) {
    day.transitHits.forEach((hit: NatalComparisonResult, index: number) => {
      transits.push({
        id: dailyTransitHitId(day.date, index, hit.planet, hit.type),
        date: day.date,
        dayLabel: day.label,
        description: hit.description,
        type: hit.type,
        planet: hit.planet,
        intensity: hit.intensity,
        category: hit.category,
        existingHint: hit.interpretation,
      });
    });
  }

  return {
    ascendant: snapshot.ascendantSignName,
    mahadasha: snapshot.dasha.mahadasha.planet,
    antardasha: snapshot.dasha.antardasha.planet,
    locationLabel: snapshot.currentPlaceLabel,
    transits,
  };
}
