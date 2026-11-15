import { describe, expect, it } from 'vitest';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from '../../career/lib/__fixtures__/milosTestUtils';
import { remediesForPlanets } from './yearMantras';
import { buildYearReading } from './yearEngine';
import { strengthWeight, VARGOTTAMA_STRENGTH_WEIGHT } from './yearStrength';

describe('strengthWeight', () => {
  it('gives Vargottama the maximum weight, above exaltation', () => {
    expect(strengthWeight(true, 'Debilitated')).toBe(VARGOTTAMA_STRENGTH_WEIGHT);
    expect(strengthWeight(false, 'Exalted')).toBeLessThan(VARGOTTAMA_STRENGTH_WEIGHT);
    expect(strengthWeight(true, 'Exalted')).toBe(strengthWeight(true, 'Debilitated'));
  });
});

describe('remediesForPlanets', () => {
  it('returns each planet once, in graha order', () => {
    const remedies = remediesForPlanets(['Saturn', 'Venus', 'Saturn']);
    expect(remedies.map((r) => r.planet)).toEqual(['Venus', 'Saturn']);
    expect(remedies[1]?.mantra).toContain('Shanaischaraya');
  });
});

describe('buildYearReading', () => {
  const reading = buildYearReading(milosEnrichedPositions(), milos.dashas, MILOS_TEST_NOW);

  it('reads the calendar year through Vimshottari, D1, D9, and D10', () => {
    expect(reading.year).toBe(2026);
    expect(reading.dasha.system).toBe('vimshottari');
    expect(reading.d1.lagna.sign.length).toBeGreaterThan(0);
    expect(reading.d1.lagna.nakshatra.length).toBeGreaterThan(0);
    expect(reading.d9.upapada.sign.length).toBeGreaterThan(0);
    expect(reading.d10.tenth.lord.length).toBeGreaterThan(0);
    expect(reading.d10.amatyakaraka.planet).toBeTruthy();
    expect(reading.stance.toLowerCase()).toContain('purushartha');
  });

  it('assigns the maximum strength weight only to Vargottama planets', () => {
    for (const graha of reading.d1.grahas) {
      if (graha.isVargottama) {
        expect(graha.strengthWeight).toBe(VARGOTTAMA_STRENGTH_WEIGHT);
      } else {
        expect(graha.strengthWeight).toBeLessThan(VARGOTTAMA_STRENGTH_WEIGHT);
      }
    }
  });

  it('frames Gulika and Mandi as growth, and attaches mantras only when needed', () => {
    const notes = [...reading.d9.relationshipNotes, ...reading.d10.careerNotes];
    for (const note of notes) {
      expect(note.framing.toLowerCase()).not.toContain('failure');
      expect(note.framing.toLowerCase()).toMatch(/growth|lesson|patience/);
    }
    if (reading.dasha.needsRemedy) {
      expect(reading.remedies.length).toBeGreaterThan(0);
    } else {
      expect(reading.remedies).toEqual([]);
    }
  });
});
