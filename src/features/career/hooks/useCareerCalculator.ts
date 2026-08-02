import { useCallback, useState } from 'react';
import { fetchPlanetPositions } from '../../../services/positionsService';
import { fetchVimshottariDashas } from '../../../services/dashasService';
import type { PlaceResolution } from '../../gift/types';
import { resolveBirthInstant } from '../../gift/lib/birthInstant';
import { validateField, validatePlaceResolution } from '../../gift/config/schemas';
import type { FieldId } from '../../gift/types';
import type { PlanetPosition } from '../../../vedic-utils';
import { buildCareerSnapshot } from '../lib/careerEngine';
import { withCareerKaalVelas } from '../lib/careerKaalVelas';
import { careerBirthFingerprint, normalizeCareerEmail } from '../lib/careerFingerprint';
import { loadCareerReport, saveCareerReport } from '../lib/careerReportApi';
import type { CareerReportLoadResult } from '../lib/careerReportApi';
import { trackCareerEvent } from '../lib/analytics';
import { clearCareerSynthesisSession } from '../lib/careerSynthesisService';
import type { CareerAiSynthesis, CareerSnapshot } from '../types';

const FORM_FIELDS: FieldId[] = ['fullName', 'email', 'birthDate', 'birthTime', 'birthPlace'];

export interface CareerFormState {
  values: Partial<Record<FieldId, string>>;
  places: Partial<Record<'birthPlace', PlaceResolution>>;
  errors: Partial<Record<FieldId, string>>;
  geocoderUnavailable: boolean;
  birthTimeAssumedNoon: boolean;
  honeypot: string;
}

const initialState: CareerFormState = {
  values: {},
  places: {},
  errors: {},
  geocoderUnavailable: false,
  birthTimeAssumedNoon: false,
  honeypot: '',
};

export function useCareerCalculator() {
  const [form, setForm] = useState<CareerFormState>(initialState);
  const [snapshot, setSnapshot] = useState<CareerSnapshot | null>(null);
  const [positions, setPositions] = useState<PlanetPosition[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [reportEmail, setReportEmail] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [birthFingerprint, setBirthFingerprint] = useState<string | null>(null);
  const [aiSynthesis, setAiSynthesis] = useState<CareerAiSynthesis | null>(null);

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
      trackCareerEvent('career_honeypot_filled', { value: form.honeypot.slice(0, 40) });
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

    const email = normalizeCareerEmail(form.values.email ?? '');
    const birthTime = form.birthTimeAssumedNoon ? '12:00' : (form.values.birthTime ?? '');
    const instant = birthPlace
      ? resolveBirthInstant(form.values.birthDate ?? '', birthTime, birthPlace.timezone)
      : null;

    if (!instant || !birthPlace) {
      setError('Could not resolve birth time. Please pick your city from the list.');
      return null;
    }

    const fingerprint = careerBirthFingerprint(instant, birthPlace);
    setBirthFingerprint(fingerprint);

    setLoading(true);
    setError(null);
    setFromCache(false);
    setReportEmail(email);
    trackCareerEvent('career_form_submitted', { name: form.values.fullName, email });

    try {
      let cached: CareerReportLoadResult | null = null;
      try {
        cached = await loadCareerReport(email, fingerprint);
      } catch (loadErr) {
        trackCareerEvent('career_error', { message: String(loadErr), phase: 'load' });
      }

      if (cached?.hit && cached.snapshot && cached.positions && cached.reportId) {
        setSnapshot(cached.snapshot);
        setPositions(cached.positions);
        setReportId(cached.reportId);
        setCachedAt(cached.cachedAt ?? null);
        setAiSynthesis(cached.aiSynthesis ?? null);
        setFromCache(true);
        if (cached.fullName && !form.values.fullName) {
          setForm((prev) => ({ ...prev, values: { ...prev.values, fullName: cached.fullName } }));
        }
        trackCareerEvent('career_result_shown', {
          tenthSign: cached.snapshot.tenthHouse.sign,
          tenthLord: cached.snapshot.tenthLord.planet,
          fromCache: true,
          reportId: cached.reportId,
        });
        return cached.reportId;
      }

      const birthDate = new Date(instant.iso);
      const [chartPositions, dashas] = await Promise.all([
        fetchPlanetPositions(birthDate, birthPlace.latitude, birthPlace.longitude),
        fetchVimshottariDashas(birthDate, birthPlace.latitude, birthPlace.longitude, birthPlace.timezone),
      ]);

      // Gulika/Maandi feed the karmic checks only — the rendered chart keeps the
      // nine grahas, so the upagrahas never reach `setPositions`.
      const positionsWithUpagrahas = withCareerKaalVelas(
        chartPositions,
        birthDate,
        birthPlace.latitude,
        birthPlace.longitude,
        instant.offsetMinutes,
      );

      const result = buildCareerSnapshot(positionsWithUpagrahas, dashas, instant, new Date());
      setPositions(chartPositions);
      setSnapshot(result);
      setFromCache(false);
      setAiSynthesis(null);

      let savedReportId: string | null = null;
      try {
        const saved = await saveCareerReport({
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
        trackCareerEvent('career_report_saved', { email, reportId: saved.reportId });
      } catch (saveErr) {
        trackCareerEvent('career_error', { message: String(saveErr), phase: 'save' });
      }

      trackCareerEvent('career_result_shown', {
        tenthSign: result.tenthHouse.sign,
        tenthLord: result.tenthLord.planet,
        fromCache: false,
        reportId: savedReportId,
      });

      return savedReportId;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      trackCareerEvent('career_error', { message: String(e) });
      return null;
    } finally {
      setLoading(false);
    }
  }, [form, validateForm]);

  const reset = useCallback(() => {
    clearCareerSynthesisSession(reportEmail ?? undefined);
    setSnapshot(null);
    setPositions(null);
    setError(null);
    setFromCache(false);
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
      snapshot: CareerSnapshot;
      positions: PlanetPosition[];
      fingerprint?: string;
      aiSynthesis?: CareerAiSynthesis;
      cachedAt?: string;
      fullName?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlaceLabel?: string;
      email?: string;
    }) => {
      setSnapshot(record.snapshot);
      setPositions(record.positions);
      setReportId(record.reportId);
      setCachedAt(record.cachedAt ?? null);
      setBirthFingerprint(record.fingerprint ?? null);
      setAiSynthesis(record.aiSynthesis ?? null);
      setFromCache(true);
      if (record.email) setReportEmail(normalizeCareerEmail(record.email));
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
    fromCache,
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
