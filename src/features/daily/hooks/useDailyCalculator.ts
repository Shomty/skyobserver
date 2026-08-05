import { useCallback, useState } from 'react';
import { fetchPlanetPositions } from '../../../services/positionsService';
import { fetchVimshottariDashas } from '../../../services/dashasService';
import type { PlaceResolution } from '../../gift/types';
import { resolveBirthInstant } from '../../gift/lib/birthInstant';
import { validateField, validatePlaceResolution } from '../../gift/config/schemas';
import type { FieldId } from '../../gift/types';
import type { PlanetPosition } from '../../../vedic-utils';
import { buildDailySnapshot, enrichNatalPositions } from '../lib/dailyEngine';
import { dailyReportFingerprint, normalizeDailyEmail } from '../lib/dailyFingerprint';
import { loadDailyReport, saveDailyReport } from '../lib/dailyReportApi';
import type { DailyReportLoadResult } from '../lib/dailyReportApi';
import { trackDailyEvent } from '../lib/analytics';
import { clearDailyGuidanceSession } from '../lib/dailyGuidanceService';
import type { DailyAiPlainGuidance, DailySnapshot } from '../types';
import { readDailyViewMode, writeDailyViewMode, type DailyViewMode } from '../lib/dailyViewMode';

const FORM_FIELDS: FieldId[] = ['fullName', 'email', 'birthDate', 'birthTime', 'birthPlace'];

export interface DailyFormState {
  values: Partial<Record<FieldId, string>>;
  places: Partial<Record<'birthPlace', PlaceResolution>>;
  currentPlace: PlaceResolution | null;
  currentPlaceText: string;
  errors: Partial<Record<FieldId | 'currentPlace', string>>;
  geocoderUnavailable: boolean;
  birthTimeAssumedNoon: boolean;
  honeypot: string;
  viewMode: DailyViewMode;
}

const initialState: DailyFormState = {
  values: {},
  places: {},
  currentPlace: null,
  currentPlaceText: '',
  errors: {},
  geocoderUnavailable: false,
  birthTimeAssumedNoon: false,
  honeypot: '',
  viewMode: readDailyViewMode(),
};

export function useDailyCalculator() {
  const [form, setForm] = useState<DailyFormState>(initialState);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [positions, setPositions] = useState<PlanetPosition[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [reportEmail, setReportEmail] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [birthFingerprint, setBirthFingerprint] = useState<string | null>(null);
  const [aiGuidance, setAiGuidance] = useState<DailyAiPlainGuidance | null>(null);

  const setField = useCallback((id: FieldId, value: string) => {
    setForm((prev) => ({
      ...prev,
      values: { ...prev.values, [id]: value },
      places: id === 'birthPlace' && prev.places.birthPlace?.label !== value ? {} : prev.places,
      errors: { ...prev.errors, [id]: undefined },
    }));
  }, []);

  const setPlace = useCallback((place: PlaceResolution) => {
    setForm((prev) => {
      const fillCurrent = !prev.currentPlace;
      return {
        ...prev,
        values: { ...prev.values, birthPlace: place.label },
        places: { birthPlace: place },
        errors: { ...prev.errors, birthPlace: undefined, ...(fillCurrent ? { currentPlace: undefined } : {}) },
        ...(fillCurrent
          ? { currentPlace: place, currentPlaceText: place.label }
          : {}),
      };
    });
  }, []);

  const setCurrentPlace = useCallback((place: PlaceResolution) => {
    setForm((prev) => ({
      ...prev,
      currentPlace: place,
      currentPlaceText: place.label,
      errors: { ...prev.errors, currentPlace: undefined },
    }));
  }, []);

  const setCurrentPlaceText = useCallback((text: string) => {
    setForm((prev) => ({
      ...prev,
      currentPlaceText: text,
      currentPlace: prev.currentPlace?.label === text ? prev.currentPlace : null,
      errors: { ...prev.errors, currentPlace: undefined },
    }));
  }, []);

  const setViewMode = useCallback((mode: DailyViewMode) => {
    writeDailyViewMode(mode);
    setForm((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const blurField = useCallback((id: FieldId) => {
    setForm((prev) => {
      const err = validateField(id, prev.values[id], prev.values);
      return { ...prev, errors: { ...prev.errors, [id]: err } };
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<FieldId | 'currentPlace', string>> = {};
    for (const id of FORM_FIELDS) {
      const err = validateField(id, form.values[id], form.values);
      if (err) errors[id] = err;
    }
    const placeErr = validatePlaceResolution('birthPlace', form.values.birthPlace, {
      places: form.places,
      geocoderUnavailable: form.geocoderUnavailable,
    });
    if (placeErr) errors.birthPlace = placeErr;

    if (!form.currentPlace) {
      errors.currentPlace = 'errors.place.unresolved';
    }

    setForm((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [form.geocoderUnavailable, form.places, form.values, form.currentPlace]);

  const calculate = useCallback(async (): Promise<string | null> => {
    if (form.honeypot) {
      trackDailyEvent('daily_honeypot_filled');
    }
    if (!validateForm()) return null;

    const birthPlace = form.places.birthPlace;
    const currentPlace = form.currentPlace;
    if (!birthPlace || !currentPlace) return null;

    const email = normalizeDailyEmail(form.values.email ?? '');
    const birthTime = form.birthTimeAssumedNoon ? '12:00' : (form.values.birthTime ?? '');
    const instant = resolveBirthInstant(form.values.birthDate ?? '', birthTime, birthPlace.timezone);
    if (!instant) {
      setError('Could not resolve birth time. Please pick your city from the list.');
      return null;
    }

    const now = new Date();
    const fingerprint = dailyReportFingerprint(instant, birthPlace, currentPlace, now);
    setBirthFingerprint(fingerprint);

    setLoading(true);
    setError(null);
    setFromCache(false);
    setReportEmail(email);
    trackDailyEvent('daily_form_submitted', { email });

    try {
      let cached: DailyReportLoadResult | null = null;
      try {
        cached = await loadDailyReport(email, fingerprint);
      } catch (loadErr) {
        trackDailyEvent('daily_error', { phase: 'load', message: String(loadErr) });
      }

      if (cached?.hit && cached.snapshot && cached.positions && cached.reportId) {
        setSnapshot(cached.snapshot);
        setPositions(cached.positions);
        setReportId(cached.reportId);
        setCachedAt(cached.cachedAt ?? null);
        setAiGuidance(cached.aiGuidance ?? null);
        setFromCache(true);
        trackDailyEvent('daily_result_shown', { fromCache: true, reportId: cached.reportId });
        return cached.reportId;
      }

      const birthDate = new Date(instant.iso);
      const [chartPositions, dashas] = await Promise.all([
        fetchPlanetPositions(birthDate, birthPlace.latitude, birthPlace.longitude),
        fetchVimshottariDashas(
          birthDate,
          birthPlace.latitude,
          birthPlace.longitude,
          birthPlace.timezone,
        ),
      ]);

      const enriched = enrichNatalPositions(
        chartPositions,
        birthDate,
        birthPlace,
        instant.offsetMinutes,
      );

      const result = await buildDailySnapshot(
        chartPositions,
        enriched,
        dashas,
        instant,
        currentPlace,
        now,
      );

      setPositions(chartPositions);
      setSnapshot(result);
      setAiGuidance(null);
      setFromCache(false);

      let savedReportId: string | null = null;
      try {
        const saved = await saveDailyReport({
          email,
          fingerprint,
          fullName: form.values.fullName,
          birthDate: form.values.birthDate,
          birthTime: form.values.birthTime,
          birthPlaceLabel: birthPlace.label,
          currentPlaceLabel: currentPlace.label,
          birthInstant: instant,
          snapshot: {
            ...result,
            careerReading: undefined,
            personalReading: undefined,
          },
          positions: chartPositions,
        });
        savedReportId = saved.reportId;
        setReportId(saved.reportId);
        setCachedAt(saved.cachedAt ?? new Date().toISOString());
        trackDailyEvent('daily_report_saved', { reportId: saved.reportId });
      } catch (saveErr) {
        trackDailyEvent('daily_error', { phase: 'save', message: String(saveErr) });
      }

      trackDailyEvent('daily_result_shown', { fromCache: false, reportId: savedReportId });
      return savedReportId;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      trackDailyEvent('daily_error', { message: String(e) });
      return null;
    } finally {
      setLoading(false);
    }
  }, [form, validateForm]);

  const reset = useCallback(() => {
    clearDailyGuidanceSession(reportEmail ?? undefined);
    setSnapshot(null);
    setPositions(null);
    setError(null);
    setFromCache(false);
    setReportEmail(null);
    setReportId(null);
    setCachedAt(null);
    setBirthFingerprint(null);
    setAiGuidance(null);
    setForm(initialState);
  }, [reportEmail]);

  const loadSharedReport = useCallback(
    (record: {
      reportId: string;
      snapshot: DailySnapshot;
      positions: PlanetPosition[];
      fingerprint?: string;
      aiGuidance?: DailyAiPlainGuidance;
      cachedAt?: string;
      fullName?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlaceLabel?: string;
      currentPlaceLabel?: string;
      email?: string;
    }) => {
      setSnapshot(record.snapshot);
      setPositions(record.positions);
      setReportId(record.reportId);
      setCachedAt(record.cachedAt ?? null);
      setBirthFingerprint(record.fingerprint ?? null);
      setAiGuidance(record.aiGuidance ?? null);
      setFromCache(true);
      if (record.email) setReportEmail(normalizeDailyEmail(record.email));
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
        currentPlaceText: record.currentPlaceLabel ?? prev.currentPlaceText,
      }));
    },
    [],
  );

  return {
    form,
    setField,
    setPlace,
    setCurrentPlace,
    setCurrentPlaceText,
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
    viewMode: form.viewMode,
    setViewMode,
    snapshot,
    positions,
    loading,
    error,
    fromCache,
    reportEmail,
    reportId,
    cachedAt,
    birthFingerprint,
    aiGuidance,
    calculate,
    reset,
    loadSharedReport,
  };
}
