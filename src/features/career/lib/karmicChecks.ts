import { getRashiLord, RASHIS, type PlanetPosition, type SignNumber } from '../../../vedic-utils';
import { houseOfSign, signName, signOfHouse } from './careerConstants';

export interface KarmicAffliction {
  point: 'Gulika' | 'Maandi';
  sign: string;
  house: number;
  afflicts: Array<
    | '10th house'
    | '1st house'
    | '5th house'
    | '10th lord'
    | '1st lord'
    | '5th lord'
    | 'amatyakaraka'
  >;
  severity: 'mild' | 'significant';
}

const UPAGRAHAS = ['Gulika', 'Maandi'] as const;

export type UpagrahaName = (typeof UPAGRAHAS)[number];

/** [HEURISTIC] Orb inside which an upagraha is treated as sitting on a planet. */
export const UPAGRAHA_CONJUNCTION_ORB_DEG = 5;

function angularDistance(lon1: number, lon2: number): number {
  const diff = Math.abs(lon1 - lon2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function seventhFromSign(signNumber: SignNumber): SignNumber {
  return signOfHouse(7, signNumber);
}

/**
 * Whether `planet` personally carries the friction of `point` — same sign,
 * within orb, or under the point's full (7th-from) drishti.
 *
 * Deliberately per-planet: a Gulika sitting on the 10th house afflicts the
 * house, not every graha in the chart, so a dasha lord only takes the karmic
 * penalty when the point actually touches it.
 */
export function isUpagrahaAssociated(
  point: UpagrahaName,
  planet: string,
  positions: PlanetPosition[],
): boolean {
  const pointPos = positions.find((p) => p.name === point);
  const planetPos = positions.find((p) => p.name === planet);
  if (!pointPos || !planetPos) return false;

  const pointSign = (RASHIS.indexOf(pointPos.rashi) + 1) as SignNumber;
  const planetSign = (RASHIS.indexOf(planetPos.rashi) + 1) as SignNumber;
  if (pointSign === planetSign) return true;
  if (seventhFromSign(pointSign) === planetSign) return true;

  return (
    angularDistance(pointPos.siderealLongitude, planetPos.siderealLongitude) <=
    UPAGRAHA_CONJUNCTION_ORB_DEG
  );
}

export function checkKarmicAfflictions(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  targets: { tenthLord: string; lagnaLord: string; fifthLord: string },
): KarmicAffliction[] {
  const results: KarmicAffliction[] = [];

  const firstHouseSign = ascSign;
  const fifthHouseSign = signOfHouse(5, ascSign);
  const tenthHouseSign = signOfHouse(10, ascSign);

  const targetHouses: Array<{ label: KarmicAffliction['afflicts'][number]; sign: SignNumber }> = [
    { label: '1st house', sign: firstHouseSign },
    { label: '5th house', sign: fifthHouseSign },
    { label: '10th house', sign: tenthHouseSign },
  ];

  const targetLords: Array<{ label: KarmicAffliction['afflicts'][number]; planet: string }> = [
    { label: '1st lord', planet: targets.lagnaLord },
    { label: '5th lord', planet: targets.fifthLord },
    { label: '10th lord', planet: targets.tenthLord },
  ];

  for (const pointName of UPAGRAHAS) {
    const point = positions.find((p) => p.name === pointName);
    if (!point) continue;

    const pointSign = (RASHIS.indexOf(point.rashi) + 1) as SignNumber;
    const pointHouse = point.house ?? houseOfSign(pointSign, ascSign);
    const afflicts: KarmicAffliction['afflicts'] = [];
    let severity: 'mild' | 'significant' | 'none' = 'none';

    for (const { label, sign } of targetHouses) {
      if (pointSign === sign) {
        afflicts.push(label);
        severity = 'significant';
      }
    }

    for (const { label, planet } of targetLords) {
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

    for (const { label, planet } of targetLords) {
      const lordPos = positions.find((p) => p.name === planet);
      if (
        lordPos &&
        angularDistance(point.siderealLongitude, lordPos.siderealLongitude) <=
          UPAGRAHA_CONJUNCTION_ORB_DEG
      ) {
        if (!afflicts.includes(label)) afflicts.push(label);
        severity = 'significant';
      }
    }

    if (severity !== 'none' && afflicts.length > 0) {
      results.push({
        point: pointName,
        sign: point.rashi,
        house: pointHouse,
        afflicts: [...new Set(afflicts)],
        severity,
      });
    }
  }

  return results;
}

export function summarizeKarmicDelay(afflictions: KarmicAffliction[]): 'none' | 'mild' | 'significant' {
  if (afflictions.length === 0) return 'none';
  if (afflictions.some((a) => a.severity === 'significant')) return 'significant';
  return 'mild';
}

export function checkD10KarmicAfflictions(
  d10Positions: PlanetPosition[],
  d10AscSign: SignNumber,
  amatyakaraka: string | null,
): KarmicAffliction[] {
  const tenthLord = getRashiLord(signName(signOfHouse(10, d10AscSign)));
  const lagnaLord = getRashiLord(signName(d10AscSign));
  const targets = {
    tenthLord,
    lagnaLord,
    fifthLord: getRashiLord(signName(signOfHouse(5, d10AscSign))),
  };

  const base = checkKarmicAfflictions(d10Positions, d10AscSign, targets);

  if (!amatyakaraka) return base;

  const extra: KarmicAffliction[] = [];
  for (const pointName of UPAGRAHAS) {
    const point = d10Positions.find((p) => p.name === pointName);
    if (!point) continue;
    const amkPos = d10Positions.find((p) => p.name === amatyakaraka);
    if (!amkPos) continue;

    const pointSign = (RASHIS.indexOf(point.rashi) + 1) as SignNumber;
    const amkSign = (RASHIS.indexOf(amkPos.rashi) + 1) as SignNumber;
    const sameSign = pointSign === amkSign;
    const withinOrb =
      angularDistance(point.siderealLongitude, amkPos.siderealLongitude) <=
      UPAGRAHA_CONJUNCTION_ORB_DEG;
    const aspected = seventhFromSign(pointSign) === amkSign;

    if (!sameSign && !withinOrb && !aspected) continue;

    extra.push({
      point: pointName,
      sign: point.rashi,
      house: point.house ?? houseOfSign(pointSign, d10AscSign),
      afflicts: ['amatyakaraka'],
      severity: sameSign || withinOrb ? 'significant' : 'mild',
    });
  }

  return [...base, ...extra];
}
