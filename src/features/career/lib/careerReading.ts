import {
  calculateCharakarakas,
  calculateDrishti,
  getRashiLord,
  KENDRA_HOUSES,
  RASHIS,
  type PlanetPosition,
  type SignNumber,
} from '../../../vedic-utils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import type { Gana } from '../copy/nakshatraGana';
import { buildD10Analysis } from './d10Engine';
import { buildD1Analysis, getChartLords } from './d1Engine';
import { buildD9Analysis } from './d9Engine';
import { checkKarmicAfflictions } from './karmicChecks';
import {
  buildUpcomingActivations,
  collectFutureAntardashas,
  findCurrentActivation,
  type CareerReadingContext,
  type DashaActivation,
} from './dashaActivation';
import { GRAHAS, isStrongDignity, signName, signOfHouse } from './careerConstants';
import type { D10UpachayaAnalysis } from './d10Engine';
import type { D9StrengthCheck, KarakamsaAnalysis, VargottamaCareerCheck } from './d9Engine';
import type { AmkAnalysis, ArudhaCareerAnalysis, TenthHouseAnalysis, TenthLordAnalysis } from './d1Engine';
import type { KarmicAffliction } from './karmicChecks';
import {
  getPlanetGana,
  getPlanetShakti,
  nakshatraFromLongitude,
  resolveDispositorship,
  taraFromMoon,
  type Dispositorship,
  type NakshatraPosition,
  type TaraName,
} from './nakshatraEngine';
import { JOB_VS_BUSINESS_WEIGHTS } from './careerScoringWeights';
import { buildWealthActivation } from './dashaActivation';

export interface CareerReading {
  d1: {
    tenth: TenthHouseAnalysis;
    tenthLord: TenthLordAnalysis;
    amk: AmkAnalysis;
    arudha: ArudhaCareerAnalysis;
    karmic: KarmicAffliction[];
  };
  d9: {
    vargottama: VargottamaCareerCheck;
    karakamsa: KarakamsaAnalysis | null;
    strength: D9StrengthCheck[];
  };
  d10: {
    lagna: ReturnType<typeof buildD10Analysis>['lagna'];
    tenth: ReturnType<typeof buildD10Analysis>['tenth'];
    amk: ReturnType<typeof buildD10Analysis>['amk'];
    upachaya: D10UpachayaAnalysis;
    karmicDelay: 'none' | 'mild' | 'significant';
  };
  nakshatra: {
    moon: NakshatraPosition;
    moonGana: Gana;
    /** Gana of the 10th lord's nakshatra — a divergence from `moonGana` is itself a finding. */
    tenthLordGana: Gana | undefined;
    dispositorships: Dispositorship[];
    taras: Array<{ planet: string; tara: TaraName; quality: string; isKarmaTara: boolean }>;
    shakti: Array<{ planet: string; nakshatra: string; entry: import('../copy/nakshatraShakti').ShaktiEntry | undefined }>;
  };
  dasha: {
    current: { md: DashaActivation; ad: DashaActivation; pd: DashaActivation };
    upcoming: DashaActivation[];
  };
  synthesis: {
    primaryField: string[];
    jobVsBusiness: 'job' | 'business' | 'either';
    confidence: 'high' | 'moderate' | 'low';
    contradictions: string[];
  };
}

function isTenthStrong(d1: CareerReading['d1']): boolean {
  return (
    d1.tenth.netInfluence === 'benefic' ||
    isStrongDignity(d1.tenthLord.dignity) ||
    d1.tenthLord.placementClass === 'kendra' ||
    d1.tenthLord.placementClass === 'kona'
  );
}

function isD10TenthWeak(d10: CareerReading['d10']): boolean {
  return (
    d10.tenth.lordPlacementClass === 'dusthana' ||
    d10.amk.alignment === 'unaligned'
  );
}

function detectContradictions(reading: CareerReading): string[] {
  const out: string[] = [];

  if (isTenthStrong(reading.d1) && isD10TenthWeak(reading.d10)) {
    out.push('visible position exceeds actual authority');
  }

  const hiddenWeakness = reading.d9.strength.find(
    (s) => s.role === 'tenthLord' && s.verdict === 'hidden-weakness',
  );
  if (hiddenWeakness && isTenthStrong(reading.d1)) {
    out.push('promise stronger than delivery');
  }

  if (reading.d10.amk.alignment === 'aligned' && reading.d1.tenthLord.placementClass === 'dusthana') {
    out.push('purpose clear, path obstructed');
  }

  const tenthLordGana = reading.nakshatra.tenthLordGana;
  if (tenthLordGana && tenthLordGana !== reading.nakshatra.moonGana) {
    out.push('temperament and professional function diverge');
  }

  const currentAd = reading.dasha.current.ad;
  if (reading.d10.upachaya.growthProfile === 'compounding' && currentAd.kind === 'caution') {
    out.push('long arc favourable, current period is not');
  }

  return out;
}

function resolveConfidence(contradictions: string[]): CareerReading['synthesis']['confidence'] {
  if (contradictions.length >= 3) return 'low';
  if (contradictions.length >= 1) return 'moderate';
  return 'high';
}

function scoreJobVsBusiness(
  reading: CareerReading,
  positions: PlanetPosition[],
  ascSign: SignNumber,
): number {
  let score = 0;
  const w = JOB_VS_BUSINESS_WEIGHTS;
  const tlHouse = reading.d1.tenthLord.house;

  if ([1, 7, 11].includes(tlHouse)) score += w.tenthLordIn1_7_11;
  if (tlHouse === 6) score += w.tenthLordIn6;

  const seventhLord = getRashiLord(signName(signOfHouse(7, ascSign)));
  const seventhLordPos = positions.find((p) => p.name === seventhLord);
  if (seventhLordPos && isStrongDignity(seventhLordPos.dignity)) score += w.strong7thHouse;

  if (reading.d10.lagna.executionCapacity === 'strong') score += w.d10LagnaStrong;

  const sun = positions.find((p) => p.name === 'Sun');
  if (sun && isStrongDignity(sun.dignity) && KENDRA_HOUSES.includes(sun.house ?? 0)) {
    score += w.sunStrongInKendra;
  }

  const saturn = positions.find((p) => p.name === 'Saturn');
  if (
    saturn &&
    isStrongDignity(saturn.dignity) &&
    [6, 10].includes(saturn.house ?? 0)
  ) {
    score += w.saturnStrongIn6or10;
  }

  if (reading.d10.amk.connectsKendra) score += w.amkInD10Kendra;
  if (reading.d10.upachaya.growthProfile === 'compounding') score += w.compoundingUpachaya;

  const mercury = positions.find((p) => p.name === 'Mercury');
  const rahu = positions.find((p) => p.name === 'Rahu');
  if (mercury && rahu) {
    const sameSign = mercury.rashi === rahu.rashi;
    const drishti = calculateDrishti('Mercury', positions);
    const mutual = drishti.aspectedRashis.includes(rahu.rashi);
    if (sameSign || mutual) score += w.mercuryRahuLink;
  }

  return score;
}

function resolveJobVsBusiness(score: number): CareerReading['synthesis']['jobVsBusiness'] {
  if (score >= JOB_VS_BUSINESS_WEIGHTS.businessThreshold) return 'business';
  if (score <= JOB_VS_BUSINESS_WEIGHTS.jobThreshold) return 'job';
  return 'either';
}

function buildNakshatraBlock(
  positions: PlanetPosition[],
  ascSign: SignNumber,
  tenthLord: string,
  amk: string | null,
  d10TenthLord: string,
  mdLord: string,
) {
  const moon = positions.find((p) => p.name === 'Moon');
  if (!moon) throw new Error('Moon not found');

  const moonNak = nakshatraFromLongitude(moon.siderealLongitude);
  const moonGana = getPlanetGana('Moon', positions) ?? 'Manushya';

  // The same graha often holds two roles (D1 and D10 10th lord, say) — report it once.
  const dispositorshipPlanets = [
    ...new Set([tenthLord, ...(amk ? [amk] : []), d10TenthLord, mdLord]),
  ];
  const dispositorships = dispositorshipPlanets
    .map((p) => resolveDispositorship(p, positions, ascSign))
    .filter((d): d is Dispositorship => d !== null);

  const taras = positions
    .filter((p) => GRAHAS.includes(p.name as (typeof GRAHAS)[number]))
    .map((p) => {
      const targetNak = nakshatraFromLongitude(p.siderealLongitude);
      const tara = taraFromMoon(moonNak.index, targetNak.index);
      return {
        planet: p.name,
        tara: tara.tara,
        quality: tara.quality,
        isKarmaTara: tara.isKarmaTara,
      };
    });

  // The Moon leads the Shakti list: it carries innate style, the rest carry function.
  const shaktiPlanets = [...new Set(['Moon', ...dispositorshipPlanets])];
  const shakti = shaktiPlanets
    .map((p) => getPlanetShakti(p, positions))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    moon: moonNak,
    moonGana,
    tenthLordGana: getPlanetGana(tenthLord, positions),
    dispositorships,
    taras,
    shakti,
  };
}

export function buildCareerReading(
  positions: PlanetPosition[],
  dashas: VimshottariDashasResponse,
  now: Date,
  pratyantardasha?: { planet: string; startDate: string; endDate: string },
): CareerReading {
  const asc = positions.find((p) => p.name === 'Ascendant');
  if (!asc) throw new Error('Ascendant not found');

  const ascSign = (RASHIS.indexOf(asc.rashi) + 1) as SignNumber;
  const lords = getChartLords(ascSign);
  const d1Base = buildD1Analysis(positions, ascSign);
  const karmic = checkKarmicAfflictions(positions, ascSign, lords);
  const d1 = { ...d1Base, karmic };

  const d9 = buildD9Analysis(positions, d1.tenthLord, d1.amk, lords.lagnaLord);
  const d10Full = buildD10Analysis(positions, d1.amk.planet);
  const d10 = {
    lagna: d10Full.lagna,
    tenth: d10Full.tenth,
    amk: d10Full.amk,
    upachaya: d10Full.upachaya,
    karmicDelay: d10Full.karmicDelay,
  };

  const charas = calculateCharakarakas(positions);
  const atmakaraka = charas.AK;

  const ctx: CareerReadingContext = {
    positions,
    ascSign,
    d1,
    d9,
    d10: d10Full,
    karmic,
    atmakaraka,
  };

  const md = dashas.current.mahadasha;
  const ad = dashas.current.antardasha;
  const pd = pratyantardasha ?? { planet: 'Unknown', startDate: now.toISOString(), endDate: now.toISOString() };

  const current = {
    md: md
      ? findCurrentActivation(md.planet, 'mahadasha', md.startDate, md.endDate, ctx)
      : findCurrentActivation('Unknown', 'mahadasha', now.toISOString(), now.toISOString(), ctx),
    ad: ad
      ? findCurrentActivation(ad.planet, 'antardasha', ad.startDate, ad.endDate, ctx)
      : findCurrentActivation('Unknown', 'antardasha', now.toISOString(), now.toISOString(), ctx),
    pd: findCurrentActivation(pd.planet, 'pratyantardasha', pd.startDate, pd.endDate, ctx),
  };

  const upcoming = buildUpcomingActivations(dashas, now, ctx).sort((a, b) => b.score - a.score);

  const nakshatra = buildNakshatraBlock(
    positions,
    ascSign,
    d1.tenthLord.planet,
    d1.amk.planet,
    d10.tenth.lord,
    current.md.lord,
  );

  const primaryField = d9.karakamsa?.vocationalIndicators ?? [];

  const partialReading = {
    d1,
    d9,
    d10,
    nakshatra,
    dasha: { current, upcoming },
    synthesis: {
      primaryField,
      jobVsBusiness: 'either' as const,
      confidence: 'high' as const,
      contradictions: [] as string[],
    },
  };

  const contradictions = detectContradictions(partialReading);
  const jobScore = scoreJobVsBusiness(partialReading, positions, ascSign);

  return {
    d1,
    d9,
    d10,
    nakshatra,
    dasha: { current, upcoming },
    synthesis: {
      primaryField,
      jobVsBusiness: resolveJobVsBusiness(jobScore),
      confidence: resolveConfidence(contradictions),
      contradictions,
    },
  };
}
