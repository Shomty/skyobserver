import { calculateDrishti, getRashiLord, RASHIS, type PlanetPosition, type SignNumber } from '../../../vedic-utils';
import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import { analyzeSaturnShadow } from './lifeMissionEngine';
import { DUSTHANA_HOUSES, GRAHAS, houseOfSign, signName, signOfHouse } from './personalConstants';

export interface DusthanaAffliction {
  planet: string;
  role: 'lagnaLord' | 'moon' | 'sun' | 'atmakaraka';
  house: number;
  dusthana: 6 | 8 | 12;
}

export interface DusthanaAspectAffliction {
  planet: string;
  role: DusthanaAffliction['role'];
  aspectedBy: string;
  fromDusthana: 6 | 8 | 12;
}

export interface PersonalKarmicAffliction {
  point: 'Gulika' | 'Maandi';
  chart: 'D1' | 'D9';
  sign: string;
  house: number;
  afflicts: Array<'1st house' | '7th house' | '9th house' | '1st lord' | '7th lord' | '9th lord' | 'moon' | 'sun' | 'atmakaraka'>;
  severity: 'mild' | 'significant';
}

export interface ShadowAnalysis {
  dusthanaAfflictions: DusthanaAffliction[];
  dusthanaAspectAfflictions: DusthanaAspectAffliction[];
  saturn: ReturnType<typeof analyzeSaturnShadow>;
  rahuHouse: number;
  ketuHouse: number;
  karmic: PersonalKarmicAffliction[];
}

const UPAGRAHAS = ['Gulika', 'Maandi'] as const;

function angularDistance(lon1: number, lon2: number): number {
  const diff = Math.abs(lon1 - lon2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function seventhFromSign(signNumber: SignNumber): SignNumber {
  return signOfHouse(7, signNumber);
}

export function checkPersonalKarmicAfflictions(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  targets: {
    lagnaLord: string;
    seventhLord: string;
    ninthLord: string;
    moon: string;
    sun: string;
    atmakaraka: string;
  },
  chart: 'D1' | 'D9' = 'D1',
): PersonalKarmicAffliction[] {
  const results: PersonalKarmicAffliction[] = [];

  const targetHouses: Array<{ label: PersonalKarmicAffliction['afflicts'][number]; sign: SignNumber }> = [
    { label: '1st house', sign: ascSign },
    { label: '7th house', sign: signOfHouse(7, ascSign) },
    { label: '9th house', sign: signOfHouse(9, ascSign) },
  ];

  const targetPlanets: Array<{ label: PersonalKarmicAffliction['afflicts'][number]; planet: string }> = [
    { label: '1st lord', planet: targets.lagnaLord },
    { label: '7th lord', planet: targets.seventhLord },
    { label: '9th lord', planet: targets.ninthLord },
    { label: 'moon', planet: targets.moon },
    { label: 'sun', planet: targets.sun },
  ];
  if (targets.atmakaraka !== 'None') {
    targetPlanets.push({ label: 'atmakaraka', planet: targets.atmakaraka });
  }

  for (const pointName of UPAGRAHAS) {
    const point = positions.find((p) => p.name === pointName);
    if (!point) continue;

    const pointSign = (RASHIS.indexOf(point.rashi) + 1) as SignNumber;
    const pointHouse = point.house ?? houseOfSign(pointSign, ascSign);
    const afflicts: PersonalKarmicAffliction['afflicts'] = [];
    let severity: 'mild' | 'significant' | 'none' = 'none';

    for (const { label, sign } of targetHouses) {
      if (pointSign === sign) {
        afflicts.push(label);
        severity = 'significant';
      }
    }

    for (const { label, planet } of targetPlanets) {
      const lordPos = positions.find((p) => p.name === planet);
      if (lordPos && RASHIS.indexOf(lordPos.rashi) + 1 === pointSign) {
        afflicts.push(label);
        severity = 'significant';
      }
    }

    const seventhAspectSign = seventhFromSign(pointSign);
    for (const { label, sign } of targetHouses) {
      if (seventhAspectSign === sign) {
        if (!afflicts.includes(label)) afflicts.push(label);
        if (severity !== 'significant') severity = 'mild';
      }
    }

    for (const { label, planet } of targetPlanets) {
      const lordPos = positions.find((p) => p.name === planet);
      if (
        lordPos &&
        angularDistance(point.siderealLongitude, lordPos.siderealLongitude) <= 5
      ) {
        if (!afflicts.includes(label)) afflicts.push(label);
        severity = 'significant';
      }
    }

    if (severity !== 'none' && afflicts.length > 0) {
      results.push({
        point: pointName,
        chart,
        sign: point.rashi,
        house: pointHouse,
        afflicts: [...new Set(afflicts)],
        severity,
      });
    }
  }

  return results;
}

function findDusthanaAspectAfflictions(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  keyPlanets: Array<{ planet: string; role: DusthanaAffliction['role'] }>,
): DusthanaAspectAffliction[] {
  const results: DusthanaAspectAffliction[] = [];
  const dusthanaOccupants = positions.filter(
    (p) =>
      GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
      p.house &&
      DUSTHANA_HOUSES.includes(p.house as (typeof DUSTHANA_HOUSES)[number]),
  );

  for (const { planet, role } of keyPlanets) {
    const keyPos = positions.find((p) => p.name === planet);
    if (!keyPos) continue;
    const keySign = keyPos.rashi;

    for (const occupant of dusthanaOccupants) {
      const drishti = calculateDrishti(occupant.name, positions);
      if (drishti.aspectedRashis.includes(keySign)) {
        results.push({
          planet,
          role,
          aspectedBy: occupant.name,
          fromDusthana: occupant.house as 6 | 8 | 12,
        });
      }
    }
  }

  return results;
}

export function buildShadowAnalysis(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  lagnaLord: string,
  atmakaraka: string,
): ShadowAnalysis {
  const keyPlanets: Array<{ planet: string; role: DusthanaAffliction['role'] }> = [
    { planet: lagnaLord, role: 'lagnaLord' },
    { planet: 'Moon', role: 'moon' },
    { planet: 'Sun', role: 'sun' },
  ];
  if (atmakaraka !== 'None') {
    keyPlanets.push({ planet: atmakaraka, role: 'atmakaraka' });
  }

  const dusthanaAfflictions: DusthanaAffliction[] = [];
  for (const { planet, role } of keyPlanets) {
    const pos = positions.find((p) => p.name === planet);
    if (!pos?.house) continue;
    if (DUSTHANA_HOUSES.includes(pos.house as (typeof DUSTHANA_HOUSES)[number])) {
      dusthanaAfflictions.push({
        planet,
        role,
        house: pos.house,
        dusthana: pos.house as 6 | 8 | 12,
      });
    }
  }

  const dusthanaAspectAfflictions = findDusthanaAspectAfflictions(positions, ascSign, keyPlanets);

  const seventhLord = getRashiLord(signName(signOfHouse(7, ascSign)));
  const ninthLord = getRashiLord(signName(signOfHouse(9, ascSign)));

  const karmicTargets = {
    lagnaLord,
    seventhLord,
    ninthLord,
    moon: 'Moon',
    sun: 'Sun',
    atmakaraka,
  };

  const karmicD1 = checkPersonalKarmicAfflictions(positions, ascSign, karmicTargets, 'D1');

  const d9 = computeDivisionalChart(positions, 'D9');
  const d9AscPos = d9.positions.find((p) => p.name === 'Ascendant');
  const d9Asc = d9AscPos
    ? ((RASHIS.indexOf(d9AscPos.rashi) + 1) as SignNumber)
    : ascSign;
  const d9SeventhLord = getRashiLord(signName(signOfHouse(7, d9Asc)));
  const d9NinthLord = getRashiLord(signName(signOfHouse(9, d9Asc)));
  const karmicD9 = checkPersonalKarmicAfflictions(
    d9.positions,
    d9Asc,
    { ...karmicTargets, seventhLord: d9SeventhLord, ninthLord: d9NinthLord },
    'D9',
  );

  const karmic = [...karmicD1, ...karmicD9];

  const rahu = positions.find((p) => p.name === 'Rahu');
  const ketu = positions.find((p) => p.name === 'Ketu');

  return {
    dusthanaAfflictions,
    dusthanaAspectAfflictions,
    saturn: analyzeSaturnShadow(positions, ascSign),
    rahuHouse: rahu?.house ?? 0,
    ketuHouse: ketu?.house ?? 0,
    karmic,
  };
}
