import { z } from 'zod';
import {
  EXPERIENCE_OPTIONS,
  INTEREST_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SALUTATION_OPTIONS,
  WORK_OPTIONS,
} from './fields';
import { ageFromBirthDate, parseIsoDate } from '../lib/eligibility';
import { isPlaceFieldId } from '../types';
import type { FieldId, GiftDefinition, PlaceFieldId, PlaceResolution } from '../types';

const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const OPTIONAL_IDS: ReadonlySet<FieldId> = new Set([
  'socialHandle',
  'interestArea',
  'experienceLevel',
  'relationshipStatus',
  'childrenCount',
  'workStatus',
  'occupation',
  'freeNote',
]);

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'errors.fullName')
  .max(100, 'errors.fullName')
  .refine((v) => v.replace(/\s/g, '').length > 0, 'errors.fullName');

export const salutationSchema = z
  .string()
  .refine((v) => (SALUTATION_OPTIONS as readonly string[]).includes(v), 'errors.salutation');

export const birthDateSchema = z
  .string()
  .refine((v) => parseIsoDate(v) !== null, 'errors.birthDate.invalid')
  .refine((v) => {
    const d = parseIsoDate(v);
    return d !== null && d.getTime() <= startOfToday().getTime();
  }, 'errors.birthDate.future')
  .refine((v) => {
    const age = ageFromBirthDate(v);
    return age !== null && age >= 18;
  }, 'errors.birthDate.ageMin')
  .refine((v) => {
    const age = ageFromBirthDate(v);
    return age !== null && age <= 120;
  }, 'errors.birthDate.ageMax');

export const birthTimeSchema = z.string().regex(timeRe, 'errors.birthTime');

export const placeSchema = z.string().trim().min(2, 'errors.place').max(120, 'errors.place');

export const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.string().max(254, 'errors.email').email('errors.email'));

function issueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  return typeof issue?.message === 'string' ? issue.message : 'errors.generic';
}

export function validateField(
  id: FieldId,
  value: string | undefined,
  allValues: Partial<Record<FieldId, string>> = {}
): string | undefined {
  const raw = value ?? '';

  if (id === 'emailConfirm') {
    const email = normalizeEmail(allValues.email ?? '');
    const confirm = normalizeEmail(raw);
    if (!confirm) return 'errors.emailConfirm';
    if (confirm !== email) return 'errors.emailConfirm.match';
    const emailResult = emailSchema.safeParse(confirm);
    if (!emailResult.success) return issueMessage(emailResult.error);
    return undefined;
  }

  if (OPTIONAL_IDS.has(id) && raw.trim() === '') return undefined;

  switch (id) {
    case 'fullName': {
      const r = fullNameSchema.safeParse(raw);
      return r.success ? undefined : issueMessage(r.error);
    }
    case 'salutation': {
      const r = salutationSchema.safeParse(raw);
      return r.success ? undefined : issueMessage(r.error);
    }
    case 'birthDate': {
      const r = birthDateSchema.safeParse(raw);
      return r.success ? undefined : issueMessage(r.error);
    }
    case 'birthTime': {
      const r = birthTimeSchema.safeParse(raw);
      return r.success ? undefined : issueMessage(r.error);
    }
    case 'birthPlace':
    case 'celebrationPlace': {
      const r = placeSchema.safeParse(raw);
      return r.success ? undefined : issueMessage(r.error);
    }
    case 'email': {
      const r = emailSchema.safeParse(raw);
      return r.success ? undefined : issueMessage(r.error);
    }
    case 'socialHandle': {
      if (raw.trim().length > 80) return 'errors.socialHandle';
      return undefined;
    }
    case 'interestArea': {
      if (!(INTEREST_OPTIONS as readonly string[]).includes(raw)) return 'errors.select';
      return undefined;
    }
    case 'experienceLevel': {
      if (!(EXPERIENCE_OPTIONS as readonly string[]).includes(raw)) return 'errors.select';
      return undefined;
    }
    case 'relationshipStatus': {
      if (!(RELATIONSHIP_OPTIONS as readonly string[]).includes(raw)) return 'errors.select';
      return undefined;
    }
    case 'childrenCount': {
      if (!/^\d+$/.test(raw)) return 'errors.childrenCount';
      const n = Number(raw);
      if (n < 0 || n > 20) return 'errors.childrenCount';
      return undefined;
    }
    case 'workStatus': {
      if (!(WORK_OPTIONS as readonly string[]).includes(raw)) return 'errors.select';
      return undefined;
    }
    case 'occupation': {
      if (raw.trim().length > 120) return 'errors.occupation';
      return undefined;
    }
    case 'freeNote': {
      if (raw.length > 2000) return 'errors.freeNote';
      return undefined;
    }
    default:
      return undefined;
  }
}

export function validateFields(
  fieldIds: readonly FieldId[],
  values: Partial<Record<FieldId, string>>
): Partial<Record<FieldId, string>> {
  const errors: Partial<Record<FieldId, string>> = {};
  for (const id of fieldIds) {
    const err = validateField(id, values[id], values);
    if (err) errors[id] = err;
  }
  return errors;
}

export interface PlaceContext {
  places: Partial<Record<PlaceFieldId, PlaceResolution>>;
  /** Relaxes the resolution requirement when the geocoder could not be reached. */
  geocoderUnavailable: boolean;
}

/**
 * A place must be picked from the suggestions, because free text carries no
 * coordinates or timezone and so cannot produce a chart. The one exception is a
 * geocoder outage — losing the lead entirely would be worse than following up
 * for the location later.
 */
export function validatePlaceResolution(
  id: FieldId,
  value: string | undefined,
  context: PlaceContext
): string | undefined {
  if (!isPlaceFieldId(id)) return undefined;
  if (context.geocoderUnavailable) return undefined;

  const resolved = context.places[id];
  if (!resolved) return 'errors.place.unresolved';
  if (resolved.label !== (value ?? '')) return 'errors.place.unresolved';
  return undefined;
}

export function validateStep1(
  gift: GiftDefinition,
  values: Partial<Record<FieldId, string>>,
  context: PlaceContext = { places: {}, geocoderUnavailable: true }
): Partial<Record<FieldId, string>> {
  const errors = validateFields(gift.requiredFields, values);
  for (const id of gift.requiredFields) {
    if (errors[id]) continue;
    const placeError = validatePlaceResolution(id, values[id], context);
    if (placeError) errors[id] = placeError;
  }
  return errors;
}

export function validateStep2(
  gift: GiftDefinition,
  values: Partial<Record<FieldId, string>>
): Partial<Record<FieldId, string>> {
  const filled = gift.optionalFields.filter((id) => (values[id] ?? '').trim() !== '');
  return validateFields(filled, values);
}
