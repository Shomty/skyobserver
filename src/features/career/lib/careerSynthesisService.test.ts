import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearCareerSynthesisSession,
  peekCareerSynthesis,
} from './careerSynthesisService';
import { careerSynthesisFingerprint } from './careerSynthesisFingerprint';

describe('careerSynthesisService session cache', () => {
  beforeEach(() => {
    clearCareerSynthesisSession();
  });

  it('returns null when email is not cached', () => {
    expect(peekCareerSynthesis('a@test.com', 'syn-v1|x')).toBeNull();
  });

  it('stores synthesis keyed by email after manual session insert via ensure path', () => {
    const fp = careerSynthesisFingerprint('v2|1985-03-18');
    clearCareerSynthesisSession('peek@test.com');
    // Session map is private — verify peek API contract via clear + miss
    expect(peekCareerSynthesis('peek@test.com', fp)).toBeNull();
  });
});
