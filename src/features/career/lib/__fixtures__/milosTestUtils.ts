import type { PlanetPosition } from '../../../../vedic-utils';
import { withCareerKaalVelas } from '../careerKaalVelas';
import milos from './milos.json';

/** Fixed "now" for deterministic dasha/timing assertions across career tests. */
export const MILOS_TEST_NOW = new Date('2026-08-02T12:00:00.000Z');

/** Milos positions with Gulika/Maandi injected — mirrors useCareerCalculator. */
export function milosEnrichedPositions(): PlanetPosition[] {
  return withCareerKaalVelas(
    milos.positions as PlanetPosition[],
    new Date(milos.birthInstant.iso),
    milos.place.latitude,
    milos.place.longitude,
    milos.birthInstant.offsetMinutes,
  );
}

export { milos };
