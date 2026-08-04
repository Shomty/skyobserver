import { describe, expect, it } from 'vitest';
import { NAKSHATRA_SHAKTI } from '../copy/nakshatraShakti';
import type { CareerReading } from './careerReading';
import { buildCareerReading } from './careerReading';
import { buildParashariAnalysis } from './parashariEngine';
import { milos, milosEnrichedPositions, MILOS_TEST_NOW } from './__fixtures__/milosTestUtils';

const enriched = milosEnrichedPositions();

const reading = buildCareerReading(enriched, milos.dashas as never, MILOS_TEST_NOW);

const sections = buildParashariAnalysis(reading).sections;

describe('buildParashariAnalysis', () => {
  it('renders no empty, undefined or NaN copy', () => {
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      const lines = [
        section.title,
        section.subtitle,
        section.teaser,
        ...section.paragraphs,
        ...(section.bullets ?? []),
      ];
      for (const line of lines) {
        expect(line.trim()).not.toBe('');
        expect(line).not.toMatch(/undefined|null|NaN|\[object/);
      }
    }
  });

  it('carries the nakshatra layer with Moon star, Gana and Taras', () => {
    const nakshatra = sections.find((s) => s.id === 'nakshatra');
    expect(nakshatra).toBeDefined();
    expect(nakshatra!.tier).toBe('premium');

    const body = nakshatra!.paragraphs.join(' ');
    expect(body).toContain(reading.nakshatra.moon.name);
    expect(body).toContain(reading.nakshatra.moonGana);
    // Every graha in a trial star is named, framed as remediable friction.
    for (const trial of reading.nakshatra.taras.filter((t) => t.quality === 'challenging')) {
      expect(body).toContain(`${trial.planet} (${trial.tara})`);
    }
  });

  it('omits the Shakti line for the 24 unverified nakshatras', () => {
    const nakshatra = sections.find((s) => s.id === 'nakshatra')!;
    const shaktiBullets = (nakshatra.bullets ?? []).filter((b) => b.includes('Power to'));
    const knownEntries = reading.nakshatra.shakti.filter(
      (s) => NAKSHATRA_SHAKTI[s.nakshatra] !== undefined,
    );
    expect(shaktiBullets).toHaveLength(knownEntries.length);
  });

  it('names each dispositorship channel once', () => {
    const nakshatra = sections.find((s) => s.id === 'nakshatra')!;
    const channels = (nakshatra.bullets ?? []).filter((b) => b.includes('works through'));
    expect(new Set(channels).size).toBe(channels.length);
  });

  it('renders Karma Tara paragraph only when grahas occupy the 10th-from-Moon star', () => {
    const nakshatra = sections.find((s) => s.id === 'nakshatra')!;
    const body = nakshatra!.paragraphs.join(' ');
    const karmaPlanets = reading.nakshatra.taras.filter((t) => t.isKarmaTara);

    if (karmaPlanets.length > 0) {
      expect(body).toContain('Karma Tara');
      for (const t of karmaPlanets) {
        expect(body).toContain(t.planet);
      }
    } else {
      expect(body).not.toContain('Karma Tara');
    }
  });

  it('surfaces D1 Gulika/Maandi copy when D1 afflictions exist', () => {
    const withKarmic: CareerReading = {
      ...reading,
      d1: {
        ...reading.d1,
        karmic: [
          {
            point: 'Gulika',
            sign: 'Taurus',
            house: 10,
            afflicts: ['10th house'],
            severity: 'significant',
          },
        ],
      },
    };
    const d1 = buildParashariAnalysis(withKarmic).sections.find((s) => s.id === 'd1')!;
    const body = d1.paragraphs.join(' ');
    expect(body).toContain('Gulika');
    expect(body).toContain('10th house');
  });

  it('omits D1 karmic copy when no D1 afflictions exist (Milos baseline)', () => {
    expect(reading.d1.karmic).toHaveLength(0);
    const d1 = sections.find((s) => s.id === 'd1')!;
    const body = d1.paragraphs.join(' ');
    expect(body).not.toMatch(/Gulika|Maandi/);
  });

  it('surfaces D10 karmic delay summary when afflictions exist', () => {
    const d10 = sections.find((s) => s.id === 'd10')!;
    const body = d10.paragraphs.join(' ');

    expect(reading.d10.karmicDelay).toBe('significant');
    expect(body).toContain('D10 karmic delay');
    expect(body).toContain('significant');
  });
});
