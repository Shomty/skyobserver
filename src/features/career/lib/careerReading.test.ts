import { describe, expect, it } from 'vitest';
import { isUpagrahaAssociated } from './karmicChecks';
import { buildCareerReading } from './careerReading';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from './__fixtures__/milosTestUtils';

describe('buildCareerReading', () => {
  it('produces a full Milos reading snapshot', () => {
    const { dashas } = milos;
    const positions = milosEnrichedPositions();
    const reading = buildCareerReading(positions, dashas, MILOS_TEST_NOW);

    expect(reading.d1.tenth.sign).toBe('Taurus');
    expect(reading.d1.tenthLord.planet).toBe('Venus');
    expect(reading.d1.tenthLord.house).toBe(8);
    expect(reading.d9.strength.length).toBeGreaterThan(0);
    expect(reading.d10.lagna.lagnaSign).toBeTruthy();
    expect(reading.nakshatra.moon.name).toBeTruthy();
    expect(reading.dasha.current.md.lord).toBe('Saturn');
    expect(reading.synthesis.jobVsBusiness).toMatch(/job|business|either/);
  });

  it('surfaces D10 karmic delay and dasha penalties for afflicted lords', () => {
    const positions = milosEnrichedPositions();
    const reading = buildCareerReading(positions, milos.dashas, MILOS_TEST_NOW);

    expect(reading.d10.karmicDelay).toBe('significant');

    const flagged = [
      ...reading.dasha.upcoming,
      reading.dasha.current.md,
      reading.dasha.current.ad,
    ].filter((a) =>
      a.roles.some((r) => r === 'gulikaAssociated' || r === 'maandiAssociated'),
    );

    expect(flagged.map((a) => a.lord)).toContain('Mars');
    expect(flagged.length).toBeLessThan(reading.dasha.upcoming.length + 2);

    for (const activation of flagged) {
      const touched =
        isUpagrahaAssociated('Gulika', activation.lord, positions) ||
        isUpagrahaAssociated('Maandi', activation.lord, positions);
      expect(touched, `${activation.lord} flagged without contact`).toBe(true);
    }
  });
});
