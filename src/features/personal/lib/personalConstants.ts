export {
  DUSTHANA_HOUSES,
  GRAHAS,
  NATURAL_BENEFICS,
  NATURAL_MALEFICS,
  classifyNetInfluence,
  houseOfSign,
  isDebilitated,
  isStrongDignity,
  resolvePlacementClass,
  signName,
  signOfHouse,
  type NetInfluence,
  type PlacementClass,
} from '../../career/lib/careerConstants';

import { RASHI_DATA, RASHIS, type SignNumber } from '../../../vedic-utils';

export type SignGuna = 'Sattva' | 'Rajas' | 'Tamas';

/** Traditional guna emphasis per rashi — interpretive convention. */
export const SIGN_GUNA: Record<SignNumber, SignGuna> = {
  1: 'Rajas',
  2: 'Tamas',
  3: 'Rajas',
  4: 'Tamas',
  5: 'Rajas',
  6: 'Tamas',
  7: 'Rajas',
  8: 'Tamas',
  9: 'Sattva',
  10: 'Tamas',
  11: 'Rajas',
  12: 'Sattva',
};

export function signElement(signNumber: SignNumber): string {
  return RASHI_DATA[signNumber - 1]?.element ?? 'Unknown';
}

export function signGuna(signNumber: SignNumber): SignGuna {
  return SIGN_GUNA[signNumber];
}

/** House significations for personal life-area naming — plain language only. */
export const HOUSE_LIFE_AREAS: Record<number, string> = {
  1: 'Self, body, temperament, overall vitality',
  2: 'Wealth, family, speech, accumulated resources',
  3: 'Courage, siblings, effort, short journeys, communication',
  4: 'Home, mother, emotional foundation, inner peace',
  5: 'Creativity, intelligence, children, romance, innate gifts',
  6: 'Conflict, debt, illness, service, daily obstacles',
  7: 'Partnership, marriage, business, the other',
  8: 'Transformation, hidden matters, longevity, sudden change',
  9: 'Meaning, higher belief, teachers, fortune, long journeys',
  10: 'Career and public action',
  11: 'Gains, income, networks, aspirations, elder siblings',
  12: 'Loss, isolation, subconscious, retreat, foreign lands, inner freedom',
};

export function lifeAreaForHouse(house: number): string {
  return HOUSE_LIFE_AREAS[house] ?? `House ${house}`;
}

export function rashiNameFromIndex(signIndex: number): string {
  return RASHIS[signIndex] ?? 'Unknown';
}
