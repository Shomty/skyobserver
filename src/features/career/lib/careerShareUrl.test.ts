import { describe, expect, it } from 'vitest';
import { careerSharePath, careerShareUrl } from './careerShareUrl';

describe('careerShareUrl', () => {
  it('builds a public path and absolute url', () => {
    expect(careerSharePath('abc123XYZ-_')).toBe('/career/r/abc123XYZ-_');
    expect(careerShareUrl('abc123XYZ-_', 'https://example.com')).toBe(
      'https://example.com/career/r/abc123XYZ-_'
    );
  });
});
