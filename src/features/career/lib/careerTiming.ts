import type { VimshottariDashasResponse } from '../../../services/dashasService';
import { getRashiLord, RASHIS, type SignNumber } from '../../../vedic-utils';

export interface TimingInput {
  dashas: VimshottariDashasResponse;
  tenthLord: string;
  tenthOccupants: string[];
  amatyakaraka: string | null;
  ascendantSign: SignNumber;
  now: Date;
}

export interface CareerTimingResult {
  opportunityWindow: { from: string; to: string; reason: string } | null;
  peakEarning: { from: string; to: string; reason: string } | null;
  currentPeriodLord: string;
}

const CAREER_SIGNIFICATORS = (input: TimingInput): Set<string> => {
  const set = new Set<string>([input.tenthLord, ...input.tenthOccupants]);
  if (input.amatyakaraka) set.add(input.amatyakaraka);
  return set;
};

function formatMonth(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function formatYear(d: Date): string {
  return String(d.getFullYear());
}

function collectFutureAntardashas(dashas: VimshottariDashasResponse, now: Date, horizonYears: number) {
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

/**
 * Opportunity window = next antardasha whose lord is the 10th lord, a 10th occupant, or AmK.
 * Method documented here because timing is the fuzziest career output.
 */
export function computeOpportunityWindow(input: TimingInput): { from: string; to: string; reason: string } | null {
  const sigs = CAREER_SIGNIFICATORS(input);
  const future = collectFutureAntardashas(input.dashas, input.now, 15);
  const match = future.find((ad) => sigs.has(ad.planet));
  if (!match) return null;

  return {
    from: formatMonth(match.start),
    to: formatMonth(match.end),
    reason: `${match.planet} antardasha activates your career significators (${[...sigs].join(', ')})`,
  };
}

/**
 * Peak earning ≈ span where 2nd/11th lord antardashas occur within the next 15 years.
 * Full transit overlap (Jupiter/Saturn over 10th/11th) requires ingress data — dasha-only proxy here.
 */
export function computePeakEarning(input: TimingInput): { from: string; to: string; reason: string } | null {
  const secondLord = getRashiLord(RASHIS[(input.ascendantSign - 1 + 1) % 12]);
  const eleventhLord = getRashiLord(RASHIS[(input.ascendantSign - 1 + 10) % 12]);
  const wealthLords = new Set([secondLord, eleventhLord]);

  const future = collectFutureAntardashas(input.dashas, input.now, 15);
  const matches = future.filter((ad) => wealthLords.has(ad.planet));
  if (matches.length === 0) return null;

  const from = matches[0].start;
  const to = matches[matches.length - 1].end;

  return {
    from: formatYear(from),
    to: formatYear(to),
    reason: `2nd/11th lord periods (${secondLord}, ${eleventhLord}) support income growth`,
  };
}

export function computeCareerTiming(input: TimingInput): CareerTimingResult {
  const currentMd = input.dashas.current.mahadasha?.planet ?? 'Unknown';
  return {
    opportunityWindow: computeOpportunityWindow(input),
    peakEarning: computePeakEarning(input),
    currentPeriodLord: currentMd,
  };
}
