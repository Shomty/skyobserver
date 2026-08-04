/**
 * End-to-end snapshot verification — mirrors what /career renders after
 * useCareerCalculator enriches positions and buildCareerSnapshot runs.
 */
import { describe, expect, it } from 'vitest';
import { buildCareerSnapshot } from './careerEngine';
import { resolveCareerPremiumUnlocked } from './careerPremiumAccess';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from './__fixtures__/milosTestUtils';

describe('career report integration (browser QA baseline)', () => {
  const snapshot = buildCareerSnapshot(
    milosEnrichedPositions(),
    milos.dashas,
    milos.birthInstant,
    MILOS_TEST_NOW,
  );

  it('unlocks premium Parashari sections for the allowlisted Milos email', () => {
    expect(resolveCareerPremiumUnlocked(false, 'mmilos085@gmail.com')).toBe(true);
  });

  it('exposes all five Parashari sections including nakshatra', () => {
    expect(snapshot.parashari.sections.map((s) => s.id)).toEqual([
      'd1',
      'd9',
      'd10',
      'dasha',
      'nakshatra',
    ]);
  });

  it('shows D10 karmic delay and nakshatra layer copy', () => {
    const d10 = snapshot.parashari.sections.find((s) => s.id === 'd10')!;
    expect(d10.paragraphs.join(' ')).toContain('D10 karmic delay');

    const nakshatra = snapshot.parashari.sections.find((s) => s.id === 'nakshatra')!;
    const nakBody = [...nakshatra.paragraphs, ...(nakshatra.bullets ?? [])].join(' ');
    expect(nakBody).toContain(snapshot.reading.nakshatra.moon.name);
    expect(nakBody).toContain('Gana');
    expect(nakBody).toMatch(/Trial stars|little resistance/);
  });

  it('applies Gulika/Maandi dasha roles only to touched lords', () => {
    const flagged = snapshot.reading.dasha.upcoming.filter((a) =>
      a.roles.some((r) => r === 'gulikaAssociated' || r === 'maandiAssociated'),
    );
    expect(flagged.map((a) => a.lord)).toContain('Mars');
  });
});
