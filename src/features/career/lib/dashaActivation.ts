import { calculateDrishti, getRashiLord, getVargottamaPlanets, RASHIS, type PlanetPosition, type SignNumber } from '../../../vedic-utils';
import type { VimshottariDashasResponse } from '../../../services/dashasService';
import {
  DUSTHANA_HOUSES,
  GRAHAS,
  isDebilitated,
  signName,
  signOfHouse,
  UPACHAYA_HOUSES,
} from './careerConstants';
import type { buildD10Analysis } from './d10Engine';
import type { buildD1Analysis } from './d1Engine';
import type { buildD9Analysis } from './d9Engine';
import { isUpagrahaAssociated, type KarmicAffliction } from './karmicChecks';
import {
  ACTIVATION_KIND_THRESHOLDS,
  DASHA_MODIFIERS,
  DASHA_ROLE_SCORES,
  WEALTH_ROLE_SCORES,
} from './careerScoringWeights';

export type CareerRole =
  | 'd1TenthLord'
  | 'd1TenthOccupant'
  | 'd1TenthAspector'
  | 'd10TenthLord'
  | 'd10TenthOccupant'
  | 'd10LagnaLord'
  | 'amatyakaraka'
  | 'atmakaraka'
  | 'd1Upachaya'
  | 'd10Upachaya'
  | 'dusthanaLord'
  | 'dusthanaOccupant'
  | 'gulikaAssociated'
  | 'maandiAssociated'
  | 'vargottama';

export type WealthRole =
  | 'd1SecondLord'
  | 'd1EleventhLord'
  | 'd10EleventhLord'
  | 'd1EleventhOccupant'
  | 'd10EleventhOccupant'
  | 'd1SecondOccupant'
  | 'd10SecondOccupant'
  | 'vargottama'
  | 'dusthanaLord'
  | 'dusthanaOccupant';

export type ActivationKind = 'promotion' | 'expansion' | 'transition' | 'caution' | 'neutral';

export interface DashaActivation {
  lord: string;
  level: 'mahadasha' | 'antardasha' | 'pratyantardasha';
  from: string;
  to: string;
  roles: CareerRole[];
  kind: ActivationKind;
  score: number;
}

export interface WealthActivation {
  lord: string;
  level: 'antardasha';
  from: string;
  to: string;
  roles: WealthRole[];
  kind: ActivationKind;
  score: number;
}

export interface CareerReadingContext {
  positions: PlanetPosition[];
  ascSign: SignNumber;
  d1: ReturnType<typeof buildD1Analysis>;
  d9: ReturnType<typeof buildD9Analysis>;
  d10: ReturnType<typeof buildD10Analysis>;
  karmic: KarmicAffliction[];
  atmakaraka: string;
}


export function resolveCareerRoles(planet: string, ctx: CareerReadingContext): CareerRole[] {
  const roles: CareerRole[] = [];
  const pos = ctx.positions.find((p) => p.name === planet);

  if (planet === ctx.d1.tenthLord.planet) roles.push('d1TenthLord');
  if (ctx.d1.tenth.occupants.includes(planet)) roles.push('d1TenthOccupant');
  if (planet === ctx.d10.tenth.lord) roles.push('d10TenthLord');
  if (ctx.d10.tenth.occupants.includes(planet)) roles.push('d10TenthOccupant');
  if (planet === ctx.d10.lagna.lagnaLord) roles.push('d10LagnaLord');
  if (planet === ctx.d1.amk.planet) roles.push('amatyakaraka');
  if (planet === ctx.atmakaraka) roles.push('atmakaraka');

  if (pos?.house && UPACHAYA_HOUSES.includes(pos.house as (typeof UPACHAYA_HOUSES)[number])) {
    roles.push('d1Upachaya');
  }

  if (pos) {
    const drishti = calculateDrishti(planet, ctx.positions);
    if (drishti.aspectedRashis.includes(ctx.d1.tenth.sign)) roles.push('d1TenthAspector');
  }

  for (const up of ctx.d10.upachaya.occupants) {
    if (up.planet === planet) roles.push('d10Upachaya');
  }

  if (pos?.house && DUSTHANA_HOUSES.includes(pos.house as (typeof DUSTHANA_HOUSES)[number])) {
    roles.push('dusthanaOccupant');
  }

  for (const h of DUSTHANA_HOUSES) {
    const lord = getRashiLord(signName(signOfHouse(h, ctx.ascSign)));
    if (lord === planet) roles.push('dusthanaLord');
  }

  if (isUpagrahaAssociated('Gulika', planet, ctx.positions)) roles.push('gulikaAssociated');
  if (isUpagrahaAssociated('Maandi', planet, ctx.positions)) roles.push('maandiAssociated');
  if (getVargottamaPlanets(ctx.positions).includes(planet)) roles.push('vargottama');

  return [...new Set(roles)];
}

export function resolveWealthRoles(planet: string, ctx: CareerReadingContext): WealthRole[] {
  const roles: WealthRole[] = [];
  const secondLord = getRashiLord(signName(signOfHouse(2, ctx.ascSign)));
  const eleventhLord = getRashiLord(signName(signOfHouse(11, ctx.ascSign)));
  const d10EleventhSign = signOfHouse(11, ctx.d10.lagna.lagnaSignNumber);
  const d10EleventhLord = getRashiLord(signName(d10EleventhSign));

  if (planet === secondLord) roles.push('d1SecondLord');
  if (planet === eleventhLord) roles.push('d1EleventhLord');
  if (planet === d10EleventhLord) roles.push('d10EleventhLord');

  const eleventhSignName = signName(signOfHouse(11, ctx.ascSign));
  const secondSignName = signName(signOfHouse(2, ctx.ascSign));

  for (const p of ctx.positions) {
    if (p.name !== planet) continue;
    if (p.rashi === eleventhSignName) roles.push('d1EleventhOccupant');
    if (p.rashi === secondSignName) roles.push('d1SecondOccupant');
  }

  if (getVargottamaPlanets(ctx.positions).includes(planet)) roles.push('vargottama');

  const pos = ctx.positions.find((p) => p.name === planet);
  if (pos?.house && DUSTHANA_HOUSES.includes(pos.house as (typeof DUSTHANA_HOUSES)[number])) {
    roles.push('dusthanaOccupant');
  }

  for (const h of DUSTHANA_HOUSES) {
    const lord = getRashiLord(signName(signOfHouse(h, ctx.ascSign)));
    if (lord === planet) roles.push('dusthanaLord');
  }

  return [...new Set(roles)];
}

function scoreFromRoles(
  roles: string[],
  table: Record<string, number>,
  positions: PlanetPosition[],
  planet: string,
): number {
  let score = 0;
  let hasVargottama = false;

  for (const role of roles) {
    if (role === 'vargottama') {
      hasVargottama = true;
      continue;
    }
    score += table[role] ?? 0;
  }

  const pos = positions.find((p) => p.name === planet);
  if (pos) {
    if (isDebilitated(pos.dignity)) score *= DASHA_MODIFIERS.debilitatedMultiplier;
    if (pos.isCombust) score *= DASHA_MODIFIERS.combustMultiplier;
  }

  if (hasVargottama) {
    score *= DASHA_MODIFIERS.vargottamaMultiplier;
  }

  return Math.max(-100, Math.min(100, Math.round(score)));
}

export function classifyActivationKind(score: number): ActivationKind {
  if (score >= ACTIVATION_KIND_THRESHOLDS.promotion) return 'promotion';
  if (score >= ACTIVATION_KIND_THRESHOLDS.expansion) return 'expansion';
  if (score <= ACTIVATION_KIND_THRESHOLDS.caution) return 'caution';
  if (score <= ACTIVATION_KIND_THRESHOLDS.transition) return 'transition';
  return 'neutral';
}

export function buildDashaActivation(
  lord: string,
  level: DashaActivation['level'],
  from: Date,
  to: Date,
  ctx: CareerReadingContext,
): DashaActivation {
  const roles = resolveCareerRoles(lord, ctx);
  const score = scoreFromRoles(roles, DASHA_ROLE_SCORES, ctx.positions, lord);
  return {
    lord,
    level,
    from: from.toISOString(),
    to: to.toISOString(),
    roles,
    kind: classifyActivationKind(score),
    score,
  };
}

export function buildWealthActivation(
  lord: string,
  from: Date,
  to: Date,
  ctx: CareerReadingContext,
): WealthActivation {
  const roles = resolveWealthRoles(lord, ctx);
  const score = scoreFromRoles(roles, WEALTH_ROLE_SCORES, ctx.positions, lord);
  return {
    lord,
    level: 'antardasha',
    from: from.toISOString(),
    to: to.toISOString(),
    roles,
    kind: classifyActivationKind(score),
    score,
  };
}

export function collectFutureAntardashas(
  dashas: VimshottariDashasResponse,
  now: Date,
  horizonYears: number,
) {
  const horizon = new Date(now);
  horizon.setFullYear(horizon.getFullYear() + horizonYears);
  const results: { planet: string; start: Date; end: Date; mahadasha: string }[] = [];

  for (const md of dashas.dashaPeriods) {
    for (const ad of md.subPeriods) {
      const start = new Date(ad.startDate);
      const end = new Date(ad.endDate);
      if (end <= now) continue;
      if (start > horizon) continue;
      results.push({ planet: ad.planet, start, end, mahadasha: md.planet });
    }
  }

  return results.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function buildUpcomingActivations(
  dashas: VimshottariDashasResponse,
  now: Date,
  ctx: CareerReadingContext,
): DashaActivation[] {
  return collectFutureAntardashas(dashas, now, 15).map((ad) =>
    buildDashaActivation(ad.planet, 'antardasha', ad.start, ad.end, ctx),
  );
}

export function findCurrentActivation(
  lord: string,
  level: DashaActivation['level'],
  startIso: string,
  endIso: string,
  ctx: CareerReadingContext,
): DashaActivation {
  return buildDashaActivation(lord, level, new Date(startIso), new Date(endIso), ctx);
}
