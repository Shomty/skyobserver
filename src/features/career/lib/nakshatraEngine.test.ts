import { describe, expect, it } from 'vitest';
import { NAKSHATRA_GANA } from '../copy/nakshatraGana';
import { NAKSHATRA_SHAKTI } from '../copy/nakshatraShakti';
import { nakshatraFromLongitude, resolveDispositorship, taraFromMoon } from './nakshatraEngine';
import type { PlanetPosition } from '../../../vedic-utils';

describe('nakshatraFromLongitude', () => {
  it('matches spec test vectors', () => {
    expect(nakshatraFromLongitude(0).name).toBe('Ashwini');
    expect(nakshatraFromLongitude(0).pada).toBe(1);

    expect(nakshatraFromLongitude(13 + 20 / 60).name).toBe('Bharani');
    expect(nakshatraFromLongitude(13 + 20 / 60).pada).toBe(1);

    const magha = nakshatraFromLongitude(120);
    expect(magha.name).toBe('Magha');
    expect(magha.pada).toBe(1);
    expect(magha.lord).toBe('Ketu');

    expect(nakshatraFromLongitude(359.99).name).toBe('Revati');
    expect(nakshatraFromLongitude(359.99).pada).toBe(4);

    expect(nakshatraFromLongitude(-1).name).toBe('Revati');
    expect(nakshatraFromLongitude(-1).pada).toBe(4);
  });
});

describe('taraFromMoon', () => {
  it('flags Karma Tara at count 10', () => {
    const moonIndex = 0;
    const targetIndex = 9;
    const result = taraFromMoon(moonIndex, targetIndex);
    expect(result.count).toBe(10);
    expect(result.isKarmaTara).toBe(true);
    expect(result.tara).toBe('Janma');
  });
});

describe('nakshatra copy tables', () => {
  it('has 27 Gana entries and exactly 3 Shakti entries', () => {
    expect(Object.keys(NAKSHATRA_GANA)).toHaveLength(27);
    expect(Object.keys(NAKSHATRA_SHAKTI)).toHaveLength(3);
  });
});

describe('resolveDispositorship', () => {
  it('Magha Mars delivers through Ketu', () => {
    const positions: PlanetPosition[] = [
      {
        name: 'Ascendant',
        symbol: 'ASC',
        longitude: 0,
        siderealLongitude: 120,
        rashi: 'Leo',
        nakshatra: 'Magha',
        pada: 1,
        degree: 0,
        minute: 0,
        isRetrograde: false,
        isCombust: false,
        color: '#000',
        house: 1,
      },
      {
        name: 'Mars',
        symbol: '♂',
        longitude: 0,
        siderealLongitude: 120,
        rashi: 'Leo',
        nakshatra: 'Magha',
        pada: 1,
        degree: 0,
        minute: 0,
        isRetrograde: false,
        isCombust: false,
        color: '#000',
        house: 1,
      },
      {
        name: 'Ketu',
        symbol: '☊',
        longitude: 0,
        siderealLongitude: 200,
        rashi: 'Libra',
        nakshatra: 'Vishakha',
        pada: 1,
        degree: 20,
        minute: 0,
        isRetrograde: false,
        isCombust: false,
        color: '#000',
        house: 3,
      },
    ];

    const result = resolveDispositorship('Mars', positions, 5);
    expect(result?.nakshatra).toBe('Magha');
    expect(result?.nakshatraLord).toBe('Ketu');
    expect(result?.channelNote).toContain('Ketu');
  });
});
