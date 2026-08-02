import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import {
  calculateCharakarakas,
  calculateDashaLevels,
  detectDhanaYogas,
  getRashiLord,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import type { BirthInstant } from '../../gift/lib/birthInstant';
import { rankCareerFields } from '../copy/careerFields';
import type { CareerSnapshot, DashaRef } from '../types';
import { buildCareerReading } from './careerReading';
import { buildD10Analysis } from './d10Engine';
import type { CareerReadingContext } from './dashaActivation';
import { computeCareerDrive, computeLeadership, computeTenthHouseStrength } from './careerScores';
import { computeCareerTiming } from './careerTiming';
import { buildParashariAnalysis } from './parashariEngine';

function toDashaRef(period: { lord: string; start: Date; end: Date }): DashaRef {
  return {
    planet: period.lord,
    startDate: period.start.toISOString(),
    endDate: period.end.toISOString(),
  };
}

function findNextAntardasha(dashas: VimshottariDashasResponse, now: Date): DashaRef {
  const all: { planet: string; start: Date; end: Date }[] = [];
  for (const md of dashas.dashaPeriods) {
    for (const ad of md.subPeriods) {
      all.push({ planet: ad.planet, start: new Date(ad.startDate), end: new Date(ad.endDate) });
    }
  }
  all.sort((a, b) => a.start.getTime() - b.start.getTime());
  const currentIdx = all.findIndex((ad) => now >= ad.start && now < ad.end);
  const next = currentIdx >= 0 ? all[currentIdx + 1] : all.find((ad) => ad.start > now);
  if (!next) {
    const last = all[all.length - 1];
    return {
      planet: last?.planet ?? 'Unknown',
      startDate: last?.start.toISOString() ?? '',
      endDate: last?.end.toISOString() ?? '',
    };
  }
  return { planet: next.planet, startDate: next.start.toISOString(), endDate: next.end.toISOString() };
}

function extractDashaLevels(
  positions: PlanetPosition[],
  birthInstant: BirthInstant,
  now: Date,
  dashas: VimshottariDashasResponse,
): CareerSnapshot['dasha'] {
  const moon = positions.find((p) => p.name === 'Moon');
  const birthDate = new Date(birthInstant.iso);

  if (moon) {
    const levels = calculateDashaLevels(birthDate, moon.siderealLongitude, now);
    const md = levels.find((l) => l.level === 1);
    const ad = levels.find((l) => l.level === 2);
    const pd = levels.find((l) => l.level === 3);
    if (md && ad && pd) {
      return {
        mahadasha: toDashaRef(md),
        antardasha: toDashaRef(ad),
        pratyantardasha: toDashaRef(pd),
        nextAntardasha: findNextAntardasha(dashas, now),
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
    nextAntardasha: findNextAntardasha(dashas, now),
  };
}

export function buildCareerSnapshot(
  positions: PlanetPosition[],
  dashas: VimshottariDashasResponse,
  birthInstant: BirthInstant,
  now: Date,
): CareerSnapshot {
  const asc = positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant not found in positions');

  const ascSignIndex = RASHIS.indexOf(asc.rashi);
  const ascendantSign = (ascSignIndex + 1) as SignNumber;
  const tenthSignIndex = (ascSignIndex + 9) % 12;
  const tenthSign = RASHIS[tenthSignIndex];
  const tenthSignNumber = (tenthSignIndex + 1) as SignNumber;

  const dashaLevels = extractDashaLevels(positions, birthInstant, now, dashas);
  const reading = buildCareerReading(positions, dashas, now, dashaLevels.pratyantardasha);

  const tenthLordPos = positions.find((p) => p.name === reading.d1.tenthLord.planet);
  if (!tenthLordPos) throw new Error(`10th lord ${reading.d1.tenthLord.planet} not found`);

  const charas = calculateCharakarakas(positions);
  const amatyakaraka = charas.AmK !== 'None' ? charas.AmK : null;

  const d10Result = computeDivisionalChart(positions, 'D10');
  const d10Asc = d10Result.positions.find((p) => p.name === 'Ascendant');
  const amkPos = amatyakaraka
    ? d10Result.positions.find((p) => p.name === amatyakaraka)
    : undefined;

  const wealthYogas = detectDhanaYogas(positions, ascendantSign);

  const d10Full = buildD10Analysis(positions, reading.d1.amk.planet);
  const ctx: CareerReadingContext = {
    positions,
    ascSign: ascendantSign,
    d1: reading.d1,
    d9: reading.d9,
    d10: d10Full,
    karmic: reading.d1.karmic,
    atmakaraka: charas.AK,
  };

  const timing = computeCareerTiming({ reading, ctx, dashas, now });
  const fields = rankCareerFields(
    tenthSign,
    reading.d1.tenthLord.planet,
    reading.d1.tenthLord.house,
    amkPos?.rashi ?? null,
  );
  const parashari = buildParashariAnalysis(reading);

  return {
    ascendantSign,
    tenthHouse: {
      sign: reading.d1.tenth.sign,
      signNumber: reading.d1.tenth.signNumber,
      occupants: reading.d1.tenth.occupants,
    },
    tenthLord: {
      planet: reading.d1.tenthLord.planet,
      house: reading.d1.tenthLord.house,
      sign: reading.d1.tenthLord.sign,
      isRetrograde: reading.d1.tenthLord.isRetrograde,
      isCombust: reading.d1.tenthLord.isCombust,
      dignity: reading.d1.tenthLord.dignity ?? undefined,
    },
    d10: {
      ascendantSign: reading.d10.lagna.lagnaSign,
      tenthLordHouse: reading.d10.tenth.lordHouse,
      amkHouse: reading.d10.amk.house || null,
    },
    amatyakaraka,
    scores: {
      tenthHouseStrength: computeTenthHouseStrength(
        positions,
        ascendantSign,
        tenthSign,
        tenthLordPos,
      ),
      leadership: computeLeadership(positions, ascendantSign, reading.d1.tenthLord.planet),
      careerDrive: computeCareerDrive(positions, tenthLordPos, amatyakaraka),
    },
    dasha: dashaLevels,
    timing,
    wealthYogas,
    fields,
    parashari,
    reading,
  };
}
