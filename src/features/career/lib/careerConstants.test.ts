import { describe, expect, it } from 'vitest';
import { houseOfSign, signOfHouse } from './careerConstants';

describe('careerConstants', () => {
  it('wraps sign 12 to house 1 from Leo ascendant', () => {
    expect(houseOfSign(12, 5)).toBe(8);
    expect(signOfHouse(1, 12)).toBe(12);
    expect(signOfHouse(2, 12)).toBe(1);
  });
});
