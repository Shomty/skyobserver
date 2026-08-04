import { describe, expect, it } from 'vitest';
import type { PlanetPosition } from '../../../vedic-utils';
import { buildD10Analysis } from './d10Engine';
import milos from './__fixtures__/milos.json';

describe('d10Engine', () => {
  it('computes houses from D10 lagna, not D1 lagna', () => {
    const positions = milos.positions as PlanetPosition[];
    const d10 = buildD10Analysis(positions, 'Mercury');

    expect(d10.lagna.lagnaSign).toBeTruthy();
    expect(d10.tenth.lordHouse).toBeGreaterThanOrEqual(1);
    expect(d10.tenth.lordHouse).toBeLessThanOrEqual(12);

    const d1Asc = positions.find((p) => p.name === 'Ascendant')!;
    expect(d10.lagna.lagnaSign).not.toBe(d1Asc.rashi);
    expect(d10.tenth.lord).toBeTruthy();
    expect(d10.tenth.lordHouse).toBeGreaterThanOrEqual(1);
    expect(d10.tenth.lordHouse).toBeLessThanOrEqual(12);
  });
});
