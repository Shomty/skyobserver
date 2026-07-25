import { describe, expect, it } from 'vitest';
import { resolveBirthInstant, zoneOffsetMinutes } from './birthInstant';

describe('zoneOffsetMinutes', () => {
  it('applies historical DST rules, not current ones', () => {
    // Yugoslavia observed summer time in 1985: CEST = UTC+2.
    expect(zoneOffsetMinutes(new Date('1985-06-12T12:00:00Z'), 'Europe/Belgrade')).toBe(120);
    // Winter the same year: CET = UTC+1.
    expect(zoneOffsetMinutes(new Date('1985-01-12T12:00:00Z'), 'Europe/Belgrade')).toBe(60);
  });

  it('returns null for an unknown zone', () => {
    expect(zoneOffsetMinutes(new Date(), 'Mars/Olympus_Mons')).toBeNull();
  });
});

describe('resolveBirthInstant', () => {
  it('resolves a summer birth in Belgrade to UTC', () => {
    const result = resolveBirthInstant('1985-06-12', '14:30', 'Europe/Belgrade');
    expect(result).toEqual({ iso: '1985-06-12T12:30:00.000Z', offsetMinutes: 120 });
  });

  it('resolves a winter birth in the same zone one hour differently', () => {
    const result = resolveBirthInstant('1985-01-12', '14:30', 'Europe/Belgrade');
    expect(result).toEqual({ iso: '1985-01-12T13:30:00.000Z', offsetMinutes: 60 });
  });

  it('handles half-hour offsets', () => {
    const result = resolveBirthInstant('1990-03-15', '09:15', 'Asia/Kolkata');
    expect(result).toEqual({ iso: '1990-03-15T03:45:00.000Z', offsetMinutes: 330 });
  });

  it('is identity for UTC', () => {
    const result = resolveBirthInstant('2000-01-01', '00:00', 'UTC');
    expect(result).toEqual({ iso: '2000-01-01T00:00:00.000Z', offsetMinutes: 0 });
  });

  it('rejects malformed input and unknown zones', () => {
    expect(resolveBirthInstant('12-06-1985', '14:30', 'Europe/Belgrade')).toBeNull();
    expect(resolveBirthInstant('1985-06-12', '25:30', 'Europe/Belgrade')).toBeNull();
    expect(resolveBirthInstant('1985-06-12', '14:30', 'Nowhere/Nothing')).toBeNull();
  });
});
