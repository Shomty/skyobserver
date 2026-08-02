import { describe, expect, it } from 'vitest';
import type { PlanetPosition } from '../../../vedic-utils';
import { analyzeAmk, analyzeTenthHouse, analyzeTenthLord } from './d1Engine';
import milos from './__fixtures__/milos.json';

describe('d1Engine', () => {
  it('Milos fixture: Taurus 10th, Venus lord in 8th', () => {
    const positions = milos.positions as PlanetPosition[];
    const asc = positions.find((p) => p.name === 'Ascendant')!;
    const ascSign = 5 as const;

    const tenth = analyzeTenthHouse(positions, ascSign);
    const tenthLord = analyzeTenthLord(positions, ascSign);

    expect(tenth.sign).toBe('Taurus');
    expect(tenthLord.planet).toBe('Venus');
    expect(tenthLord.house).toBe(8);
    expect(tenthLord.placementClass).toBe('dusthana');
    expect(asc.rashi).toBe('Leo');
  });

  it('derives houses from signs when positions carry no house', () => {
    const ascSign = 5 as const;
    const houseless = (milos.positions as PlanetPosition[]).map(({ house: _house, ...rest }) => rest);

    const tenthLord = analyzeTenthLord(houseless as PlanetPosition[], ascSign);
    const amk = analyzeAmk(houseless as PlanetPosition[], ascSign);

    // Venus in Pisces from a Leo lagna is the 8th — never a defaulted house 1.
    expect(tenthLord.house).toBe(8);
    expect(tenthLord.placementClass).toBe('dusthana');
    expect(amk.planet).toBe('Mercury');
    expect(amk.d1House).toBe(8);
  });
});
