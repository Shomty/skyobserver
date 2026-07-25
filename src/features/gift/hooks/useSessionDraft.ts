import { useCallback } from 'react';
import type { FieldId, GiftSlug, PlaceFieldId, PlaceResolution } from '../types';

const draftKey = (slug: GiftSlug) => `gift:draft:${slug}`;

export interface DraftPayload {
  values: Partial<Record<FieldId, string>>;
  /** Resolved coordinates travel with the draft so a refresh keeps the chart usable. */
  places?: Partial<Record<PlaceFieldId, PlaceResolution>>;
  birthTimeAssumedNoon?: boolean;
}

export function useSessionDraft(slug: GiftSlug) {
  const load = useCallback((): DraftPayload | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(draftKey(slug));
      if (!raw) return null;
      return JSON.parse(raw) as DraftPayload;
    } catch {
      return null;
    }
  }, [slug]);

  const save = useCallback(
    (
      values: Partial<Record<FieldId, string>>,
      places: Partial<Record<PlaceFieldId, PlaceResolution>>,
      birthTimeAssumedNoon: boolean
    ) => {
      if (typeof window === 'undefined') return;
      try {
        const payload: DraftPayload = { values, places, birthTimeAssumedNoon };
        sessionStorage.setItem(draftKey(slug), JSON.stringify(payload));
      } catch {
        // ignore
      }
    },
    [slug]
  );

  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(draftKey(slug));
    } catch {
      // ignore
    }
  }, [slug]);

  return { load, save, clear };
}

/** Persist values under a target slug (e.g. eligibility fallback carry-over). */
export function writeDraftForSlug(
  slug: GiftSlug,
  values: Partial<Record<FieldId, string>>,
  places: Partial<Record<PlaceFieldId, PlaceResolution>> = {},
  birthTimeAssumedNoon = false
): void {
  try {
    sessionStorage.setItem(
      draftKey(slug),
      JSON.stringify({ values, places, birthTimeAssumedNoon } satisfies DraftPayload)
    );
  } catch {
    // ignore
  }
}
