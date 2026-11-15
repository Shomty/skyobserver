import { useCallback, useState } from 'react';
import { fetchPlanetPositions } from '../../../services/positionsService';
import { fetchVimshottariDashas } from '../../../services/dashasService';
import { validateField, validatePlaceResolution } from '../../gift/config/schemas';
import { resolveBirthInstant } from '../../gift/lib/birthInstant';
import type { FieldId, PlaceResolution } from '../../gift/types';
import { withCareerKaalVelas } from '../../career/lib/careerKaalVelas';
import { trackYearEvent } from '../lib/analytics';
import { buildYearReading, type YearReading } from '../lib/yearEngine';
import { normalizeYearEmail, yearReportFingerprint } from '../lib/yearFingerprint';
import { loadYearReport, saveYearReport, type YearReportLoadResult } from '../lib/yearReportApi';
import { clearYearSynthesisSession, type YearAiSynthesis } from '../lib/yearSynthesisService';

const FORM_FIELDS: FieldId[] = ['fullName', 'email', 'birthDate', 'birthTime', 'birthPlace'];

export interface YearFormState {
  values: Partial<Record<FieldId, string>>;
  places: Partial<Record<'birthPlace', PlaceResolution>>;
  errors: Partial<Record<FieldId, string>>;
  geocoderUnavailable: boolean;
  birthTimeAssumedNoon: boolean;
  honeypot: string;
}

const initialState: YearFormState = {
  values: {},
  places: {},
  errors: {},
  geocoderUnavailable: false,
  birthTimeAssumedNoon: false,
  honeypot: '',
};

export function useYearCalculator() {
  const [form, setForm] = useState<YearFormState>(initialState);
  const [reading, setReading] = useState<YearReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [reportEmail, setReportEmail] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [birthFingerprint, setBirthFingerprint] = useState<string | null>(null);
  const [aiSynthesis, setAiSynthesis] = useState<YearAiSynthesis | null>(null);

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
    if (form.honeypot) trackYearEvent('year_honeypot_filled');
    if (!validateForm()) return null;

    const birthPlace = form.places.birthPlace;
    if (!birthPlace) return null;

    const email = normalizeYearEmail(form.values.email ?? '');
    const birthTime = form.birthTimeAssumedNoon ? '12:00' : (form.values.birthTime ?? '');
    const instant = resolveBirthInstant(form.values.birthDate ?? '', birthTime, birthPlace.timezone);
    if (!instant) {
      setError('Could not resolve birth time. Please pick your city from the list.');
      return null;
    }

    setLoading(true);
    setError(null);
    setFromCache(false);
    setReportEmail(email);
    trackYearEvent('year_form_submitted', { email });

    try {
      const birthDate = new Date(instant.iso);
      const [chartPositions, dashas] = await Promise.all([
        fetchPlanetPositions(birthDate, birthPlace.latitude, birthPlace.longitude),
        fetchVimshottariDashas(birthDate, birthPlace.latitude, birthPlace.longitude, birthPlace.timezone),
      ]);
      const enriched = withCareerKaalVelas(
        chartPositions,
        birthDate,
        birthPlace.latitude,
        birthPlace.longitude,
        instant.offsetMinutes,
      );
      const now = new Date();
      const fingerprint = yearReportFingerprint(
        instant,
        birthPlace,
        now.getUTCFullYear(),
        dashas.current.mahadasha?.planet ?? 'Unknown',
        dashas.current.antardasha?.planet ?? 'Unknown',
      );
      setBirthFingerprint(fingerprint);

      let cached: YearReportLoadResult | null = null;
      try {
        cached = await loadYearReport(email, fingerprint);
      } catch (loadErr) {
        trackYearEvent('year_error', { phase: 'load', message: String(loadErr) });
      }

      if (cached?.hit && cached.snapshot && cached.positions && cached.reportId) {
        setReading(cached.snapshot);
        setReportId(cached.reportId);
        setCachedAt(cached.cachedAt ?? null);
        setAiSynthesis(cached.aiSynthesis ?? null);
        setFromCache(true);
        trackYearEvent('year_result_shown', { fromCache: true, reportId: cached.reportId, year: cached.snapshot.year });
        return cached.reportId;
      }

      const result = buildYearReading(enriched, dashas, now);
      setReading(result);
      setAiSynthesis(null);
      setFromCache(false);

      let savedReportId: string | null = null;
      try {
        const saved = await saveYearReport({
          email,
          fingerprint,
          fullName: form.values.fullName,
          birthDate: form.values.birthDate,
          birthTime: form.values.birthTime,
          birthPlaceLabel: birthPlace.label,
          birthInstant: instant,
          snapshot: result,
          positions: enriched,
        });
        savedReportId = saved.reportId;
        setReportId(saved.reportId);
        setCachedAt(saved.cachedAt ?? new Date().toISOString());
        trackYearEvent('year_report_saved', { reportId: saved.reportId });
      } catch (saveErr) {
        trackYearEvent('year_error', { phase: 'save', message: String(saveErr) });
      }

      trackYearEvent('year_result_shown', { fromCache: false, reportId: savedReportId, year: result.year });
      return savedReportId;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      trackYearEvent('year_error', { message: String(e) });
      return null;
    } finally {
      setLoading(false);
    }
  }, [form, validateForm]);

  const reset = useCallback(() => {
    clearYearSynthesisSession(reportEmail ?? undefined);
    setReading(null);
    setError(null);
    setFromCache(false);
    setReportEmail(null);
    setReportId(null);
    setCachedAt(null);
    setBirthFingerprint(null);
    setAiSynthesis(null);
    setForm(initialState);
  }, [reportEmail]);

  const loadSharedReport = useCallback((record: YearReportLoadResult & { reportId: string }) => {
    if (!record.snapshot) return;
    setReading(record.snapshot);
    setReportId(record.reportId);
    setCachedAt(record.cachedAt ?? null);
    setBirthFingerprint(record.fingerprint ?? null);
    setAiSynthesis(record.aiSynthesis ?? null);
    setFromCache(true);
    if (record.email) setReportEmail(normalizeYearEmail(record.email));
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
  }, []);

  return {
    form,
    setField,
    setPlace,
    blurField,
    setGeocoderUnavailable: (unavailable: boolean) =>
      setForm((prev) => ({ ...prev, geocoderUnavailable: unavailable })),
    setBirthTimeAssumedNoon: (assumed: boolean) =>
      setForm((prev) => ({ ...prev, birthTimeAssumedNoon: assumed })),
    setHoneypot: (honeypot: string) => setForm((prev) => ({ ...prev, honeypot })),
    reading,
    loading,
    error,
    calculate,
    reset,
    reportId,
    cachedAt,
    loadSharedReport,
    reportEmail,
    birthFingerprint,
    aiSynthesis,
    fromCache,
    applyCachedSynthesis: setAiSynthesis,
    fullName: form.values.fullName,
  };
}
