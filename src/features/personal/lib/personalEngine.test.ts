import { describe, expect, it } from 'vitest';
import { buildPersonalSnapshot } from './personalEngine';
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
