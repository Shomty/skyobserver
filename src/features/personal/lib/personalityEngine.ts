import {
  calculateDrishti,
  getDignity,
  getRashiLord,
  NAKSHATRA_DATA,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import {
  classifyNetInfluence,
  DUSTHANA_HOUSES,
  GRAHAS,
  houseOfSign,
  isDebilitated,
  NATURAL_BENEFICS,
  NATURAL_MALEFICS,
  signElement,
  signGuna,
  signName,
} from './personalConstants';
import { nakshatraFromLongitude } from '../../career/lib/nakshatraEngine';

export interface PlanetSnapshot {
  planet: string;
  sign: string;
  house: number;
  dignity: string | null;
  isRetrograde: boolean;
  isCombust: boolean;
  nakshatra?: string;
  nakshatraLord?: string;
}

export interface LagnaAnalysis extends PlanetSnapshot {
  element: string;
  guna: string;
  lord: string;
  lordHouse: number;
  lordSign: string;
  lordDignity: string | null;
}

export interface StrengthEntry {
  planet: string;
  reason: 'exalted' | 'own' | 'mooltrikona' | 'vargottama';
  house: number;
}

export interface BlindSpotEntry {
  planet: string;
  reasons: Array<'debilitated' | 'combust' | 'retrograde' | 'dusthana'>;
  house: number;
}

export interface PersonalityWheelAnalysis {
  lagna: LagnaAnalysis;
  moon: PlanetSnapshot;
  sun: PlanetSnapshot;
  /** How the three layers relate — interpretive synthesis tag. */
  alignment: 'aligned' | 'tension' | 'mixed';
  strengths: StrengthEntry[];
  blindSpots: BlindSpotEntry[];
}

function dignityKind(dignity: string | null): StrengthEntry['reason'] | null {
  if (!dignity) return null;
  const d = dignity.toLowerCase();
  if (d.includes('exalt')) return 'exalted';
  if (d.includes('moolat')) return 'mooltrikona';
  if (d.includes('own')) return 'own';
  return null;
}

function analyzeGraha(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  planetName: string,
): PlanetSnapshot {
  const pos = positions.find((p) => p.name === planetName);
  if (!pos) throw new Error(`${planetName} not found in positions`);

  const signNumber = (RASHIS.indexOf(pos.rashi) + 1) as SignNumber;
  const house = pos.house ?? houseOfSign(signNumber, ascSign);
  const dignity = getDignity(planetName, RASHIS.indexOf(pos.rashi)) ?? null;
  const nak = nakshatraFromLongitude(pos.siderealLongitude);

  return {
    planet: planetName,
    sign: pos.rashi,
    house,
    dignity,
    isRetrograde: pos.isRetrograde,
    isCombust: pos.isCombust,
    nakshatra: nak.name,
    nakshatraLord: NAKSHATRA_DATA[nak.name]?.lord,
  };
}

function resolveAlignment(lagna: LagnaAnalysis, moon: PlanetSnapshot, sun: PlanetSnapshot): PersonalityWheelAnalysis['alignment'] {
  const signs = new Set([lagna.sign, moon.sign, sun.sign]);
  if (signs.size === 1) return 'aligned';
  if (signs.size === 3) return 'tension';
  return 'mixed';
}

export function buildPersonalityWheel(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  vargottamaPlanets: string[],
): PersonalityWheelAnalysis {
  const lagnaSign = signName(ascSign);
  const lagnaLord = getRashiLord(lagnaSign);
  const lordPos = positions.find((p) => p.name === lagnaLord);
  if (!lordPos) throw new Error(`Lagna lord ${lagnaLord} not found`);

  const lordSignNumber = (RASHIS.indexOf(lordPos.rashi) + 1) as SignNumber;
  const lordHouse = lordPos.house ?? houseOfSign(lordSignNumber, ascSign);

  const lagna: LagnaAnalysis = {
    planet: 'Ascendant',
    sign: lagnaSign,
    house: 1,
    dignity: null,
    isRetrograde: false,
    isCombust: false,
    element: signElement(ascSign),
    guna: signGuna(ascSign),
    lord: lagnaLord,
    lordHouse,
    lordSign: lordPos.rashi,
    lordDignity: getDignity(lagnaLord, RASHIS.indexOf(lordPos.rashi)) ?? null,
  };

  const moon = analyzeGraha(positions, ascSign, 'Moon');
  const sun = analyzeGraha(positions, ascSign, 'Sun');

  const strengths: StrengthEntry[] = [];
  const blindSpots: BlindSpotEntry[] = [];

  for (const planet of GRAHAS) {
    const snap = analyzeGraha(positions, ascSign, planet);
    const kind = dignityKind(snap.dignity);
    if (kind) {
      strengths.push({ planet, reason: kind, house: snap.house });
    }
    if (vargottamaPlanets.includes(planet)) {
      strengths.push({ planet, reason: 'vargottama', house: snap.house });
    }

    const reasons: BlindSpotEntry['reasons'] = [];
    if (isDebilitated(snap.dignity)) reasons.push('debilitated');
    if (snap.isCombust) reasons.push('combust');
    if (snap.isRetrograde) reasons.push('retrograde');
    if (DUSTHANA_HOUSES.includes(snap.house as (typeof DUSTHANA_HOUSES)[number])) {
      reasons.push('dusthana');
    }
    if (reasons.length > 0) {
      blindSpots.push({ planet, reasons, house: snap.house });
    }
  }

  return {
    lagna,
    moon,
    sun,
    alignment: resolveAlignment(lagna, moon, sun),
    strengths,
    blindSpots,
  };
}

/** Benefic/malefic influence on a house sign from occupants and aspects. */
export function houseInfluence(
  positions: PlanetPosition[],
  houseSignNumber: SignNumber,
): {
  netInfluence: 'benefic' | 'malefic' | 'mixed' | 'none';
  occupants: string[];
  aspecting: string[];
} {
  const sign = signName(houseSignNumber);
  const occupants = positions
    .filter(
      (p) =>
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        RASHIS.indexOf(p.rashi) + 1 === houseSignNumber,
    )
    .map((p) => p.name);

  const aspecting: string[] = [];
  for (const p of positions.filter((x) => GRAHAS.includes(x.name as (typeof GRAHAS)[number]))) {
    const drishti = calculateDrishti(p.name, positions);
    if (drishti.aspectedRashis.includes(sign)) aspecting.push(p.name);
  }

  const influencers = [...occupants, ...aspecting];
  const beneficCount = influencers.filter((n) => NATURAL_BENEFICS.has(n)).length;
  const maleficCount = influencers.filter((n) => NATURAL_MALEFICS.has(n)).length;

  return {
    netInfluence: classifyNetInfluence(beneficCount, maleficCount),
    occupants,
    aspecting,
  };
}
