export type GiftSlug = 'natal' | 'solar' | 'annual';

export type FieldId =
  | 'fullName'
  | 'salutation'
  | 'birthDate'
  | 'birthTime'
  | 'birthPlace'
  | 'celebrationPlace'
  | 'email'
  | 'emailConfirm'
  | 'socialHandle'
  | 'interestArea'
  | 'experienceLevel'
  | 'relationshipStatus'
  | 'childrenCount'
  | 'workStatus'
  | 'occupation'
  | 'freeNote';

export type FieldKind =
  | 'text'
  | 'email'
  | 'select'
  | 'date'
  | 'time'
  | 'place'
  | 'textarea'
  | 'number';

export interface FieldDef {
  id: FieldId;
  kind: FieldKind;
  copyKey: string;
  options?: readonly string[];
  autoComplete?: string;
  inputMode?: string;
}

/** A place the geocoder resolved — everything the chart engine needs about a location. */
export interface PlaceResolution {
  label: string;
  latitude: number;
  longitude: number;
  /** IANA zone, e.g. `Europe/Belgrade`. Required to turn a wall clock into an instant. */
  timezone: string;
  countryCode?: string;
}

/** Field ids that carry a geocoded resolution alongside their text value. */
export const PLACE_FIELD_IDS = ['birthPlace', 'celebrationPlace'] as const;
export type PlaceFieldId = (typeof PLACE_FIELD_IDS)[number];

export function isPlaceFieldId(id: FieldId): id is PlaceFieldId {
  return (PLACE_FIELD_IDS as readonly FieldId[]).includes(id);
}

export interface EligibilityRule {
  kind: 'birthdayWindow';
  daysBefore: number;
  daysAfter: number;
}

export interface GiftDefinition {
  slug: GiftSlug;
  copyKey: string;
  badge?: 'new';
  accentClass: string;
  requiredFields: readonly FieldId[];
  optionalFields: readonly FieldId[];
  eligibility?: EligibilityRule;
  fallbackGift?: GiftSlug;
  capacityPolicy: 'daily' | 'none';
}

export type WizardStatus =
  | 'editing'
  | 'reviewing'
  | 'submitting'
  | 'sent'
  | 'blocked';

export type BlockerKind =
  | 'capacityPaused'
  | 'dailyCap'
  | 'duplicateEmail'
  | 'ineligible'
  | 'networkError';

export interface WizardState {
  status: WizardStatus;
  step: 1 | 2 | 3;
  values: Partial<Record<FieldId, string>>;
  /** Geocoded coordinates + timezone for the place fields, keyed by field id. */
  places: Partial<Record<PlaceFieldId, PlaceResolution>>;
  /**
   * Set when the geocoder could not be reached. Place resolution is required
   * normally, but an outage must not block the funnel, so this relaxes it.
   */
  geocoderUnavailable: boolean;
  touched: Set<FieldId>;
  errors: Partial<Record<FieldId, string>>;
  consentAccepted: boolean;
  birthTimeAssumedNoon: boolean;
  honeypot: string;
  blocker: BlockerKind | null;
  blockerData: Record<string, unknown>;
  maskedEmail: string | null;
}

export type WizardAction =
  | {
      type: 'RESTORE_DRAFT';
      values: Partial<Record<FieldId, string>>;
      places?: Partial<Record<PlaceFieldId, PlaceResolution>>;
      birthTimeAssumedNoon?: boolean;
    }
  | { type: 'SET_FIELD'; id: FieldId; value: string }
  | { type: 'SET_PLACE'; id: PlaceFieldId; place: PlaceResolution }
  | { type: 'SET_GEOCODER_UNAVAILABLE'; unavailable: boolean }
  | { type: 'BLUR_FIELD'; id: FieldId; error?: string }
  | { type: 'SET_ERRORS'; errors: Partial<Record<FieldId, string>> }
  | { type: 'TOUCH_FIELDS'; ids: FieldId[] }
  | { type: 'GO_STEP'; step: 1 | 2 | 3; status?: WizardStatus }
  | { type: 'SET_CONSENT'; accepted: boolean }
  | { type: 'SET_BIRTH_TIME_ASSUMED'; assumed: boolean }
  | { type: 'SET_HONEYPOT'; value: string }
  | { type: 'START_SUBMIT' }
  | { type: 'SUBMIT_OK'; maskedEmail: string }
  | { type: 'SET_BLOCKER'; blocker: BlockerKind; data?: Record<string, unknown> }
  | { type: 'CLEAR_BLOCKER' }
  | { type: 'CLEAR_EMAIL_FIELDS' }
  | { type: 'RETURN_TO_EDIT' };

export const CONSENT_VERSION = 'gift-consent-v1';

/**
 * Everything the chart engine needs, resolved client-side while the birth
 * location is still known. `calculatePositions(date, lat, lon)` cannot be called
 * from `values` alone — see `lib/birthInstant.ts`.
 */
export interface AstroPayload {
  /** Absolute instant of birth, ISO-8601 UTC. Null if it could not be resolved. */
  birthInstantUtc: string | null;
  birthTimeZone: string | null;
  birthOffsetMinutes: number | null;
  birthPlace: PlaceResolution | null;
  /** Solar-return location. Only present for gifts that ask for it. */
  celebrationPlace: PlaceResolution | null;
  /** False when a place was accepted as free text during a geocoder outage. */
  placesResolved: boolean;
}

export interface GiftSubmitPayload {
  gift: GiftSlug;
  values: Partial<Record<FieldId, string>>;
  astro: AstroPayload;
  consent: { privacy: true; terms: true; version: string };
  meta: {
    elapsedSeconds: number;
    honeypot: string;
    utm: Record<string, string>;
    referrer: string;
    birthTimeAssumedNoon: boolean;
  };
}

export interface CapacityResponse {
  open: boolean;
  paused: boolean;
  resumeDate?: string;
  message?: string;
}

export type SubmitResponse =
  | { status: 'ok'; maskedEmail: string }
  | { status: 'duplicate'; maskedEmail: string }
  | { status: 'daily_cap' }
  | { status: 'paused'; resumeDate?: string }
  | { status: 'invalid'; fieldErrors: Record<string, string> };

export type VerifyResponse = { status: 'ok' | 'expired' | 'invalid' };

export type SuggestionResponse = { status: 'ok' };
