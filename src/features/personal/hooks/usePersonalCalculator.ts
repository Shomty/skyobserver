import { useCallback, useState } from 'react';
import { fetchPlanetPositions } from '../../../services/positionsService';
import { fetchVimshottariDashas } from '../../../services/dashasService';
import type { PlaceResolution } from '../../gift/types';
import { resolveBirthInstant } from '../../gift/lib/birthInstant';
import { validateField, validatePlaceResolution } from '../../gift/config/schemas';
import type { FieldId } from '../../gift/types';
import type { PlanetPosition } from '../../../vedic-utils';
import { withCareerKaalVelas } from '../../career/lib/careerKaalVelas';
import { buildPersonalSnapshot, rehydratePersonalSnapshot } from '../lib/personalEngine';
import { personalBirthFingerprint, normalizePersonalEmail } from '../lib/personalFingerprint';
import { loadPersonalReport, savePersonalReport } from '../lib/personalReportApi';
import type { PersonalReportLoadResult } from '../lib/personalReportApi';
import { trackPersonalEvent } from '../lib/analytics';
import { clearPersonalGuidanceSession } from '../lib/personalGuidanceService';
import type { PersonalAiGuidance, PersonalSnapshot } from '../types';

const FORM_FIELDS: FieldId[] = ['fullName', 'email', 'birthDate', 'birthTime', 'birthPlace'];

export interface PersonalFormState {
  values: Partial<Record<FieldId, string>>;
  places: Partial<Record<'birthPlace', PlaceResolution>>;
  errors: Partial<Record<FieldId, string>>;
  geocoderUnavailable: boolean;
  birthTimeAssumedNoon: boolean;
  honeypot: string;
}

const initialState: PersonalFormState = {
  values: {},
  places: {},
  errors: {},
  geocoderUnavailable: false,
  birthTimeAssumedNoon: false,
  honeypot: '',
};

export function usePersonalCalculator() {
  const [form, setForm] = useState<PersonalFormState>(initialState);
  const [snapshot, setSnapshot] = useState<PersonalSnapshot | null>(null);
  const [positions, setPositions] = useState<PlanetPosition[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportEmail, setReportEmail] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [birthFingerprint, setBirthFingerprint] = useState<string | null>(null);
  const [aiSynthesis, setAiSynthesis] = useState<PersonalAiGuidance | null>(null);

  const setField = useCallback((id: FieldId, value: string) => {
    setForm((prev) => ({
      ...prev,
      values: { ...prev.values, [id]: value },
      places: id === 'birthPlace' && prev.places.birthPlace?.label !== value ? {} : prev.places,
      errors: { ...prev.errors, [id]: undefined },
    }));
  }, []);

  const setPlace = useCallback((place: PlaceResolution) => {
    setForm((prev) => ({
      ...prev,
      values: { ...prev.values, birthPlace: place.label },
      places: { birthPlace: place },
      errors: { ...prev.errors, birthPlace: undefined },
    }));
  }, []);

  const blurField = useCallback((id: FieldId) => {
    setForm((prev) => {
      const err = validateField(id, prev.values[id], prev.values);
      return { ...prev, errors: { ...prev.errors, [id]: err } };
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<FieldId, string>> = {};
    for (const id of FORM_FIELDS) {
      const err = validateField(id, form.values[id], form.values);
      if (err) errors[id] = err;
    }
    const placeErr = validatePlaceResolution('birthPlace', form.values.birthPlace, {
      places: form.places,
      geocoderUnavailable: form.geocoderUnavailable,
    });
    if (placeErr) errors.birthPlace = placeErr;

    setForm((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [form.geocoderUnavailable, form.places, form.values]);

  const calculate = useCallback(async (): Promise<string | null> => {
    if (form.honeypot) {
      trackPersonalEvent('personal_honeypot_filled', { value: form.honeypot.slice(0, 40) });
    }
    if (!validateForm()) return null;

    const birthPlace = form.places.birthPlace;
    if (!birthPlace && !form.geocoderUnavailable) {
      setForm((prev) => ({
        ...prev,
        errors: { ...prev.errors, birthPlace: 'errors.place.unresolved' },
      }));
      return null;
    }

    const email = normalizePersonalEmail(form.values.email ?? '');
    const birthTime = form.birthTimeAssumedNoon ? '12:00' : (form.values.birthTime ?? '');
    const instant = birthPlace
      ? resolveBirthInstant(form.values.birthDate ?? '', birthTime, birthPlace.timezone)
      : null;

    if (!instant || !birthPlace) {
      setError('Could not resolve birth time. Please pick your city from the list.');
      return null;
    }

    const fingerprint = personalBirthFingerprint(instant, birthPlace);
    setBirthFingerprint(fingerprint);

    setLoading(true);
    setError(null);
    setReportEmail(email);
    trackPersonalEvent('personal_form_submitted', { name: form.values.fullName, email });

    try {
      let cached: PersonalReportLoadResult | null = null;
      try {
        cached = await loadPersonalReport(email, fingerprint);
      } catch (loadErr) {
        trackPersonalEvent('personal_error', { message: String(loadErr), phase: 'load' });
      }

      if (cached?.hit && cached.snapshot && cached.positions && cached.reportId) {
        setSnapshot(rehydratePersonalSnapshot(cached.snapshot));
        setPositions(cached.positions);
        setReportId(cached.reportId);
        setCachedAt(cached.cachedAt ?? null);
        setAiSynthesis(cached.aiSynthesis ?? null);
        if (cached.fullName && !form.values.fullName) {
          setForm((prev) => ({ ...prev, values: { ...prev.values, fullName: cached.fullName } }));
        }
        trackPersonalEvent('personal_result_shown', { fromCache: true, reportId: cached.reportId });
        return cached.reportId;
      }

      const birthDate = new Date(instant.iso);
      const [chartPositions, dashas] = await Promise.all([
        fetchPlanetPositions(birthDate, birthPlace.latitude, birthPlace.longitude),
        fetchVimshottariDashas(birthDate, birthPlace.latitude, birthPlace.longitude, birthPlace.timezone),
      ]);

      const positionsWithUpagrahas = withCareerKaalVelas(
        chartPositions,
        birthDate,
        birthPlace.latitude,
        birthPlace.longitude,
        instant.offsetMinutes,
      );

      const result = buildPersonalSnapshot(positionsWithUpagrahas, dashas, instant, new Date());
      setPositions(chartPositions);
      setSnapshot(result);
      setAiSynthesis(null);

      let savedReportId: string | null = null;
      try {
        const saved = await savePersonalReport({
          email,
          fingerprint,
          fullName: form.values.fullName,
          birthDate: form.values.birthDate,
          birthTime: form.values.birthTime,
          birthPlaceLabel: birthPlace.label,
          birthInstant: instant,
          snapshot: result,
          positions: chartPositions,
        });
        savedReportId = saved.reportId;
        setReportId(saved.reportId);
        setCachedAt(saved.cachedAt ?? new Date().toISOString());
        trackPersonalEvent('personal_report_saved', { email, reportId: saved.reportId });
      } catch (saveErr) {
        trackPersonalEvent('personal_error', { message: String(saveErr), phase: 'save' });
      }

      trackPersonalEvent('personal_result_shown', { fromCache: false, reportId: savedReportId });
      return savedReportId;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      trackPersonalEvent('personal_error', { message: String(e) });
      return null;
    } finally {
      setLoading(false);
    }
  }, [form, validateForm]);

  const reset = useCallback(() => {
    clearPersonalGuidanceSession(reportEmail ?? undefined);
    setSnapshot(null);
    setPositions(null);
    setError(null);
    setReportEmail(null);
    setReportId(null);
    setCachedAt(null);
    setBirthFingerprint(null);
    setAiSynthesis(null);
    setForm(initialState);
  }, [reportEmail]);

  const loadSharedReport = useCallback(
    (record: {
      reportId: string;
      snapshot: PersonalSnapshot;
      positions: PlanetPosition[];
      fingerprint?: string;
      aiSynthesis?: PersonalAiGuidance;
      cachedAt?: string;
      fullName?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlaceLabel?: string;
      email?: string;
    }) => {
      setSnapshot(rehydratePersonalSnapshot(record.snapshot));
      setPositions(record.positions);
      setReportId(record.reportId);
      setCachedAt(record.cachedAt ?? null);
      setBirthFingerprint(record.fingerprint ?? null);
      setAiSynthesis(record.aiSynthesis ?? null);
      if (record.email) setReportEmail(normalizePersonalEmail(record.email));
      setForm((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          fullName: record.fullName ?? prev.values.fullName,
          email: record.email ?? prev.values.email,
          birthDate: record.birthDate ?? prev.values.birthDate,
          birthTime: record.birthTime ?? prev.values.birthTime,
          birthPlace: record.birthPlaceLabel ?? prev.values.birthPlace,
        },
      }));
    },
    [],
  );

  return {
    form,
    setField,
    setPlace,
    blurField,
    setGeocoderUnavailable: (unavailable: boolean) =>
      setForm((prev) => ({ ...prev, geocoderUnavailable: unavailable })),
    setBirthTimeAssumedNoon: (assumed: boolean) =>
      setForm((prev) => ({
        ...prev,
        birthTimeAssumedNoon: assumed,
        values: assumed ? { ...prev.values, birthTime: '12:00' } : prev.values,
      })),
    setHoneypot: (value: string) => setForm((prev) => ({ ...prev, honeypot: value })),
    snapshot,
    positions,
    loading,
    error,
    reportEmail,
    reportId,
    cachedAt,
    birthFingerprint,
    aiSynthesis,
    calculate,
    reset,
    loadSharedReport,
  };
}
