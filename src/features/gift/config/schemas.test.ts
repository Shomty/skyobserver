import { describe, expect, it } from 'vitest';
import { validateField, validateStep1 } from './schemas';
import { GIFTS } from './gifts';

describe('validateField', () => {
  it('requires a non-empty full name of 2–100 chars', () => {
    expect(validateField('fullName', 'A')).toBe('errors.fullName');
    expect(validateField('fullName', '  ')).toBe('errors.fullName');
    expect(validateField('fullName', 'Ana Petrović')).toBeUndefined();
  });

  it('validates birth date age bounds', () => {
    expect(validateField('birthDate', 'not-a-date')).toBe('errors.birthDate.invalid');
    expect(validateField('birthDate', '2099-01-01')).toBe('errors.birthDate.future');
    // under 18 relative to 2026
    expect(validateField('birthDate', '2015-01-01')).toBe('errors.birthDate.ageMin');
    expect(validateField('birthDate', '1990-06-15')).toBeUndefined();
  });

  it('validates 24h birth time', () => {
    expect(validateField('birthTime', '25:00')).toBe('errors.birthTime');
    expect(validateField('birthTime', '12:00')).toBeUndefined();
    expect(validateField('birthTime', '00:30')).toBeUndefined();
  });

  it('requires matching emails after normalization', () => {
    expect(
      validateField('emailConfirm', 'Test@Example.COM', { email: 'test@example.com' })
    ).toBeUndefined();
    expect(
      validateField('emailConfirm', 'other@example.com', { email: 'test@example.com' })
    ).toBe('errors.emailConfirm.match');
  });

  it('allows empty optional fields', () => {
    expect(validateField('freeNote', '')).toBeUndefined();
    expect(validateField('childrenCount', '')).toBeUndefined();
    expect(validateField('childrenCount', '21')).toBe('errors.childrenCount');
    expect(validateField('childrenCount', '3')).toBeUndefined();
  });
});

describe('validateStep1', () => {
  it('collects all required errors for natal', () => {
    const errors = validateStep1(GIFTS.natal, {});
    expect(Object.keys(errors).sort()).toEqual(
      [...GIFTS.natal.requiredFields].sort()
    );
  });

  it('passes a complete natal payload', () => {
    const errors = validateStep1(GIFTS.natal, {
      fullName: 'Mila Markovic',
      salutation: 'salutation.ms',
      birthDate: '1990-06-15',
      birthTime: '14:30',
      birthPlace: 'Belgrade',
      email: 'mila@example.com',
      emailConfirm: 'mila@example.com',
    });
    expect(errors).toEqual({});
  });
});
