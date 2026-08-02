/** Only 3 entries verified per spec — omit Shakti line when undefined. */
export interface ShaktiEntry {
  shakti: string;
  vocationalDomains: string[];
}

export const NAKSHATRA_SHAKTI: Record<string, ShaktiEntry> = {
  Krittika: {
    shakti: 'Power to burn / purify',
    vocationalDomains: ['transformation', 'culinary arts', 'surgery', 'executive analysis'],
  },
  Rohini: {
    shakti: 'Power to grow / create',
    vocationalDomains: ['creative arts', 'agriculture', 'luxury goods', 'business development'],
  },
  Shatabhisha: {
    shakti: 'Power to heal / pervade',
    vocationalDomains: ['medicine', 'research', 'technology', 'aviation', 'secretive networks'],
  },
};
