import { describe, expect, it } from 'vitest';
import { RASHIS, type PlanetPosition } from '../../../vedic-utils';
import { resolveVedicDayBounds, withCareerKaalVelas } from './careerKaalVelas';
import { checkKarmicAfflictions } from './karmicChecks';
import { getChartLords } from './d1Engine';
import { milos, milosEnrichedPositions } from './__fixtures__/milosTestUtils';

const positions = milos.positions as PlanetPosition[];
const instant = new Date(milos.birthInstant.iso);
const { latitude, longitude } = milos.place;
const offsetMinutes = milos.birthInstant.offsetMinutes;

/** Svalbard in midsummer: the Sun neither rises nor sets. */
const POLAR = { latitude: 78.22, longitude: 15.65, instant: new Date('2025-06-21T12:00:00.000Z') };

describe('resolveVedicDayBounds', () => {
  it('brackets the birth with a real sunrise and sunset', () => {
    const bounds = resolveVedicDayBounds(instant, latitude, longitude, offsetMinutes);
    expect(bounds).not.toBeNull();
    expect(bounds!.sunrise.getTime()).toBeLessThanOrEqual(instant.getTime());
    expect(bounds!.sunset.getTime()).toBeGreaterThan(bounds!.sunrise.getTime());
    expect(bounds!.daytimeDurationMinutes).toBeGreaterThan(0);
    expect(bounds!.dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(bounds!.dayOfWeek).toBeLessThanOrEqual(6);
  });

  it('returns null where the Sun does not rise or set', () => {
    expect(resolveVedicDayBounds(POLAR.instant, POLAR.latitude, POLAR.longitude, 120)).toBeNull();
  });
});

describe('withCareerKaalVelas', () => {
  it('injects Gulika and Maandi with usable sidereal positions', () => {
    const enriched = withCareerKaalVelas(positions, instant, latitude, longitude, offsetMinutes);

    expect(enriched).toHaveLength(positions.length + 2);
    for (const name of ['Gulika', 'Maandi']) {
      const point = enriched.find((p) => p.name === name);
      expect(point, `${name} missing`).toBeDefined();
      expect(RASHIS).toContain(point!.rashi);
      expect(point!.siderealLongitude).toBeGreaterThanOrEqual(0);
      expect(point!.siderealLongitude).toBeLessThan(360);
    }
  });

  it('leaves positions untouched when the vedic day cannot be resolved', () => {
    // Chart data is irrelevant here — only the coordinates drive rise/set.
    const enriched = withCareerKaalVelas(
      positions,
      POLAR.instant,
      POLAR.latitude,
      POLAR.longitude,
      120,
    );
    expect(enriched).toEqual(positions);
  });
});

describe('karmic checks against injected points', () => {
  const ascSign = 5 as const; // Leo, per the Milos fixture
  const lords = getChartLords(ascSign);

  it('emits nothing when the upagrahas are absent', () => {
    expect(checkKarmicAfflictions(positions, ascSign, lords)).toEqual([]);
  });

  it('reports only real afflictions once the upagrahas are present', () => {
    const enriched = milosEnrichedPositions();
    const afflictions = checkKarmicAfflictions(enriched, ascSign, lords);

    for (const a of afflictions) {
      expect(['Gulika', 'Maandi']).toContain(a.point);
      expect(a.afflicts.length).toBeGreaterThan(0);
      expect(['mild', 'significant']).toContain(a.severity);
    }
  });
});
