import { describe, expect, it } from 'vitest';
import { CAREER_READING_VERSION, careerBirthFingerprint } from './careerFingerprint';

describe('careerBirthFingerprint', () => {
  const instant = { iso: '1985-03-18T15:11:00.000Z', offsetMinutes: 60 };
  const place = { latitude: 44.8458, longitude: 20.4014, timezone: 'Europe/Belgrade' };

  it('is stable for identical inputs', () => {
    const a = careerBirthFingerprint(instant, place);
    const b = careerBirthFingerprint(instant, place);
    expect(a).toBe(b);
    expect(a).toContain('1985-03-18T15:11:00.000Z');
  });

  it('carries the reading version so older snapshots are recomputed', () => {
    expect(careerBirthFingerprint(instant, place)).toContain(`v${CAREER_READING_VERSION}|`);
  });
});
