import { describe, expect, it } from 'vitest';
import { buildPersonalPsychProfile } from './personalPsychProfile';
import { hasAstrologyLeakage, guidanceHasLeakage } from './personalPsychLeakage';
import { buildParashariAnalysis } from './personalParashariEngine';
import { buildPersonalSnapshot } from './personalEngine';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from '../../career/lib/__fixtures__/milosTestUtils';

describe('buildPersonalPsychProfile', () => {
  it('produces plain-language fields with no obvious chart terms', () => {
    const { birthInstant, dashas } = milos;
    const positions = milosEnrichedPositions();
    const snapshot = buildPersonalSnapshot(positions, dashas, birthInstant, MILOS_TEST_NOW);
    const reading = snapshot.reading!;
    const profile = buildPersonalPsychProfile(reading);

    expect(profile.temperament.length).toBeGreaterThan(40);
    expect(profile.coreStrengths.length).toBeGreaterThan(20);
    expect(profile.growthEdges.length).toBeGreaterThan(20);
    expect(profile.lifeDirection.length).toBeGreaterThan(20);
    expect(profile.currentChapter.length).toBeGreaterThan(20);
    expect(profile.shadowThemes.length).toBeGreaterThan(20);

    const combined = Object.values(profile).join(' ');
    expect(hasAstrologyLeakage(combined)).toBe(false);
  });
});

describe('buildParashariAnalysis — psych copy', () => {
  it('outputs user-facing sections without astrology leakage', () => {
    const { birthInstant, dashas } = milos;
    const positions = milosEnrichedPositions();
    const snapshot = buildPersonalSnapshot(positions, dashas, birthInstant, MILOS_TEST_NOW);
    const analysis = buildParashariAnalysis(snapshot.reading!);

    expect(analysis.sections).toHaveLength(6);
    const combined = analysis.sections
      .flatMap((s) => [s.title, s.subtitle, s.teaser, ...s.paragraphs, ...(s.bullets ?? [])])
      .join(' ');
    expect(hasAstrologyLeakage(combined)).toBe(false);
    expect(/\b(jung|vedic|persona|individuation|psychological blueprint|translated)\b/i.test(combined)).toBe(false);
  });
});

describe('personalPsychLeakage', () => {
  it('flags astrology terms in guidance output', () => {
    expect(hasAstrologyLeakage('Your Mars in the 7th house')).toBe(true);
    expect(hasAstrologyLeakage('You tend to avoid conflict until it boils over.')).toBe(false);
    expect(
      guidanceHasLeakage({
        selfUnderstanding: 'You are thoughtful.',
        copingStrategies: 'Try journaling.',
        dailyPractices: 'Walk daily.',
        currentChapterGuidance: 'Focus on career dasha themes.',
        whenToSeekSupport: 'See a therapist if needed.',
      }),
    ).toBe(true);
  });
});
