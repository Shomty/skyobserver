import {
  calculateArudhaLagna,
  calculateCharakarakas,
  calculateDrishti,
  getDignity,
  getRashiLord,
  getVargottamaPlanets,
  NAKSHATRA_DATA,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import {
  classifyNetInfluence,
  EXCLUDED_OCCUPANTS,
  GRAHAS,
  houseOfSign,
  NATURAL_BENEFICS,
  NATURAL_MALEFICS,
  resolvePlacementClass,
  signName,
  signOfHouse,
  type NetInfluence,
  type PlacementClass,
} from './careerConstants';
import { nakshatraFromLongitude } from './nakshatraEngine';

export interface TenthHouseAnalysis {
  sign: string;
  signNumber: SignNumber;
  occupants: string[];
  aspectingPlanets: string[];
  beneficInfluenceCount: number;
  maleficInfluenceCount: number;
  netInfluence: NetInfluence;
}

export interface TenthLordAnalysis {
  planet: string;
  house: number;
  sign: string;
  dignity: string | null;
  isRetrograde: boolean;
  isCombust: boolean;
  placementClass: PlacementClass;
  nakshatra: string;
  nakshatraLord: string;
}

export interface AmkAnalysis {
  planet: string | null;
  d1House: number;
  d1Sign: string;
  d1Dignity: string | null;
  isVargottama: boolean;
  nakshatra: string;
  nakshatraLord: string;
}

export interface ArudhaHouseInfluence {
  sign: string;
  occupants: string[];
  influence: NetInfluence;
}

export interface ArudhaCareerAnalysis {
  alSign: string;
  alSignNumber: SignNumber;
  alHouseFromLagna: number;
  tenthFromAl: ArudhaHouseInfluence;
  eleventhFromAl: ArudhaHouseInfluence;
}

function classifySignInfluence(
  signNumber: SignNumber,
  positions: PlanetPosition[],
): ArudhaHouseInfluence {
  const sign = signName(signNumber);
  const occupants = positions
    .filter(
      (p) =>
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        RASHIS.indexOf(p.rashi) + 1 === signNumber,
    )
    .map((p) => p.name);

  const aspectingPlanets: string[] = [];
  for (const p of positions.filter((x) => GRAHAS.includes(x.name as (typeof GRAHAS)[number]))) {
    const drishti = calculateDrishti(p.name, positions);
    if (drishti.aspectedRashis.includes(sign)) aspectingPlanets.push(p.name);
  }

  const influencers = [...occupants, ...aspectingPlanets];
  const beneficCount = influencers.filter((n) => NATURAL_BENEFICS.has(n)).length;
  const maleficCount = influencers.filter((n) => NATURAL_MALEFICS.has(n)).length;

  return {
    sign,
    occupants,
    influence: classifyNetInfluence(beneficCount, maleficCount),
  };
}

export function analyzeTenthHouse(
  positions: PlanetPosition[],
  ascSign: SignNumber,
): TenthHouseAnalysis {
  const tenthSignNumber = signOfHouse(10, ascSign);
  const tenthSign = signName(tenthSignNumber);

  const occupants = positions
    .filter(
      (p) =>
        !EXCLUDED_OCCUPANTS.has(p.name) &&
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        RASHIS.indexOf(p.rashi) + 1 === tenthSignNumber,
    )
    .map((p) => p.name);

  const aspectingPlanets: string[] = [];
  for (const p of positions.filter((x) => GRAHAS.includes(x.name as (typeof GRAHAS)[number]))) {
    const drishti = calculateDrishti(p.name, positions);
    if (drishti.aspectedRashis.includes(tenthSign)) aspectingPlanets.push(p.name);
  }

  const influencers = [...occupants, ...aspectingPlanets];
  const beneficInfluenceCount = influencers.filter((n) => NATURAL_BENEFICS.has(n)).length;
  const maleficInfluenceCount = influencers.filter((n) => NATURAL_MALEFICS.has(n)).length;

  return {
    sign: tenthSign,
    signNumber: tenthSignNumber,
    occupants,
    aspectingPlanets,
    beneficInfluenceCount,
    maleficInfluenceCount,
    netInfluence: classifyNetInfluence(beneficInfluenceCount, maleficInfluenceCount),
  };
}

export function analyzeTenthLord(
  positions: PlanetPosition[],
  ascSign: SignNumber,
): TenthLordAnalysis {
  const tenthSignNumber = signOfHouse(10, ascSign);
  const tenthSign = signName(tenthSignNumber);
  const tenthLord = getRashiLord(tenthSign);
  const pos = positions.find((p) => p.name === tenthLord);
  if (!pos) throw new Error(`10th lord ${tenthLord} not found`);

  const nak = nakshatraFromLongitude(pos.siderealLongitude);
  const dignity = getDignity(tenthLord, RASHIS.indexOf(pos.rashi)) ?? null;
  // Whole-sign, so the sign always yields the house — never assume house 1.
  const house = pos.house ?? houseOfSign((RASHIS.indexOf(pos.rashi) + 1) as SignNumber, ascSign);

  return {
    planet: tenthLord,
    house,
    sign: pos.rashi,
    dignity,
    isRetrograde: pos.isRetrograde,
    isCombust: pos.isCombust,
    placementClass: resolvePlacementClass(house),
    nakshatra: nak.name,
    nakshatraLord: NAKSHATRA_DATA[nak.name].lord,
  };
}

export function analyzeAmk(positions: PlanetPosition[], ascSign: SignNumber): AmkAnalysis {
  const charas = calculateCharakarakas(positions);
  const amk = charas.AmK !== 'None' ? charas.AmK : null;
  if (!amk) {
    return {
      planet: null,
      d1House: 0,
      d1Sign: '',
      d1Dignity: null,
      isVargottama: false,
      nakshatra: '',
      nakshatraLord: '',
    };
  }

  const pos = positions.find((p) => p.name === amk);
  if (!pos) throw new Error(`AmK ${amk} not found`);

  const vargottama = getVargottamaPlanets(positions);
  const nak = nakshatraFromLongitude(pos.siderealLongitude);

  return {
    planet: amk,
    d1House: pos.house ?? houseOfSign((RASHIS.indexOf(pos.rashi) + 1) as SignNumber, ascSign),
    d1Sign: pos.rashi,
    d1Dignity: getDignity(amk, RASHIS.indexOf(pos.rashi)) ?? null,
    isVargottama: vargottama.includes(amk),
    nakshatra: nak.name,
    nakshatraLord: NAKSHATRA_DATA[nak.name].lord,
  };
}

export function analyzeArudhaCareer(
  positions: PlanetPosition[],
  ascSign: SignNumber,
): ArudhaCareerAnalysis {
  const al = calculateArudhaLagna(ascSign, positions);
  const tenthFromAlSign = signOfHouse(10, al.signNumber);
  const eleventhFromAlSign = signOfHouse(11, al.signNumber);

  return {
    alSign: signName(al.signNumber),
    alSignNumber: al.signNumber,
    alHouseFromLagna: al.house,
    tenthFromAl: classifySignInfluence(tenthFromAlSign, positions),
    eleventhFromAl: classifySignInfluence(eleventhFromAlSign, positions),
  };
}

export function getChartLords(ascSign: SignNumber): {
  tenthLord: string;
  lagnaLord: string;
  fifthLord: string;
} {
  const lagnaLord = getRashiLord(signName(ascSign));
  const tenthLord = getRashiLord(signName(signOfHouse(10, ascSign)));
  const fifthLord = getRashiLord(signName(signOfHouse(5, ascSign)));
  return { tenthLord, lagnaLord, fifthLord };
}

export function buildD1Analysis(positions: PlanetPosition[], ascSign: SignNumber) {
  return {
    tenth: analyzeTenthHouse(positions, ascSign),
    tenthLord: analyzeTenthLord(positions, ascSign),
    amk: analyzeAmk(positions, ascSign),
    arudha: analyzeArudhaCareer(positions, ascSign),
  };
}
