import { calculateDashaLevels, getRashiLord, RASHIS, type PlanetPosition, type SignNumber } from '../../../vedic-utils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import { lifeAreaForHouse, signName, signOfHouse } from './personalConstants';

export interface PersonalDashaAnalysis {
  mahadashaLord: string;
  antardashaLord: string;
  mahadashaLifeAreas: string[];
  antardashaLifeAreas: string[];
  mahadashaLifeAreasD9: string[];
  antardashaLifeAreasD9: string[];
  activatedLifeAreas: string[];
}

function housesRuledByLord(lord: string, ascSign: SignNumber): number[] {
  const houses: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const sign = signOfHouse(h, ascSign);
    if (getRashiLord(signName(sign)) === lord) {
      houses.push(h);
    }
  }
  return houses;
}

function d9AscSign(positions: PlanetPosition[]): SignNumber {
  const d9 = computeDivisionalChart(positions, 'D9');
  const asc = d9.positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('D9 Ascendant not found');
  return (RASHIS.indexOf(asc.rashi) + 1) as SignNumber;
}

export function buildPersonalDashaAnalysis(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  dasha: {
    mahadasha: { planet: string };
    antardasha: { planet: string };
  },
): PersonalDashaAnalysis {
  const d9Asc = d9AscSign(positions);
  const mdHouses = housesRuledByLord(dasha.mahadasha.planet, ascSign);
  const adHouses = housesRuledByLord(dasha.antardasha.planet, ascSign);
  const mdHousesD9 = housesRuledByLord(dasha.mahadasha.planet, d9Asc);
  const adHousesD9 = housesRuledByLord(dasha.antardasha.planet, d9Asc);

  const mahadashaLifeAreas = mdHouses.map(lifeAreaForHouse);
  const antardashaLifeAreas = adHouses.map(lifeAreaForHouse);
  const mahadashaLifeAreasD9 = mdHousesD9.map(lifeAreaForHouse);
  const antardashaLifeAreasD9 = adHousesD9.map(lifeAreaForHouse);
  const activatedLifeAreas = [
    ...new Set([
      ...mahadashaLifeAreas,
      ...antardashaLifeAreas,
      ...mahadashaLifeAreasD9,
      ...antardashaLifeAreasD9,
    ]),
  ];

  return {
    mahadashaLord: dasha.mahadasha.planet,
    antardashaLord: dasha.antardasha.planet,
    mahadashaLifeAreas,
    antardashaLifeAreas,
    mahadashaLifeAreasD9,
    antardashaLifeAreasD9,
    activatedLifeAreas,
  };
}

/** Extract dasha levels — mirrors career engine helper. */
export function extractDashaLevels(
  positions: PlanetPosition[],
  birthDate: Date,
  now: Date,
  dashas: VimshottariDashasResponse,
): import('../types').PersonalSnapshot['dasha'] {
  const moon = positions.find((p) => p.name === 'Moon');

  const toRef = (period: { lord: string; start: Date; end: Date }) => ({
    planet: period.lord,
    startDate: period.start.toISOString(),
    endDate: period.end.toISOString(),
  });

  if (moon) {
    const levels = calculateDashaLevels(birthDate, moon.siderealLongitude, now);
    const md = levels.find((l) => l.level === 1);
    const ad = levels.find((l) => l.level === 2);
    const pd = levels.find((l) => l.level === 3);
    if (md && ad && pd) {
      const all: { planet: string; start: Date; end: Date }[] = [];
      for (const d of dashas.dashaPeriods) {
        for (const sub of d.subPeriods) {
          all.push({ planet: sub.planet, start: new Date(sub.startDate), end: new Date(sub.endDate) });
        }
      }
      all.sort((a, b) => a.start.getTime() - b.start.getTime());
      const currentIdx = all.findIndex((a) => now >= a.start && now < a.end);
      const next = currentIdx >= 0 ? all[currentIdx + 1] : all.find((a) => a.start > now);

      return {
        mahadasha: toRef(md),
        antardasha: toRef(ad),
        pratyantardasha: toRef(pd),
        nextAntardasha: next
          ? { planet: next.planet, startDate: next.start.toISOString(), endDate: next.end.toISOString() }
          : { planet: 'Unknown', startDate: '', endDate: '' },
      };
    }
  }

  const md = dashas.current.mahadasha;
  const ad = dashas.current.antardasha;
  return {
    mahadasha: md
      ? { planet: md.planet, startDate: md.startDate, endDate: md.endDate }
      : { planet: 'Unknown', startDate: '', endDate: '' },
    antardasha: ad
      ? { planet: ad.planet, startDate: ad.startDate, endDate: ad.endDate }
      : { planet: 'Unknown', startDate: '', endDate: '' },
    pratyantardasha: { planet: 'Unknown', startDate: '', endDate: '' },
    nextAntardasha: { planet: 'Unknown', startDate: '', endDate: '' },
  };
}