import { describe, expect, it } from 'vitest';
import { careerBirthFingerprint, normalizeCareerEmail } from './careerFingerprint';

describe('normalizeCareerEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeCareerEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});

describe('careerBirthFingerprint', () => {
  it('is stable for identical inputs', () => {
    const instant = { iso: '1985-03-18T15:11:00.000Z', offsetMinutes: 60 };
    const place = { latitude: 44.8458, longitude: 20.4014, timezone: 'Europe/Belgrade' };
    const a = careerBirthFingerprint(instant, place);
    const b = careerBirthFingerprint(instant, place);
    expect(a).toBe(b);
    expect(a).toContain('1985-03-18T15:11:00.000Z');
  });
});
