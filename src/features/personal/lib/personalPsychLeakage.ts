/** Detect forbidden terminology in guidance output — chart, Vedic, Jung, translation meta. */
import type { PersonalGuidancePayload } from './personalGuidanceFingerprint';

const LEAKAGE_PATTERN =
  /\b(planet|planets|house|houses|chart|charts|dasha|dashas|rashi|rashis|nakshatra|nakshatras|lagna|graha|grahas|vimshottari|navamsha|navamsa|upapada|atmakaraka|jyotish|vedic|zodiac|ascendant|horoscope|transit|transits|conjunction|trine|square|opposition|exalt|debilit|mooltrikona|vargottama|dusthana|mahadasha|antardasha|rahu|ketu|jupiter|saturn|mars|venus|mercury|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces|mesha|vrishabha|mithuna|karka|simha|kanya|tula|vrischika|dhanu|makara|kumbha|meena|purushartha|karma|dharma|moksha|sattva|rajas|tamas|gulika|mandi|maandi|drishti|parashari|jaimini|jung|jungian|individuation|archetype|archetypes|translated from|derived from.{0,20}astrolog|birth chart|natal chart|sidereal|ayanamsa)\b/i;

export function hasAstrologyLeakage(text: string): boolean {
  return LEAKAGE_PATTERN.test(text);
}

export function findAstrologyLeakage(text: string): string[] {
  const matches = text.match(new RegExp(LEAKAGE_PATTERN.source, 'gi'));
  return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
}

export function guidanceHasLeakage(guidance: PersonalGuidancePayload): boolean {
  return Object.values(guidance).some((v) => hasAstrologyLeakage(v));
}
