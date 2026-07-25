import type { FieldId, GiftDefinition, GiftSlug } from '../types';

const NATAL_REQUIRED: readonly FieldId[] = [
  'fullName',
  'salutation',
  'birthDate',
  'birthTime',
  'birthPlace',
  'email',
  'emailConfirm',
] as const;

const OPTIONAL_COMMON: readonly FieldId[] = [
  'socialHandle',
  'interestArea',
  'experienceLevel',
  'relationshipStatus',
  'childrenCount',
  'workStatus',
  'occupation',
  'freeNote',
] as const;

export const GIFTS: Record<GiftSlug, GiftDefinition> = {
  natal: {
    slug: 'natal',
    copyKey: 'gifts.natal',
    accentClass: 'accent-gold',
    requiredFields: NATAL_REQUIRED,
    optionalFields: OPTIONAL_COMMON,
    capacityPolicy: 'daily',
  },
  solar: {
    slug: 'solar',
    copyKey: 'gifts.solar',
    accentClass: 'accent-violet',
    requiredFields: [...NATAL_REQUIRED, 'celebrationPlace'],
    optionalFields: OPTIONAL_COMMON,
    eligibility: { kind: 'birthdayWindow', daysBefore: 30, daysAfter: 30 },
    fallbackGift: 'natal',
    capacityPolicy: 'daily',
  },
  annual: {
    slug: 'annual',
    copyKey: 'gifts.annual',
    badge: 'new',
    accentClass: 'accent-indigo',
    requiredFields: NATAL_REQUIRED,
    optionalFields: OPTIONAL_COMMON,
    capacityPolicy: 'daily',
  },
};

export const GIFT_SLUGS = Object.keys(GIFTS) as GiftSlug[];

export function getGift(slug: string): GiftDefinition | undefined {
  if (slug in GIFTS) return GIFTS[slug as GiftSlug];
  return undefined;
}

export function isGiftSlug(slug: string): slug is GiftSlug {
  return slug in GIFTS;
}
