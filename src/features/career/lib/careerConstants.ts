import { KENDRA_HOUSES, KONA_HOUSES, RASHIS, type SignNumber } from '../../../vedic-utils';

export { KENDRA_HOUSES, KONA_HOUSES };

export const UPACHAYA_HOUSES = [3, 6, 10, 11] as const;
export const DUSTHANA_HOUSES = [6, 8, 12] as const;

export const NATURAL_BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
export const NATURAL_MALEFICS = new Set(['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']);

export const GRAHAS = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
] as const;

export const EXCLUDED_OCCUPANTS = new Set([
  'Ascendant',
  'Gulika',
  'Maandi',
  'Bhrigu Bindu',
]);

export type PlacementClass = 'kendra' | 'kona' | 'upachaya' | 'dusthana' | 'neutral';
export type NetInfluence = 'benefic' | 'malefic' | 'mixed' | 'none';

/** House number (1-12) of a sign, counted from the ascendant sign. */
export function houseOfSign(signNumber: SignNumber, ascSignNumber: SignNumber): number {
  return ((signNumber - ascSignNumber + 12) % 12) + 1;
}

/** Sign number occupying house `h` counted from `fromSign`. */
export function signOfHouse(h: number, fromSign: SignNumber): SignNumber {
  return (((fromSign - 1 + h - 1) % 12) + 1) as SignNumber;
}

export function signName(signNumber: SignNumber): string {
  return RASHIS[signNumber - 1];
}

export function resolvePlacementClass(house: number): PlacementClass {
  if (KENDRA_HOUSES.includes(house)) return 'kendra';
  if (KONA_HOUSES.includes(house)) return 'kona';
  if (UPACHAYA_HOUSES.includes(house as (typeof UPACHAYA_HOUSES)[number])) return 'upachaya';
  if (DUSTHANA_HOUSES.includes(house as (typeof DUSTHANA_HOUSES)[number])) return 'dusthana';
  return 'neutral';
}

export function isStrongDignity(dignity: string | null | undefined): boolean {
  if (!dignity) return false;
  const d = dignity.toLowerCase();
  return d.includes('exalt') || d.includes('own') || d.includes('moolat');
}

export function isDebilitated(dignity: string | null | undefined): boolean {
  if (!dignity) return false;
  return dignity.toLowerCase().includes('debil');
}

export function classifyNetInfluence(
  beneficCount: number,
  maleficCount: number,
): NetInfluence {
  if (beneficCount === 0 && maleficCount === 0) return 'none';
  if (beneficCount > maleficCount) return 'benefic';
  if (maleficCount > beneficCount) return 'malefic';
  return 'mixed';
}
