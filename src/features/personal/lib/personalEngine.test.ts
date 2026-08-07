import { describe, expect, it } from 'vitest';
import { hasAstrologyLeakage } from './personalPsychLeakage';
import { buildPersonalSnapshot, rehydratePersonalSnapshot } from './personalEngine';
import { PERSONAL_READING_VERSION } from './personalFingerprint';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from '../../career/lib/__fixtures__/milosTestUtils';

describe('buildPersonalSnapshot', () => {
  it('produces a full personal reading with all framework sections', () => {
    const { birthInstant, dashas } = milos;
    const positions = milosEnrichedPositions();
    const snapshot = buildPersonalSnapshot(positions, dashas, birthInstant, MILOS_TEST_NOW);

    expect(snapshot.ascendantSignName).toBe('Leo');
    expect(snapshot.personalityWheel.lagnaSign).toBe('Leo');
    expect(snapshot.reading?.personality.moon.sign).toBeTruthy();
    expect(snapshot.reading?.d9.vargottama).toBeDefined();
    expect(snapshot.reading?.lifeMission.atmakaraka?.planet).toBeTruthy();
    expect(snapshot.reading?.sudarshana.triangulation).toHaveLength(4);
    expect(snapshot.reading?.sudarshana.triangulation[0]?.lagna.lord).toBeTruthy();
    expect(snapshot.reading?.dasha.mahadashaLifeAreasD9).toBeDefined();
    expect(snapshot.reading?.shadow.dusthanaAspectAfflictions).toBeDefined();
    expect(snapshot.reading?.dasha.mahadashaLord).toBeTruthy();
    expect(snapshot.parashari.sections).toHaveLength(6);
    expect(snapshot.scores.innerStrength.value).toBeGreaterThan(0);
  });
});

describe('rehydratePersonalSnapshot', () => {
  it('replaces stale Vedic parashari copy from cached snapshot using stored reading', () => {
    const { birthInstant, dashas } = milos;
    const positions = milosEnrichedPositions();
    const fresh = buildPersonalSnapshot(positions, dashas, birthInstant, MILOS_TEST_NOW);

    const staleCached = {
      ...fresh,
      parashari: {
        sections: [
          {
            id: 'personality' as const,
            tier: 'free' as const,
            title: 'Personality Wheel',
            subtitle: 'D1 · Lagna, Moon, Sun triad',
            teaser: 'Leo rising · Moon in Cancer',
            paragraphs: ['Your Ascendant in Leo governs Lagna lord Mars in the 7th house (D1).'],
            bullets: ['Mars: exalted (house 10)'],
          },
        ],
      },
    };

    const rehydrated = rehydratePersonalSnapshot(staleCached);
    const combined = rehydrated.parashari.sections
      .flatMap((s) => [s.title, s.subtitle, ...s.paragraphs, ...(s.bullets ?? [])])
      .join(' ');

    expect(rehydrated.parashari.sections).toHaveLength(6);
    expect(rehydrated.parashari.sections[0]?.title).toBe('Outer Self & Temperament');
    expect(hasAstrologyLeakage(combined)).toBe(false);
    expect(combined).not.toContain('Lagna');
  });

  it('returns snapshot unchanged when reading is absent', () => {
    const { birthInstant, dashas } = milos;
    const positions = milosEnrichedPositions();
    const fresh = buildPersonalSnapshot(positions, dashas, birthInstant, MILOS_TEST_NOW);
    const legacy = { ...fresh, reading: undefined };
    expect(rehydratePersonalSnapshot(legacy)).toBe(legacy);
  });
});

describe('personalBirthFingerprint version', () => {
  it('includes reading version 3 to bust stale server cache', () => {
    expect(PERSONAL_READING_VERSION).toBe(3);
  });
});
