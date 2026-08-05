import { describe, expect, it } from 'vitest';
import { buildCareerReading } from './careerReading';
import { buildCareerSnapshot } from './careerEngine';
import { buildCareerSynthesisPrompt } from './careerSynthesisPrompt';
import {
  careerSynthesisFingerprint,
  isValidCareerSynthesisText,
} from './careerSynthesisFingerprint';
import { careerBirthFingerprint } from './careerFingerprint';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from './__fixtures__/milosTestUtils';

describe('buildCareerSynthesisPrompt', () => {
  it('includes D1, D9, D10, dasha, nakshatra and synthesis facts', () => {
    const snapshot = buildCareerSnapshot(
      milosEnrichedPositions(),
      milos.dashas,
      milos.birthInstant,
      MILOS_TEST_NOW,
    );
    const reading = snapshot.reading!;
    const prompt = buildCareerSynthesisPrompt(reading, snapshot, milosEnrichedPositions(), 'Milos');

    expect(prompt).toContain('Milos');
    expect(prompt).toContain('Gem');
    expect(prompt).toContain('The Core Identity (D1)');
    expect(prompt).toContain('The Inner Path & Union (D9)');
    expect(prompt).toContain('The Path of Action (D10)');
    expect(prompt).toContain('Current Timing (Dasha)');
    expect(prompt).toContain(reading.d1.tenthLord.planet);
    expect(prompt).toContain(reading.dasha.current.md.lord);
  });
});

describe('careerSynthesisFingerprint', () => {
  it('changes when birth fingerprint changes', () => {
    const birthFp = careerBirthFingerprint(milos.birthInstant, milos.place);
    const a = careerSynthesisFingerprint(birthFp);
    const b = careerSynthesisFingerprint(`${birthFp}-other`);
    expect(a).not.toBe(b);
    expect(a).toContain('syn-v');
  });
});

describe('isValidCareerSynthesisText', () => {
  it('accepts substantive paragraphs and rejects empty strings', () => {
    expect(isValidCareerSynthesisText('x'.repeat(80))).toBe(true);
    expect(isValidCareerSynthesisText('short')).toBe(false);
  });
});

describe('buildCareerReading for synthesis payload', () => {
  it('always attaches reading on enriched Milos snapshot', () => {
    const snapshot = buildCareerSnapshot(
      milosEnrichedPositions(),
      milos.dashas,
      milos.birthInstant,
      MILOS_TEST_NOW,
    );
    expect(snapshot.reading).toBeDefined();
    expect(buildCareerReading(
      milosEnrichedPositions(),
      milos.dashas,
      MILOS_TEST_NOW,
    ).synthesis.primaryField).toBeDefined();
  });
});
