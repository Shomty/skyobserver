import {
  calculateDrishti,
  calculateSudarshanaActiveHouse,
  calculateSudarshanaChakra,
  getRashiLord,
  type PlanetPosition,
  type SudarshanaChakraResult,
  type SignNumber,
} from '../../../vedic-utils';
import {
  classifyNetInfluence,
  GRAHAS,
  NATURAL_BENEFICS,
  NATURAL_MALEFICS,
  lifeAreaForHouse,
  signName,
} from './personalConstants';

export type TriangulatedHouse = 1 | 2 | 7 | 11;

export interface RingHouseDetail {
  occupants: string[];
  aspecting: string[];
  lord: string;
  influence: 'benefic' | 'malefic' | 'mixed' | 'none';
}

export interface HouseTriangulation {
  house: TriangulatedHouse;
  lifeArea: string;
  lagna: RingHouseDetail;
  chandra: RingHouseDetail;
  surya: RingHouseDetail;
  agreement: 'strength' | 'affliction' | 'mixed' | 'neutral';
}

export interface SudarshanaPersonalAnalysis {
  activeHouse: number;
  activeLifeArea: string;
  age: number;
  triangulation: HouseTriangulation[];
  activeYear: {
    house: number;
    lifeArea: string;
    lagna: RingHouseDetail;
    chandra: RingHouseDetail;
    surya: RingHouseDetail;
  };
}

function signForHouseInRing(referenceSignIndex: number, house: number): SignNumber {
  return (((referenceSignIndex + house - 1) % 12) + 1) as SignNumber;
}

function influencersInfluence(occupants: string[], aspecting: string[]): RingHouseDetail['influence'] {
  const influencers = [...occupants, ...aspecting];
  const beneficCount = influencers.filter((n) => NATURAL_BENEFICS.has(n)).length;
  const maleficCount = influencers.filter((n) => NATURAL_MALEFICS.has(n)).length;
  return classifyNetInfluence(beneficCount, maleficCount);
}

function ringHouseDetail(
  chakra: SudarshanaChakraResult['lagnaChakra'],
  house: number,
  allPositions: PlanetPosition[],
): RingHouseDetail {
  const occupants = (chakra.houses[house]?.planets ?? [])
    .filter((p) => GRAHAS.includes(p.name as (typeof GRAHAS)[number]))
    .map((p) => p.name);

  const signNumber = signForHouseInRing(chakra.referenceSignIndex, house);
  const sign = signName(signNumber);
  const lord = getRashiLord(sign);

  const aspecting: string[] = [];
  for (const p of allPositions.filter((x) => GRAHAS.includes(x.name as (typeof GRAHAS)[number]))) {
    const drishti = calculateDrishti(p.name, allPositions);
    if (drishti.aspectedRashis.includes(sign)) aspecting.push(p.name);
  }

  return {
    occupants,
    aspecting,
    lord,
    influence: influencersInfluence(occupants, aspecting),
  };
}

function resolveAgreement(
  lagna: RingHouseDetail['influence'],
  chandra: RingHouseDetail['influence'],
  surya: RingHouseDetail['influence'],
): HouseTriangulation['agreement'] {
  const influences = [lagna, chandra, surya];
  if (influences.every((i) => i === 'benefic')) return 'strength';
  if (influences.every((i) => i === 'malefic')) return 'affliction';
  if (influences.some((i) => i === 'benefic') && influences.some((i) => i === 'malefic')) {
    return 'mixed';
  }
  return 'neutral';
}

function computeAge(birthDate: Date, now: Date): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function buildSudarshanaAnalysis(
  positions: PlanetPosition[],
  birthDate: Date,
  now: Date,
): SudarshanaPersonalAnalysis {
  const chakra = calculateSudarshanaChakra(positions);
  const age = computeAge(birthDate, now);
  const activeHouse = calculateSudarshanaActiveHouse(age);

  const triangulatedHouses: TriangulatedHouse[] = [1, 7, 2, 11];
  const triangulation: HouseTriangulation[] = triangulatedHouses.map((house) => {
    const lagna = ringHouseDetail(chakra.lagnaChakra, house, positions);
    const chandra = ringHouseDetail(chakra.chandraChakra, house, positions);
    const surya = ringHouseDetail(chakra.suryaChakra, house, positions);
    return {
      house,
      lifeArea: lifeAreaForHouse(house),
      lagna,
      chandra,
      surya,
      agreement: resolveAgreement(lagna.influence, chandra.influence, surya.influence),
    };
  });

  return {
    activeHouse,
    activeLifeArea: lifeAreaForHouse(activeHouse),
    age,
    triangulation,
    activeYear: {
      house: activeHouse,
      lifeArea: lifeAreaForHouse(activeHouse),
      lagna: ringHouseDetail(chakra.lagnaChakra, activeHouse, positions),
      chandra: ringHouseDetail(chakra.chandraChakra, activeHouse, positions),
      surya: ringHouseDetail(chakra.suryaChakra, activeHouse, positions),
    },
  };
}
