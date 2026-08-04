import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import {
  calculateDrishti,
  getDignity,
  getRashiLord,
  KENDRA_HOUSES,
  KONA_HOUSES,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import {
  GRAHAS,
  houseOfSign,
  isDebilitated,
  isStrongDignity,
  resolvePlacementClass,
  signName,
  signOfHouse,
  UPACHAYA_HOUSES,
  type PlacementClass,
} from './careerConstants';
import { checkD10KarmicAfflictions, summarizeKarmicDelay } from './karmicChecks';

export interface D10LagnaAnalysis {
  lagnaSign: string;
  lagnaSignNumber: SignNumber;
  lagnaLord: string;
  lagnaLordHouse: number;
  lagnaLordSign: string;
  lagnaLordDignity: string | null;
  placementClass: PlacementClass;
  executionCapacity: 'strong' | 'moderate' | 'constrained';
}

export interface D10TenthAnalysis {
  sign: string;
  occupants: string[];
  aspectingPlanets: string[];
  lord: string;
  lordHouse: number;
  lordSign: string;
  lordDignity: string | null;
  lordPlacementClass: PlacementClass;
  authorityMedium: string;
}

export interface D10AmkAnalysis {
  planet: string | null;
  house: number;
  sign: string;
  connectsKendra: boolean;
  connectsTrikona: boolean;
  connectsTenth: boolean;
  alignment: 'aligned' | 'indirect' | 'unaligned';
}

export interface D10UpachayaAnalysis {
  occupants: Array<{ planet: string; house: 3 | 6 | 10 | 11; dignity: string | null; isStrong: boolean }>;
  strongCount: number;
  growthProfile: 'compounding' | 'steady' | 'effortful';
}

/** [HEURISTIC] Channel through which D10 10th-lord authority arrives. */
export const AUTHORITY_MEDIUM_BY_HOUSE: Record<number, string> = {
  1: 'Personal identity and direct visibility; the native is the brand',
  2: 'Earned income, family enterprise, voice/communication-based standing',
  3: 'Initiative, media, short travel, sales and self-promotion',
  4: 'Institutions, property, home-based or education-adjacent work',
  5: 'Creative output, advisory/consulting, speculation, teaching',
  6: 'Service, competition, litigation, health, employment-under-others',
  7: 'Partnership, client-facing work, contracts, markets abroad',
  8: 'Research, crisis work, other people\'s resources, insurance, occult',
  9: 'Advisory, law, higher education, publishing, long-distance work',
  10: 'Direct authority, government, executive command',
  11: 'Networks, large organisations, gains through groups',
  12: 'Foreign settings, isolation, behind-the-scenes, spiritual or confinement institutions',
};

function resolveExecutionCapacity(
  placementClass: PlacementClass,
  dignity: string | null,
): D10LagnaAnalysis['executionCapacity'] {
  if (
    (placementClass === 'kendra' || placementClass === 'kona') &&
    isStrongDignity(dignity)
  ) {
    return 'strong';
  }
  if (placementClass === 'dusthana' || isDebilitated(dignity)) return 'constrained';
  if (placementClass === 'kendra' || placementClass === 'kona' || placementClass === 'upachaya') {
    return 'moderate';
  }
  return 'moderate';
}

export function buildD10Analysis(
  positions: PlanetPosition[],
  amatyakaraka: string | null,
): {
  lagna: D10LagnaAnalysis;
  tenth: D10TenthAnalysis;
  amk: D10AmkAnalysis;
  upachaya: D10UpachayaAnalysis;
  karmicDelay: 'none' | 'mild' | 'significant';
  karmicAfflictions: ReturnType<typeof checkD10KarmicAfflictions>;
} {
  const d10 = computeDivisionalChart(positions, 'D10');
  const d10Positions = d10.positions;
  const d10Asc = d10Positions.find((p) => p.name === 'Ascendant');
  const d10AscSign = d10Asc
    ? ((RASHIS.indexOf(d10Asc.rashi) + 1) as SignNumber)
    : (1 as SignNumber);

  // Every house in this module is counted from the D10 lagna, never the D1 lagna.
  const d10House = (p: PlanetPosition): number =>
    p.house ?? houseOfSign((RASHIS.indexOf(p.rashi) + 1) as SignNumber, d10AscSign);

  const lagnaLord = getRashiLord(signName(d10AscSign));
  const lagnaLordPos = d10Positions.find((p) => p.name === lagnaLord);
  if (!lagnaLordPos) throw new Error(`D10 lagna lord ${lagnaLord} not found`);
  const lagnaLordHouse = d10House(lagnaLordPos);
  const lagnaLordDignity = getDignity(lagnaLord, RASHIS.indexOf(lagnaLordPos.rashi)) ?? null;
  const lagnaPlacement = resolvePlacementClass(lagnaLordHouse);

  const tenthSignNumber = signOfHouse(10, d10AscSign);
  const tenthSign = signName(tenthSignNumber);
  const tenthLord = getRashiLord(tenthSign);
  const tenthLordPos = d10Positions.find((p) => p.name === tenthLord);
  if (!tenthLordPos) throw new Error(`D10 10th lord ${tenthLord} not found`);

  const occupants = d10Positions
    .filter(
      (p) =>
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        RASHIS.indexOf(p.rashi) + 1 === tenthSignNumber,
    )
    .map((p) => p.name);

  const aspectingPlanets: string[] = [];
  for (const p of d10Positions.filter((x) => GRAHAS.includes(x.name as (typeof GRAHAS)[number]))) {
    const drishti = calculateDrishti(p.name, d10Positions);
    if (drishti.aspectedRashis.includes(tenthSign)) aspectingPlanets.push(p.name);
  }

  const lordHouse = d10House(tenthLordPos);
  const upachayaOccupants = d10Positions
    .filter(
      (p) =>
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        UPACHAYA_HOUSES.includes(d10House(p) as (typeof UPACHAYA_HOUSES)[number]),
    )
    .map((p) => {
      const dignity = getDignity(p.name, RASHIS.indexOf(p.rashi)) ?? null;
      const isStrong =
        isStrongDignity(dignity) || ['Mars', 'Saturn', 'Rahu'].includes(p.name);
      return {
        planet: p.name,
        house: d10House(p) as 3 | 6 | 10 | 11,
        dignity,
        isStrong,
      };
    });

  const strongCount = upachayaOccupants.filter((o) => o.isStrong).length;
  let growthProfile: D10UpachayaAnalysis['growthProfile'] = 'effortful';
  if (strongCount >= 3) growthProfile = 'compounding';
  else if (strongCount >= 1) growthProfile = 'steady';

  const amkPos = amatyakaraka
    ? d10Positions.find((p) => p.name === amatyakaraka)
    : undefined;
  // 0 means "no Amatyakaraka resolved", never "house 1".
  const amkHouse = amkPos ? d10House(amkPos) : 0;
  const connectsKendra = KENDRA_HOUSES.includes(amkHouse);
  const connectsTrikona = KONA_HOUSES.includes(amkHouse);
  const amkDignity = amkPos ? getDignity(amatyakaraka!, RASHIS.indexOf(amkPos.rashi)) ?? null : null;

  let connectsTenth = amkHouse === 10;
  if (amatyakaraka === tenthLord) connectsTenth = true;
  if (amkPos && amkPos.rashi === tenthSign) connectsTenth = true;
  if (amatyakaraka) {
    const drishti = calculateDrishti(amatyakaraka, d10Positions);
    if (drishti.aspectedRashis.includes(tenthSign)) connectsTenth = true;
  }

  let alignment: D10AmkAnalysis['alignment'] = 'unaligned';
  if (connectsTenth || ((connectsKendra || connectsTrikona) && !isDebilitated(amkDignity))) {
    alignment = 'aligned';
  } else if (connectsKendra || connectsTrikona) {
    alignment = 'indirect';
  }

  const karmicAfflictions = checkD10KarmicAfflictions(d10Positions, d10AscSign, amatyakaraka);

  return {
    lagna: {
      lagnaSign: signName(d10AscSign),
      lagnaSignNumber: d10AscSign,
      lagnaLord,
      lagnaLordHouse,
      lagnaLordSign: lagnaLordPos.rashi,
      lagnaLordDignity,
      placementClass: lagnaPlacement,
      executionCapacity: resolveExecutionCapacity(lagnaPlacement, lagnaLordDignity),
    },
    tenth: {
      sign: tenthSign,
      occupants,
      aspectingPlanets,
      lord: tenthLord,
      lordHouse,
      lordSign: tenthLordPos.rashi,
      lordDignity: getDignity(tenthLord, RASHIS.indexOf(tenthLordPos.rashi)) ?? null,
      lordPlacementClass: resolvePlacementClass(lordHouse),
      authorityMedium: AUTHORITY_MEDIUM_BY_HOUSE[lordHouse] ?? 'Professional expression',
    },
    amk: {
      planet: amatyakaraka,
      house: amkHouse,
      sign: amkPos?.rashi ?? '',
      connectsKendra,
      connectsTrikona,
      connectsTenth,
      alignment,
    },
    upachaya: {
      occupants: upachayaOccupants,
      strongCount,
      growthProfile,
    },
    karmicDelay: summarizeKarmicDelay(karmicAfflictions),
    karmicAfflictions,
  };
}
