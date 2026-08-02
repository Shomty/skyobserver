import { describe, expect, it } from 'vitest';
import type { PlanetPosition } from '../../../vedic-utils';
import { buildCareerSnapshot } from './careerEngine';
import { computeTenthHouseStrength } from './careerScores';
import milos from './__fixtures__/milos.json';

describe('buildCareerSnapshot', () => {
  it('matches Milos smoke test: Taurus 10th, Venus lord in 8th, ≥1 Dhana yoga', () => {
    const { birthInstant, positions, dashas } = milos;
    const snapshot = buildCareerSnapshot(
      positions as PlanetPosition[],
      dashas,
      birthInstant,
      new Date('2026-08-02T12:00:00.000Z'),
    );

    expect(snapshot.tenthHouse.sign).toBe('Taurus');
    expect(snapshot.tenthLord.planet).toBe('Venus');
    expect(snapshot.tenthLord.house).toBe(8);
    expect(snapshot.wealthYogas.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.scores.tenthHouseStrength.value).toBeGreaterThan(0);
    expect(snapshot.scores.leadership.value).toBeGreaterThan(0);
    expect(snapshot.fields.length).toBeGreaterThan(0);
    expect(snapshot.parashari.sections).toHaveLength(4);
    expect(snapshot.parashari.sections.map((s) => s.id)).toEqual(['d1', 'd9', 'd10', 'dasha']);
  });
});

describe('computeTenthHouseStrength', () => {
  it('scores debilitated lord lower than exalted', () => {
    const base = milos.positions as PlanetPosition[];
    const asc = base.find((p) => p.name === 'Ascendant')!;
    const venus = base.find((p) => p.name === 'Venus')!;

    const exaltedScore = computeTenthHouseStrength(base, 5, 'Taurus', venus);

    const debilitatedVenus = { ...venus, dignity: 'debilitated', house: 12 };
    const debilitatedScore = computeTenthHouseStrength(
      base.map((p) => (p.name === 'Venus' ? debilitatedVenus : p)),
      5,
      'Taurus',
      debilitatedVenus,
    );

    expect(exaltedScore.value).toBeGreaterThan(debilitatedScore.value);
  });
});
