import type { VimshottariDashasResponse } from '../../../services/dashasService';
import type { SignNumber } from '../../../vedic-utils';
import type { CareerReading } from './careerReading';
import {
  buildWealthActivation,
  collectFutureAntardashas,
  type CareerReadingContext,
} from './dashaActivation';

export interface TimingInput {
  reading: CareerReading;
  ctx: CareerReadingContext;
  dashas: VimshottariDashasResponse;
  now: Date;
}

export interface CareerTimingResult {
  opportunityWindow: { from: string; to: string; reason: string } | null;
  peakEarning: { from: string; to: string; reason: string } | null;
  currentPeriodLord: string;
}

function formatMonth(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function formatYear(d: Date): string {
  return String(d.getFullYear());
}

export function computeOpportunityWindow(input: TimingInput): { from: string; to: string; reason: string } | null {
  const positive = input.reading.dasha.upcoming.filter((a) => a.score > 0);
  if (positive.length === 0) return null;

  const best = positive.reduce((top, cur) => {
    if (cur.score > top.score) return cur;
    if (cur.score === top.score && cur.from < top.from) return cur;
    return top;
  });

  return {
    from: formatMonth(new Date(best.from)),
    to: formatMonth(new Date(best.to)),
    reason: `${best.lord} antardasha (${best.kind}, score ${best.score}) activates ${best.roles.join(', ') || 'career significators'}`,
  };
}

export function computePeakEarning(input: TimingInput): { from: string; to: string; reason: string } | null {
  const future = collectFutureAntardashas(input.dashas, input.now, 15);
  const activations = future
    .map((ad) => buildWealthActivation(ad.planet, ad.start, ad.end, input.ctx))
    .filter((a) => a.score > 0);

  if (activations.length === 0) return null;

  const best = activations.reduce((top, cur) => {
    if (cur.score > top.score) return cur;
    if (cur.score === top.score && cur.from < top.from) return cur;
    return top;
  });

  return {
    from: formatYear(new Date(best.from)),
    to: formatYear(new Date(best.to)),
    reason: `${best.lord} antardasha supports income via ${best.roles.join(', ') || 'wealth significators'}`,
  };
}

export function computeCareerTiming(input: TimingInput): CareerTimingResult {
  return {
    opportunityWindow: computeOpportunityWindow(input),
    peakEarning: computePeakEarning(input),
    currentPeriodLord: input.reading.dasha.current.md.lord,
  };
}

/** @deprecated Use TimingInput with CareerReading — kept for transitional typing */
export type LegacyTimingInput = {
  dashas: VimshottariDashasResponse;
  tenthLord: string;
  tenthOccupants: string[];
  amatyakaraka: string | null;
  ascendantSign: SignNumber;
  now: Date;
};
