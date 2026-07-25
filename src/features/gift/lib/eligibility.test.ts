import { describe, expect, it } from 'vitest';
import { ageFromBirthDate, daysFromBirthday, isEligibleForBirthdayWindow } from './eligibility';

describe('ageFromBirthDate', () => {
  it('computes age relative to a fixed today', () => {
    const today = new Date(2026, 6, 25); // Jul 25 2026
    expect(ageFromBirthDate('2000-07-25', today)).toBe(26);
    expect(ageFromBirthDate('2000-07-26', today)).toBe(25);
    expect(ageFromBirthDate('2008-07-25', today)).toBe(18);
    expect(ageFromBirthDate('2008-07-26', today)).toBe(17);
  });
});

describe('daysFromBirthday', () => {
  it('returns 0 on the birthday', () => {
    const today = new Date(2026, 2, 15); // Mar 15
    expect(daysFromBirthday('1990-03-15', today)).toBe(0);
  });

  it('handles year wrap', () => {
    const today = new Date(2026, 0, 5); // Jan 5
    expect(daysFromBirthday('1990-12-20', today)).toBe(16);
  });
});

describe('isEligibleForBirthdayWindow', () => {
  const rule = { kind: 'birthdayWindow' as const, daysBefore: 30, daysAfter: 30 };
  const today = new Date(2026, 6, 25);

  it('accepts birthdays within the window', () => {
    expect(isEligibleForBirthdayWindow('1990-07-20', rule, today)).toBe(true);
    expect(isEligibleForBirthdayWindow('1990-08-20', rule, today)).toBe(true);
  });

  it('rejects birthdays outside the window', () => {
    expect(isEligibleForBirthdayWindow('1990-01-01', rule, today)).toBe(false);
  });
});
