import { describe, expect, it } from 'vitest';
import type { PlanetPosition } from '../../../vedic-utils';
import { buildCareerSnapshot } from './careerEngine';
import { computeTenthHouseStrength } from './careerScores';
import { isUpagrahaAssociated } from './karmicChecks';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from './__fixtures__/milosTestUtils';

describe('buildCareerSnapshot', () => {
  it('matches Milos smoke test: Taurus 10th, Venus lord in 8th, ≥1 Dhana yoga', () => {
    const { birthInstant, dashas } = milos;
    const positions = milosEnrichedPositions();
    const snapshot = buildCareerSnapshot(positions, dashas, birthInstant, MILOS_TEST_NOW);

    expect(snapshot.tenthHouse.sign).toBe('Taurus');
    expect(snapshot.tenthLord.planet).toBe('Venus');
    expect(snapshot.tenthLord.house).toBe(8);
    expect(snapshot.wealthYogas.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.scores.tenthHouseStrength.value).toBeGreaterThan(0);
    expect(snapshot.scores.leadership.value).toBeGreaterThan(0);
    expect(snapshot.fields.length).toBeGreaterThan(0);
    expect(snapshot.parashari.sections).toHaveLength(5);
    expect(snapshot.parashari.sections.map((s) => s.id)).toEqual([
      'd1',
      'd9',
      'd10',
      'dasha',
      'nakshatra',
    ]);
    expect(snapshot.reading.d1.tenth.sign).toBe('Taurus');
  });

  it('includes upagrahas, D10 karmic delay, and per-planet dasha penalties', () => {
    const { birthInstant, dashas } = milos;
    const positions = milosEnrichedPositions();
    const snapshot = buildCareerSnapshot(positions, dashas, birthInstant, MILOS_TEST_NOW);

    expect(positions.find((p) => p.name === 'Gulika')).toBeDefined();
    expect(positions.find((p) => p.name === 'Maandi')).toBeDefined();
    expect(snapshot.reading.d10.karmicDelay).toBe('significant');

    const d10Body = snapshot.parashari.sections.find((s) => s.id === 'd10')!.paragraphs.join(' ');
    expect(d10Body).toContain('D10 karmic delay');
    expect(d10Body).toContain('significant');

    const flagged = snapshot.reading.dasha.upcoming.filter((a) =>
      a.roles.some((r) => r === 'gulikaAssociated' || r === 'maandiAssociated'),
    );
    expect(flagged.map((a) => a.lord)).toContain('Mars');
    expect(flagged.length).toBeLessThan(snapshot.reading.dasha.upcoming.length);

    for (const activation of flagged) {
      const touched =
        isUpagrahaAssociated('Gulika', activation.lord, positions) ||
        isUpagrahaAssociated('Maandi', activation.lord, positions);
      expect(touched, `${activation.lord} flagged without contact`).toBe(true);
    }
  });
});

describe('computeTenthHouseStrength', () => {
  it('scores debilitated lord lower than exalted', () => {
    const base = milos.positions as PlanetPosition[];
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
