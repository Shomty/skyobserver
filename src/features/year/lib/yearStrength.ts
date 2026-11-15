/** Vargottama is the ceiling. Own sign and exaltation sit below it on purpose. */
export const VARGOTTAMA_STRENGTH_WEIGHT = 100;
export const EXALTED_STRENGTH_WEIGHT = 80;
export const OWN_SIGN_STRENGTH_WEIGHT = 70;
export const NEUTRAL_STRENGTH_WEIGHT = 45;
export const DEBILITATED_STRENGTH_WEIGHT = 20;

export type Alertness = 'jagrata' | 'neutral' | 'heavy';

/**
 * Jagrata (awake / alert) is the classical state of a graha in its own sign
 * or exaltation. That is the favorable timing trigger for this reading.
 */
export function alertnessFromDignity(dignity: string | null | undefined): Alertness {
  if (!dignity) return 'neutral';
  const d = dignity.toLowerCase();
  if (d.includes('exalt') || d.includes('own')) return 'jagrata';
  if (d.includes('debil')) return 'heavy';
  return 'neutral';
}

export function strengthWeight(isVargottama: boolean, dignity: string | null | undefined): number {
  if (isVargottama) return VARGOTTAMA_STRENGTH_WEIGHT;
  const alertness = alertnessFromDignity(dignity);
  if (alertness === 'jagrata') {
    return dignity?.toLowerCase().includes('exalt') ? EXALTED_STRENGTH_WEIGHT : OWN_SIGN_STRENGTH_WEIGHT;
  }
  if (alertness === 'heavy') return DEBILITATED_STRENGTH_WEIGHT;
  return NEUTRAL_STRENGTH_WEIGHT;
}
