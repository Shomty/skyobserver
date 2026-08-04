import {
  calculateAshtakavarga,
  calculateDrishti,
  detectMahapurushaYogas,
  getRashiLord,
  KENDRA_HOUSES,
  KONA_HOUSES,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import type { CareerScore } from '../types';

const BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
const MALEFICS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun']);
const UPACHAYA_HOUSES = [3, 6, 10, 11];
const DUSTHANA_HOUSES = [6, 8, 12];

function dignityPoints(dignity?: string): number {
  if (!dignity) return 10;
  const d = dignity.toLowerCase();
  if (d.includes('exalt')) return 25;
  if (d.includes('own')) return 20;
  if (d.includes('friend')) return 15;
  if (d.includes('debil') || d.includes('enemy')) return 5;
  return 10;
}

function housePlacementPoints(house: number): number {
  if (KENDRA_HOUSES.includes(house) || KONA_HOUSES.includes(house)) return 20;
  if (UPACHAYA_HOUSES.includes(house)) return 14;
  if (DUSTHANA_HOUSES.includes(house)) return 6;
  return 10;
}

function savPoints(sav10: number): number {
  // SAV bindus in 10th, normalized around the classical mean of 28.
  const ratio = sav10 / 28;
  return Math.round(Math.min(30, Math.max(0, ratio * 30)));
}

function aspectsTenthHouse(planetName: string, positions: PlanetPosition[]): boolean {
  const drishti = calculateDrishti(planetName, positions);
  return drishti.aspectedHouses.some((h) => h.house === 10);
}

function beneficInfluenceOn10th(positions: PlanetPosition[], tenthSign: string): number {
  let score = 0;
  for (const p of positions) {
    if (p.name === 'Ascendant') continue;
    if (p.rashi === tenthSign && BENEFICS.has(p.name)) score += 8;
    if (aspectsTenthHouse(p.name, positions) && BENEFICS.has(p.name)) score += 4;
  }
  return Math.min(15, score);
}

function afflictionPenalty(tenthLord: PlanetPosition, positions: PlanetPosition[], tenthSign: string): number {
  let penalty = 0;
  if (tenthLord.isCombust) penalty += 4;
  if (tenthLord.isRetrograde && tenthLord.dignity?.toLowerCase().includes('debil')) penalty += 4;

  for (const p of positions) {
    if (!MALEFICS.has(p.name)) continue;
    if (aspectsTenthHouse(p.name, positions)) penalty += 2;
    if (p.rashi === tenthSign) penalty += 2;
  }
  return Math.min(10, penalty);
}

/** Composite 10th-house strength — each component weighted per career-report-plan. */
export function computeTenthHouseStrength(
  positions: PlanetPosition[],
  ascendantSign: SignNumber,
  tenthSign: string,
  tenthLord: PlanetPosition,
): CareerScore {
  const tenthSignIndex = RASHIS.indexOf(tenthSign);
  const sav = calculateAshtakavarga(positions).sav[tenthSignIndex] ?? 25;

  const raw =
    savPoints(sav) +
    dignityPoints(tenthLord.dignity) +
    housePlacementPoints(tenthLord.house ?? 1) +
    beneficInfluenceOn10th(positions, tenthSign) -
    afflictionPenalty(tenthLord, positions, tenthSign);

  return {
    label: '10th House Strength',
    value: Math.round(Math.min(100, Math.max(0, raw))),
  };
}

function planetLeadershipContribution(planet: PlanetPosition | undefined): number {
  if (!planet) return 0;
  let pts = 0;
  const house = planet.house ?? 0;
  if (KENDRA_HOUSES.includes(house) || house === 10) pts += 15;
  else if (KONA_HOUSES.includes(house)) pts += 10;
  else if (UPACHAYA_HOUSES.includes(house)) pts += 8;
  pts += dignityPoints(planet.dignity) * 0.6;
  return pts;
}

/** Sun + Mars dignity/house, 1st/10th lord link, Mahapurusha on Sun/Mars. */
export function computeLeadership(
  positions: PlanetPosition[],
  ascendantSign: SignNumber,
  tenthLordName: string,
): CareerScore {
  const sun = positions.find((p) => p.name === 'Sun');
  const mars = positions.find((p) => p.name === 'Mars');
  const lagnaLord = getRashiLord(RASHIS[ascendantSign - 1]);

  let raw = planetLeadershipContribution(sun) + planetLeadershipContribution(mars);

  if (lagnaLord === tenthLordName) raw += 12;
  else {
    const lagnaLordPos = positions.find((p) => p.name === lagnaLord);
    const tenthLordPos = positions.find((p) => p.name === tenthLordName);
    if (lagnaLordPos && tenthLordPos && lagnaLordPos.rashi === tenthLordPos.rashi) raw += 8;
  }

  const mahapurusha = detectMahapurushaYogas(positions, ascendantSign);
  if (mahapurusha.some((y) => y.planetsInvolved.includes('Sun') || y.planetsInvolved.includes('Mars'))) {
    raw += 10;
  }

  return {
    label: 'Leadership Potential',
    value: Math.round(Math.min(100, Math.max(0, raw))),
  };
}

/** Computed for the gated card — not shown in the free tier. */
export function computeCareerDrive(
  positions: PlanetPosition[],
  tenthLord: PlanetPosition,
  amatyakaraka: string | null,
): CareerScore {
  let raw = housePlacementPoints(tenthLord.house ?? 1) + dignityPoints(tenthLord.dignity);

  const amk = amatyakaraka ? positions.find((p) => p.name === amatyakaraka) : undefined;
  if (amk) {
    raw += planetLeadershipContribution(amk) * 0.8;
    if (KENDRA_HOUSES.includes(amk.house ?? 0) || amk.house === 10) raw += 10;
  }

  const mars = positions.find((p) => p.name === 'Mars');
  const saturn = positions.find((p) => p.name === 'Saturn');
  raw += planetLeadershipContribution(mars) * 0.5;
  raw += planetLeadershipContribution(saturn) * 0.4;

  return {
    label: 'Career Drive',
    value: Math.round(Math.min(100, Math.max(0, raw))),
    locked: true,
  };
}
