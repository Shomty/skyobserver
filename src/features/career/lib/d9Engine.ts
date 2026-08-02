import { computeDivisionalChart } from '../../../lib/divisionalChartUtils';
import {
  calculateCharakarakas,
  getDignity,
  getRashiLord,
  getVargottamaPlanets,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import { GRAHAS, houseOfSign, isStrongDignity, signName, signOfHouse } from './careerConstants';
import type { AmkAnalysis, TenthLordAnalysis } from './d1Engine';

export interface VargottamaCareerCheck {
  all: string[];
  careerRelevant: Array<{ planet: string; role: 'tenthLord' | 'amatyakaraka' | 'lagnaLord' }>;
  resilienceNote: 'high' | 'moderate' | 'none';
}

export interface KarakamsaAnalysis {
  atmakaraka: string;
  karakamsaSign: string;
  karakamsaSignNumber: SignNumber;
  tenthFromKarakamsa: {
    sign: string;
    occupants: string[];
    lord: string;
    /** Null when the lord cannot be located in D9 — copy omits the line rather than guessing. */
    lordD9House: number | null;
  };
  vocationalIndicators: string[];
}

export interface D9StrengthCheck {
  planet: string;
  role: 'tenthLord' | 'amatyakaraka' | 'lagnaLord';
  d1Dignity: string | null;
  d9Dignity: string | null;
  verdict: 'confirmed' | 'strengthened' | 'hidden-weakness' | 'neutral';
}

/**
 * D1 promise against D9 delivery. `hidden-weakness` — visible promise, hollow
 * delivery — is the highest-value output of this module.
 */
export function resolveVerdict(
  d1Dignity: string | null,
  d9Dignity: string | null,
): D9StrengthCheck['verdict'] {
  const d1Strong = isStrongDignity(d1Dignity);
  const d9Strong = isStrongDignity(d9Dignity);
  if (d1Strong && d9Strong) return 'confirmed';
  if (!d1Strong && d9Strong) return 'strengthened';
  if (d1Strong && !d9Strong) return 'hidden-weakness';
  return 'neutral';
}

export function analyzeVargottamaCareer(
  positions: PlanetPosition[],
  tenthLord: string,
  amatyakaraka: string | null,
  lagnaLord: string,
): VargottamaCareerCheck {
  const all = getVargottamaPlanets(positions);
  const careerRelevant: VargottamaCareerCheck['careerRelevant'] = [];

  for (const planet of all) {
    if (planet === tenthLord) careerRelevant.push({ planet, role: 'tenthLord' });
    if (planet === amatyakaraka) careerRelevant.push({ planet, role: 'amatyakaraka' });
    if (planet === lagnaLord) careerRelevant.push({ planet, role: 'lagnaLord' });
  }

  // One graha can hold two roles (Mercury is both lagna lord and 10th lord on a
  // Virgo lagna), so resilience counts distinct planets, not role entries.
  const distinctPlanets = new Set(careerRelevant.map((c) => c.planet)).size;
  let resilienceNote: VargottamaCareerCheck['resilienceNote'] = 'none';
  if (distinctPlanets >= 2) resilienceNote = 'high';
  else if (distinctPlanets === 1) resilienceNote = 'moderate';

  return { all, careerRelevant, resilienceNote };
}

export function analyzeKarakamsa(positions: PlanetPosition[]): KarakamsaAnalysis | null {
  const charas = calculateCharakarakas(positions);
  const atmakaraka = charas.AK;
  if (atmakaraka === 'None') return null;

  const d9 = computeDivisionalChart(positions, 'D9');
  const akD9 = d9.positions.find((p) => p.name === atmakaraka);
  if (!akD9) return null;

  const karakamsaSignNumber = (RASHIS.indexOf(akD9.rashi) + 1) as SignNumber;
  const tenthFromKarakamsaSign = signOfHouse(10, karakamsaSignNumber);
  const tenthSignName = signName(tenthFromKarakamsaSign);

  const occupants = d9.positions
    .filter(
      (p) =>
        GRAHAS.includes(p.name as (typeof GRAHAS)[number]) &&
        RASHIS.indexOf(p.rashi) + 1 === tenthFromKarakamsaSign,
    )
    .map((p) => p.name);

  const lord = getRashiLord(tenthSignName);
  const lordD9Pos = d9.positions.find((p) => p.name === lord);
  const d9Asc = d9.positions.find((p) => p.name === 'Ascendant');
  const lordD9House =
    lordD9Pos?.house ??
    (lordD9Pos && d9Asc
      ? houseOfSign(
          (RASHIS.indexOf(lordD9Pos.rashi) + 1) as SignNumber,
          (RASHIS.indexOf(d9Asc.rashi) + 1) as SignNumber,
        )
      : null);
  const vocationalIndicators =
    occupants.length > 0 ? [...occupants, lord] : [lord];

  return {
    atmakaraka,
    karakamsaSign: signName(karakamsaSignNumber),
    karakamsaSignNumber,
    tenthFromKarakamsa: {
      sign: tenthSignName,
      occupants,
      lord,
      lordD9House,
    },
    vocationalIndicators: [...new Set(vocationalIndicators)],
  };
}

export function analyzeD9StrengthChecks(
  positions: PlanetPosition[],
  tenthLord: TenthLordAnalysis,
  amk: AmkAnalysis,
  lagnaLord: string,
): D9StrengthCheck[] {
  const d9 = computeDivisionalChart(positions, 'D9');
  const checks: Array<{ planet: string; role: D9StrengthCheck['role']; d1Dignity: string | null }> = [
    { planet: tenthLord.planet, role: 'tenthLord', d1Dignity: tenthLord.dignity },
    { planet: lagnaLord, role: 'lagnaLord', d1Dignity: null },
  ];

  if (amk.planet) {
    checks.push({ planet: amk.planet, role: 'amatyakaraka', d1Dignity: amk.d1Dignity });
  }

  return checks.map(({ planet, role, d1Dignity }) => {
    const d1Pos = positions.find((p) => p.name === planet);
    const resolvedD1Dignity =
      d1Dignity ?? (d1Pos ? getDignity(planet, RASHIS.indexOf(d1Pos.rashi)) ?? null : null);
    const d9Pos = d9.positions.find((p) => p.name === planet);
    const d9Dignity = d9Pos ? getDignity(planet, RASHIS.indexOf(d9Pos.rashi)) ?? null : null;

    return {
      planet,
      role,
      d1Dignity: resolvedD1Dignity,
      d9Dignity,
      verdict: resolveVerdict(resolvedD1Dignity, d9Dignity),
    };
  });
}

export function buildD9Analysis(
  positions: PlanetPosition[],
  tenthLord: TenthLordAnalysis,
  amk: AmkAnalysis,
  lagnaLord: string,
) {
  return {
    vargottama: analyzeVargottamaCareer(positions, tenthLord.planet, amk.planet, lagnaLord),
    karakamsa: analyzeKarakamsa(positions),
    strength: analyzeD9StrengthChecks(positions, tenthLord, amk, lagnaLord),
  };
}
