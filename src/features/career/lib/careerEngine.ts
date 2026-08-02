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
    return { planet: last?.planet ?? 'Unknown', startDate: last?.start.toISOString() ?? '', endDate: last?.end.toISOString() ?? '' };
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
  const occupants = positions
    .filter((p) => p.house === 10 && p.name !== 'Ascendant')
    .map((p) => p.name);

  const tenthLordName = getRashiLord(tenthSign);
  const tenthLordPos = positions.find((p) => p.name === tenthLordName);
  if (!tenthLordPos) throw new Error(`10th lord ${tenthLordName} not found`);

  const charas = calculateCharakarakas(positions);
  const amatyakaraka = charas.AmK !== 'None' ? charas.AmK : null;

  const d10Result = computeDivisionalChart(positions, 'D10');
  const d10Asc = d10Result.positions.find((p) => p.name === 'Ascendant');
  const d10AscIdx = d10Asc ? RASHIS.indexOf(d10Asc.rashi) : 0;
  const d10TenthSign = RASHIS[(d10AscIdx + 9) % 12];
  const d10TenthLord = getRashiLord(d10TenthSign);
  const d10TenthLordPos = d10Result.positions.find((p) => p.name === d10TenthLord);
  const amkPos = amatyakaraka
    ? d10Result.positions.find((p) => p.name === amatyakaraka)
    : undefined;

  const wealthYogas = detectDhanaYogas(positions, ascendantSign);
  const timing = computeCareerTiming({
    dashas,
    tenthLord: tenthLordName,
    tenthOccupants: occupants,
    amatyakaraka,
    ascendantSign,
    now,
  });

  const fields = rankCareerFields(tenthSign, tenthLordName, tenthLordPos.house ?? 1, amkPos?.rashi ?? null);

  const dashaLevels = extractDashaLevels(positions, birthInstant, now, dashas);
  const parashari = buildParashariAnalysis(
    positions,
    ascendantSign,
    amatyakaraka,
    dashaLevels.mahadasha.planet,
    dashaLevels.antardasha.planet,
  );

  return {
    ascendantSign,
    tenthHouse: { sign: tenthSign, signNumber: tenthSignNumber, occupants },
    tenthLord: {
      planet: tenthLordName,
      house: tenthLordPos.house ?? 1,
      sign: tenthLordPos.rashi,
      isRetrograde: tenthLordPos.isRetrograde,
      isCombust: tenthLordPos.isCombust,
      dignity: tenthLordPos.dignity,
    },
    d10: {
      ascendantSign: d10Asc?.rashi ?? asc.rashi,
      tenthLordHouse: d10TenthLordPos?.house ?? 1,
      amkHouse: amkPos?.house ?? null,
    },
    amatyakaraka,
    scores: {
      tenthHouseStrength: computeTenthHouseStrength(positions, ascendantSign, tenthSign, tenthLordPos),
      leadership: computeLeadership(positions, ascendantSign, tenthLordName),
      careerDrive: computeCareerDrive(positions, tenthLordPos, amatyakaraka),
    },
    dasha: dashaLevels,
    timing,
    wealthYogas,
    fields,
    parashari,
  };
}
