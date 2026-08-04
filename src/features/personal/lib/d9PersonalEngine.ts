import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import {
  calculateUpapadaLagna,
  getDignity,
  getRashiLord,
  getVargottamaPlanets,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import { GRAHAS, houseOfSign, signName, signOfHouse } from './personalConstants';
import { resolveVerdict } from '../../career/lib/d9Engine';
import { houseInfluence } from './personalityEngine';

export interface D9StrengthCheck {
  planet: string;
  role: 'lagnaLord' | 'moon' | 'sun' | 'atmakaraka';
  d1Dignity: string | null;
  d9Dignity: string | null;
  verdict: 'confirmed' | 'strengthened' | 'hidden-weakness' | 'neutral';
}

export interface RelationshipAxisAnalysis {
  upapada: {
    sign: string;
    house: number;
    netInfluence: 'benefic' | 'malefic' | 'mixed' | 'none';
    beneficOccupants: string[];
    maleficOccupants: string[];
    beneficAspecting: string[];
    maleficAspecting: string[];
  };
  d9Seventh: {
    sign: string;
    lord: string;
    lordHouse: number | null;
    lordDignity: string | null;
    occupants: string[];
  };
}

export interface D9PersonalAnalysis {
  vargottama: string[];
  strengthChecks: D9StrengthCheck[];
  relationship: RelationshipAxisAnalysis;
}

function d9AscSign(positions: PlanetPosition[]): SignNumber {
  const d9 = computeDivisionalChart(positions, 'D9');
  const asc = d9.positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('D9 Ascendant not found');
  return (RASHIS.indexOf(asc.rashi) + 1) as SignNumber;
}

export function buildD9PersonalAnalysis(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  lagnaLord: string,
  atmakaraka: string,
): D9PersonalAnalysis {
  const vargottama = getVargottamaPlanets(positions);
  const d9 = computeDivisionalChart(positions, 'D9');
  const d9Asc = d9AscSign(positions);

  const roles: Array<{ planet: string; role: D9StrengthCheck['role'] }> = [
    { planet: lagnaLord, role: 'lagnaLord' },
    { planet: 'Moon', role: 'moon' },
    { planet: 'Sun', role: 'sun' },
  ];
  if (atmakaraka !== 'None') {
    roles.push({ planet: atmakaraka, role: 'atmakaraka' });
  }

  const strengthChecks: D9StrengthCheck[] = roles.map(({ planet, role }) => {
    const d1Pos = positions.find((p) => p.name === planet);
    const d9Pos = d9.positions.find((p) => p.name === planet);
    const d1Dignity = d1Pos ? getDignity(planet, RASHIS.indexOf(d1Pos.rashi)) ?? null : null;
    const d9Dignity = d9Pos ? getDignity(planet, RASHIS.indexOf(d9Pos.rashi)) ?? null : null;
    return {
      planet,
      role,
      d1Dignity,
      d9Dignity,
      verdict: resolveVerdict(d1Dignity, d9Dignity),
    };
  });

  const ul = calculateUpapadaLagna(ascSign, positions);
  const ulSignNumber = ul.signNumber;
  const ulInfluence = houseInfluence(positions, ulSignNumber);
  const beneficSet = new Set(['Jupiter', 'Venus', 'Mercury']);
  const maleficSet = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu']);
  const beneficOccupants = ulInfluence.occupants.filter((n) => beneficSet.has(n));
  const maleficOccupants = ulInfluence.occupants.filter((n) => maleficSet.has(n));
  const beneficAspecting = ulInfluence.aspecting.filter((n) => beneficSet.has(n));
  const maleficAspecting = ulInfluence.aspecting.filter((n) => maleficSet.has(n));

  const d9SeventhSign = signOfHouse(7, d9Asc);
  const d9SeventhLord = getRashiLord(signName(d9SeventhSign));
  const d9SeventhLordPos = d9.positions.find((p) => p.name === d9SeventhLord);
  const d9SeventhOccupants = d9.positions
    .filter(
      (p) =>
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        RASHIS.indexOf(p.rashi) + 1 === d9SeventhSign,
    )
    .map((p) => p.name);

  return {
    vargottama,
    strengthChecks,
    relationship: {
      upapada: {
        sign: signName(ulSignNumber),
        house: ul.house,
        netInfluence: ulInfluence.netInfluence,
        beneficOccupants,
        maleficOccupants,
        beneficAspecting,
        maleficAspecting,
      },
      d9Seventh: {
        sign: signName(d9SeventhSign),
        lord: d9SeventhLord,
        lordHouse: d9SeventhLordPos
          ? houseOfSign((RASHIS.indexOf(d9SeventhLordPos.rashi) + 1) as SignNumber, d9Asc)
          : null,
        lordDignity: d9SeventhLordPos
          ? getDignity(d9SeventhLord, RASHIS.indexOf(d9SeventhLordPos.rashi)) ?? null
          : null,
        occupants: d9SeventhOccupants,
      },
    },
  };
}
