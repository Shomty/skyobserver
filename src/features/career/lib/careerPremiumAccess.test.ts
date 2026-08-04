import { describe, expect, it } from 'vitest';
import {
  hasCareerPremiumAccess,
  normalizePremiumEmail,
  resolveCareerPremiumUnlocked,
} from './careerPremiumAccess';

describe('careerPremiumAccess', () => {
  it('normalises emails', () => {
    expect(normalizePremiumEmail('  MMilos085@Gmail.COM ')).toBe('mmilos085@gmail.com');
  });

  it('unlocks listed test emails', () => {
    expect(hasCareerPremiumAccess('mmilos085@gmail.com', undefined)).toBe(true);
    expect(hasCareerPremiumAccess('shomty@hotmail.com', undefined)).toBe(true);
  });

  it('unlocks admins regardless of email', () => {
    expect(hasCareerPremiumAccess('other@example.com', 'admin')).toBe(true);
  });

  it('keeps premium locked for other users', () => {
    expect(hasCareerPremiumAccess('other@example.com', 'user')).toBe(false);
    expect(hasCareerPremiumAccess(null, undefined)).toBe(false);
  });
});

describe('resolveCareerPremiumUnlocked', () => {
  it('unlocks a test account report without signing in', () => {
    expect(resolveCareerPremiumUnlocked(false, 'mmilos085@gmail.com')).toBe(true);
    expect(resolveCareerPremiumUnlocked(false, '  Shomty@Hotmail.com ')).toBe(true);
  });

  it('keeps an ordinary visitor gated whatever they type', () => {
    expect(resolveCareerPremiumUnlocked(false, 'someone@example.com')).toBe(false);
    expect(resolveCareerPremiumUnlocked(false, null)).toBe(false);
    expect(resolveCareerPremiumUnlocked(false, undefined)).toBe(false);
  });

  it('keeps the signed-in unlock regardless of the report email', () => {
    expect(resolveCareerPremiumUnlocked(true, null)).toBe(true);
    expect(resolveCareerPremiumUnlocked(true, 'someone@example.com')).toBe(true);
  });
});
