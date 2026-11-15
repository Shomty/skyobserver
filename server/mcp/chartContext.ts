import type { BirthInstant } from '../../src/features/gift/lib/birthInstant.ts';
import type { PlaceResolution } from '../../src/features/gift/types.ts';
import { withCareerKaalVelas } from '../../src/features/career/lib/careerKaalVelas.ts';
import type { VimshottariDashasResponse } from '../../src/services/dashasService.ts';
import type { PlanetPosition } from '../../src/vedic-utils.ts';
import { computeDashas, computePositions } from '../ephemeris.ts';
import type { ResolvedMoment } from './moment.ts';
import { TtlCache } from './ttlCache.ts';

/** Everything the calculation and report tools derive from a single birth. */
export interface ChartContext {
  place: PlaceResolution;
  instant: BirthInstant;
  birthDate: Date;
  /** Ascendant + nine grahas from Swiss Ephemeris — what the app renders. */
  positions: PlanetPosition[];
  /** `positions` plus Gulika/Maandi, which the karmic layers of the reports need. */
  positionsWithUpagrahas: PlanetPosition[];
  dashas: VimshottariDashasResponse;
}

/** ISO instant + the exact coordinates the chart is computed from. */
export function chartKey(moment: ResolvedMoment): string {
  const { instant, place } = moment;
  return `${instant.iso}_${place.latitude}_${place.longitude}_${place.timezone}`;
}

// A client usually calls several tools for one person in a row. One hour keeps
// the "current dasha" fresh while sparing the ephemeris repeated work.
const cache = new TtlCache<ChartContext>(500, 60 * 60 * 1000);

async function computeChartContext(moment: ResolvedMoment): Promise<ChartContext> {
  const { place, instant } = moment;
  const birthDate = new Date(instant.iso);
  const [positions, dashas] = await Promise.all([
    computePositions(birthDate, place.latitude, place.longitude),
    computeDashas(instant.iso, place.latitude, place.longitude, place.timezone),
  ]);
  const positionsWithUpagrahas = withCareerKaalVelas(
    positions,
    birthDate,
    place.latitude,
    place.longitude,
    instant.offsetMinutes,
  );
  return { place, instant, birthDate, positions, positionsWithUpagrahas, dashas };
}

export function getChartContext(moment: ResolvedMoment): Promise<ChartContext> {
  return cache.getOrCreate(chartKey(moment), () => computeChartContext(moment));
}
