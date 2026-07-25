import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  validateField,
  validatePlaceResolution,
  validateStep1,
  validateStep2,
} from '../config/schemas';
import { isPlaceFieldId, type GiftDefinition } from '../types';
import type { FieldId, WizardAction, WizardState } from '../types';
import { useSessionDraft } from './useSessionDraft';

function createInitialState(): WizardState {
  return {
    status: 'editing',
    step: 1,
    values: {},
    places: {},
    geocoderUnavailable: false,
    touched: new Set(),
    errors: {},
    consentAccepted: false,
    birthTimeAssumedNoon: false,
    honeypot: '',
    blocker: null,
    blockerData: {},
    maskedEmail: null,
  };
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'RESTORE_DRAFT':
      return {
        ...state,
        values: { ...action.values },
        places: { ...(action.places ?? {}) },
        birthTimeAssumedNoon: action.birthTimeAssumedNoon ?? false,
      };
    case 'SET_FIELD': {
      const values = { ...state.values, [action.id]: action.value };
      const next: WizardState = { ...state, values };
      if (state.errors[action.id]) {
        const err = validateField(action.id, action.value, values);
        const errors = { ...state.errors };
        if (err) errors[action.id] = err;
        else delete errors[action.id];
        next.errors = errors;
      }
      if (action.id === 'birthTime' && action.value !== '12:00') {
        next.birthTimeAssumedNoon = false;
      }
      // Typing after picking a suggestion invalidates the coordinates — dropping
      // them here stops a stale lat/lon from riding along with edited text.
      if (isPlaceFieldId(action.id)) {
        const resolved = state.places[action.id];
        if (resolved && resolved.label !== action.value) {
          const places = { ...state.places };
          delete places[action.id];
          next.places = places;
        }
      }
      return next;
    }
    case 'SET_PLACE': {
      const errors = { ...state.errors };
      delete errors[action.id];
      return {
        ...state,
        values: { ...state.values, [action.id]: action.place.label },
        places: { ...state.places, [action.id]: action.place },
        errors,
      };
    }
    case 'SET_GEOCODER_UNAVAILABLE':
      return { ...state, geocoderUnavailable: action.unavailable };
    case 'BLUR_FIELD': {
      const touched = new Set(state.touched);
      touched.add(action.id);
      const errors = { ...state.errors };
      if (action.error) errors[action.id] = action.error;
      else delete errors[action.id];
      return { ...state, touched, errors };
    }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'TOUCH_FIELDS': {
      const touched = new Set(state.touched);
      for (const id of action.ids) touched.add(id);
      return { ...state, touched };
    }
    case 'GO_STEP':
      return {
        ...state,
        step: action.step,
        status: action.status ?? (action.step === 3 ? 'reviewing' : 'editing'),
        blocker: null,
      };
    case 'SET_CONSENT':
      return { ...state, consentAccepted: action.accepted };
    case 'SET_BIRTH_TIME_ASSUMED':
      return {
        ...state,
        birthTimeAssumedNoon: action.assumed,
        values: action.assumed
          ? { ...state.values, birthTime: '12:00' }
          : state.values,
      };
    case 'SET_HONEYPOT':
      return { ...state, honeypot: action.value };
    case 'START_SUBMIT':
      return { ...state, status: 'submitting', blocker: null };
    case 'SUBMIT_OK':
      return {
        ...state,
        status: 'sent',
        maskedEmail: action.maskedEmail,
        blocker: null,
      };
    case 'SET_BLOCKER':
      return {
        ...state,
        status: 'blocked',
        blocker: action.blocker,
        blockerData: action.data ?? {},
      };
    case 'CLEAR_BLOCKER':
      return { ...state, status: 'editing', blocker: null, blockerData: {} };
    case 'CLEAR_EMAIL_FIELDS': {
      const values = { ...state.values };
      delete values.email;
      delete values.emailConfirm;
      const errors = { ...state.errors };
      delete errors.email;
      delete errors.emailConfirm;
      return {
        ...state,
        status: 'editing',
        step: 1,
        values,
        errors,
        blocker: null,
        blockerData: {},
      };
    }
    case 'RETURN_TO_EDIT':
      return { ...state, status: 'editing', step: 1, blocker: null };
    default:
      return state;
  }
}

export function useGiftWizard(gift: GiftDefinition) {
  const [state, dispatch] = useReducer(wizardReducer, undefined, createInitialState);
  const { load, save, clear } = useSessionDraft(gift.slug);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = load();
    if (draft?.values) {
      dispatch({
        type: 'RESTORE_DRAFT',
        values: draft.values,
        places: draft.places,
        birthTimeAssumedNoon: draft.birthTimeAssumedNoon,
      });
    }
  }, [load]);

  // Browser back/forward moves between wizard steps instead of leaving the page.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = (event: PopStateEvent) => {
      const step = (event.state as { giftStep?: 1 | 2 | 3 } | null)?.giftStep;
      if (step === 1 || step === 2 || step === 3) {
        dispatch({
          type: 'GO_STEP',
          step,
          status: step === 3 ? 'reviewing' : 'editing',
        });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const historySeeded = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (state.status === 'submitting' || state.status === 'sent' || state.status === 'blocked') {
      return;
    }
    const current = (window.history.state as { giftStep?: number } | null)?.giftStep;
    if (current === state.step) return;
    if (!historySeeded.current) {
      historySeeded.current = true;
      window.history.replaceState({ giftStep: state.step }, '');
      return;
    }
    window.history.pushState({ giftStep: state.step }, '');
  }, [state.step, state.status]);

  const persistStep = useCallback(() => {
    save(state.values, state.places, state.birthTimeAssumedNoon);
  }, [save, state.values, state.places, state.birthTimeAssumedNoon]);

  const onChange = useCallback((id: FieldId, value: string) => {
    dispatch({ type: 'SET_FIELD', id, value });
  }, []);

  const onBlur = useCallback(
    (id: FieldId) => {
      const error =
        validateField(id, state.values[id], state.values) ??
        validatePlaceResolution(id, state.values[id], {
          places: state.places,
          geocoderUnavailable: state.geocoderUnavailable,
        });
      dispatch({ type: 'BLUR_FIELD', id, error });
    },
    [state.values, state.places, state.geocoderUnavailable]
  );

  const tryContinueFromStep1 = useCallback((): { ok: boolean; firstError?: FieldId } => {
    const errors = validateStep1(gift, state.values, {
      places: state.places,
      geocoderUnavailable: state.geocoderUnavailable,
    });
    dispatch({ type: 'TOUCH_FIELDS', ids: [...gift.requiredFields] });
    dispatch({ type: 'SET_ERRORS', errors });
    if (Object.keys(errors).length > 0) {
      const firstError = gift.requiredFields.find((id) => errors[id]);
      return { ok: false, firstError };
    }
    save(state.values, state.places, state.birthTimeAssumedNoon);
    dispatch({ type: 'GO_STEP', step: 2, status: 'editing' });
    return { ok: true };
  }, [gift, save, state.birthTimeAssumedNoon, state.values, state.places, state.geocoderUnavailable]);

  const tryContinueFromStep2 = useCallback(
    (skipped: boolean): { ok: boolean; firstError?: FieldId } => {
      if (!skipped) {
        const errors = validateStep2(gift, state.values);
        dispatch({ type: 'SET_ERRORS', errors });
        if (Object.keys(errors).length > 0) {
          const firstError = gift.optionalFields.find((id) => errors[id]);
          return { ok: false, firstError };
        }
      }
      save(state.values, state.places, state.birthTimeAssumedNoon);
      dispatch({ type: 'GO_STEP', step: 3, status: 'reviewing' });
      return { ok: true };
    },
    [gift, save, state.birthTimeAssumedNoon, state.values, state.places]
  );

  return {
    state,
    dispatch,
    onChange,
    onBlur,
    tryContinueFromStep1,
    tryContinueFromStep2,
    persistStep,
    clearDraft: clear,
  };
}
