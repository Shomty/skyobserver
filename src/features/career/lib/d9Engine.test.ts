import { describe, expect, it } from 'vitest';
import { isVargottama, type PlanetPosition } from '../../../vedic-utils';
import { analyzeVargottamaCareer, resolveVerdict } from './d9Engine';

describe('resolveVerdict', () => {
  it('covers every branch of the D1/D9 decision table', () => {
    expect(resolveVerdict('Exalted', 'Own Sign')).toBe('confirmed');
    expect(resolveVerdict('Debilitated', 'Exalted')).toBe('strengthened');
    expect(resolveVerdict('Own Sign', 'Debilitated')).toBe('hidden-weakness');
    expect(resolveVerdict(null, null)).toBe('neutral');
  });
});

describe('analyzeVargottamaCareer', () => {
  // Virgo lagna: the 10th is Gemini, so Mercury is both lagna lord and 10th lord.
  // 178° sits in the Virgo navamsha of Virgo — vargottama.
  const mercury: PlanetPosition = {
    name: 'Mercury',
    symbol: '☿',
    longitude: 178,
    siderealLongitude: 178,
    rashi: 'Virgo',
    nakshatra: 'Chitra',
    pada: 2,
    degree: 28,
    minute: 0,
    isRetrograde: false,
    isCombust: false,
    color: '#000',
    house: 1,
  };

  it('treats one graha holding two roles as a single planet', () => {
    expect(isVargottama(mercury)).toBe(true);

    const check = analyzeVargottamaCareer([mercury], 'Mercury', null, 'Mercury');

    expect(check.careerRelevant.map((c) => c.role)).toEqual(['tenthLord', 'lagnaLord']);
    // One planet, however many hats it wears.
    expect(check.resilienceNote).toBe('moderate');
  });

  it('reports high resilience only for two distinct grahas', () => {
    const venus: PlanetPosition = { ...mercury, name: 'Venus', symbol: '♀' };
    const check = analyzeVargottamaCareer([mercury, venus], 'Mercury', 'Venus', 'Mercury');

    expect(check.resilienceNote).toBe('high');
  });

  it('reports none when no career graha is vargottama', () => {
    const check = analyzeVargottamaCareer([{ ...mercury, siderealLongitude: 152 }], 'Mercury', null, 'Sun');
    expect(check.resilienceNote).toBe('none');
  });
});
