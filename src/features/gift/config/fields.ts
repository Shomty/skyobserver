import type { FieldDef, FieldId } from '../types';

export const SALUTATION_OPTIONS = [
  'salutation.ms',
  'salutation.mrs',
  'salutation.mr',
  'salutation.mx',
  'salutation.none',
] as const;

export const INTEREST_OPTIONS = [
  'interest.self',
  'interest.career',
  'interest.relationships',
  'interest.timing',
  'interest.spiritual',
] as const;

export const EXPERIENCE_OPTIONS = [
  'experience.new',
  'experience.some',
  'experience.practiced',
] as const;

export const RELATIONSHIP_OPTIONS = [
  'relationship.single',
  'relationship.partnered',
  'relationship.married',
  'relationship.complicated',
  'relationship.preferNot',
] as const;

export const WORK_OPTIONS = [
  'work.employed',
  'work.selfEmployed',
  'work.student',
  'work.seeking',
  'work.other',
] as const;

export const FIELD_REGISTRY: Record<FieldId, FieldDef> = {
  fullName: {
    id: 'fullName',
    kind: 'text',
    copyKey: 'fields.fullName',
    autoComplete: 'name',
  },
  salutation: {
    id: 'salutation',
    kind: 'select',
    copyKey: 'fields.salutation',
    options: SALUTATION_OPTIONS,
  },
  birthDate: {
    id: 'birthDate',
    kind: 'date',
    copyKey: 'fields.birthDate',
    autoComplete: 'bday',
  },
  birthTime: {
    id: 'birthTime',
    kind: 'time',
    copyKey: 'fields.birthTime',
  },
  birthPlace: {
    id: 'birthPlace',
    kind: 'place',
    copyKey: 'fields.birthPlace',
    autoComplete: 'address-level2',
  },
  celebrationPlace: {
    id: 'celebrationPlace',
    kind: 'place',
    copyKey: 'fields.celebrationPlace',
    autoComplete: 'address-level2',
  },
  email: {
    id: 'email',
    kind: 'email',
    copyKey: 'fields.email',
    autoComplete: 'email',
    inputMode: 'email',
  },
  emailConfirm: {
    id: 'emailConfirm',
    kind: 'email',
    copyKey: 'fields.emailConfirm',
    autoComplete: 'email',
    inputMode: 'email',
  },
  socialHandle: {
    id: 'socialHandle',
    kind: 'text',
    copyKey: 'fields.socialHandle',
    autoComplete: 'username',
  },
  interestArea: {
    id: 'interestArea',
    kind: 'select',
    copyKey: 'fields.interestArea',
    options: INTEREST_OPTIONS,
  },
  experienceLevel: {
    id: 'experienceLevel',
    kind: 'select',
    copyKey: 'fields.experienceLevel',
    options: EXPERIENCE_OPTIONS,
  },
  relationshipStatus: {
    id: 'relationshipStatus',
    kind: 'select',
    copyKey: 'fields.relationshipStatus',
    options: RELATIONSHIP_OPTIONS,
  },
  childrenCount: {
    id: 'childrenCount',
    kind: 'number',
    copyKey: 'fields.childrenCount',
    inputMode: 'numeric',
  },
  workStatus: {
    id: 'workStatus',
    kind: 'select',
    copyKey: 'fields.workStatus',
    options: WORK_OPTIONS,
  },
  occupation: {
    id: 'occupation',
    kind: 'text',
    copyKey: 'fields.occupation',
    autoComplete: 'organization-title',
  },
  freeNote: {
    id: 'freeNote',
    kind: 'textarea',
    copyKey: 'fields.freeNote',
  },
};

export function getField(id: FieldId): FieldDef {
  return FIELD_REGISTRY[id];
}
