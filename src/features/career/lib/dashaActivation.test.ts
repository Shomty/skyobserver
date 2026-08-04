import { describe, expect, it } from 'vitest';
import type { PlanetPosition } from '../../../vedic-utils';
import { isUpagrahaAssociated } from './karmicChecks';
import { buildCareerReading } from './careerReading';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from './__fixtures__/milosTestUtils';

function planet(name: string, siderealLongitude: number, rashi: string): PlanetPosition {
  return {
    name,
    symbol: name.slice(0, 2),
    longitude: siderealLongitude,
    siderealLongitude,
    rashi,
    nakshatra: 'Ashwini',
    pada: 1,
    degree: Math.floor(siderealLongitude % 30),
    minute: 0,
    isRetrograde: false,
    isCombust: false,
    color: '#000',
    house: 1,
  };
}

describe('isUpagrahaAssociated', () => {
  const positions = [
    planet('Gulika', 10, 'Aries'),
    planet('Mars', 12, 'Aries'), // same sign and inside orb
    planet('Venus', 25, 'Aries'), // same sign, outside orb
    planet('Saturn', 190, 'Libra'), // 7th from Gulika — full drishti
    planet('Jupiter', 100, 'Cancer'), // untouched
  ];

  it('flags the graha the point sits with', () => {
    expect(isUpagrahaAssociated('Gulika', 'Mars', positions)).toBe(true);
    expect(isUpagrahaAssociated('Gulika', 'Venus', positions)).toBe(true);
  });

  it('flags the graha under the point full aspect', () => {
    expect(isUpagrahaAssociated('Gulika', 'Saturn', positions)).toBe(true);
  });

  it('does not flag untouched grahas', () => {
    expect(isUpagrahaAssociated('Gulika', 'Jupiter', positions)).toBe(false);
  });

  it('is false when the point was never injected', () => {
    expect(isUpagrahaAssociated('Maandi', 'Mars', positions)).toBe(false);
  });
});

describe('dasha roles with upagrahas present', () => {
  it('penalises only the dasha lords the points actually touch', () => {
    const enriched = milosEnrichedPositions();
    const reading = buildCareerReading(enriched, milos.dashas as never, MILOS_TEST_NOW);

    const flagged = reading.dasha.upcoming.filter((a) =>
      a.roles.some((r) => r === 'gulikaAssociated' || r === 'maandiAssociated'),
    );

    // Gulika and Maandi both land in Aries here, where Mars and Rahu sit.
    expect(flagged.map((a) => a.lord)).toContain('Mars');
    // The old implementation flagged every lord as soon as one affliction existed.
    expect(flagged.length).toBeLessThan(reading.dasha.upcoming.length);

    for (const activation of flagged) {
      const touched =
        isUpagrahaAssociated('Gulika', activation.lord, enriched) ||
        isUpagrahaAssociated('Maandi', activation.lord, enriched);
      expect(touched, `${activation.lord} flagged without contact`).toBe(true);
    }
  });
});
