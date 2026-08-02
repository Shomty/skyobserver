import { useCallback, useState } from 'react';
import { fetchPlanetPositions } from '../../../services/positionsService';
import { fetchVimshottariDashas } from '../../../services/dashasService';
import type { PlaceResolution } from '../../gift/types';
import { resolveBirthInstant } from '../../gift/lib/birthInstant';
import { validateField, validatePlaceResolution } from '../../gift/config/schemas';
import type { FieldId } from '../../gift/types';
import type { PlanetPosition } from '../../../vedic-utils';
import { buildCareerSnapshot } from '../lib/careerEngine';
import { trackCareerEvent } from '../lib/analytics';
import type { CareerSnapshot } from '../types';

const FORM_FIELDS: FieldId[] = ['fullName', 'birthDate', 'birthTime', 'birthPlace'];

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

  const calculate = useCallback(async () => {
    if (form.honeypot) return;
    if (!validateForm()) return;

    const birthPlace = form.places.birthPlace;
    if (!birthPlace && !form.geocoderUnavailable) return;

    const birthTime = form.birthTimeAssumedNoon ? '12:00' : (form.values.birthTime ?? '');
    const instant = birthPlace
      ? resolveBirthInstant(form.values.birthDate ?? '', birthTime, birthPlace.timezone)
      : null;

    if (!instant || !birthPlace) {
      setError('Could not resolve birth time. Please pick your city from the list.');
      return;
    }

    setLoading(true);
    setError(null);
    trackCareerEvent('career_form_submitted', { name: form.values.fullName });

    try {
      const birthDate = new Date(instant.iso);
      const [chartPositions, dashas] = await Promise.all([
        fetchPlanetPositions(birthDate, birthPlace.latitude, birthPlace.longitude),
        fetchVimshottariDashas(birthDate, birthPlace.latitude, birthPlace.longitude, birthPlace.timezone),
      ]);

      const result = buildCareerSnapshot(chartPositions, dashas, instant, new Date());
      setPositions(chartPositions);
      setSnapshot(result);
      trackCareerEvent('career_result_shown', {
        tenthSign: result.tenthHouse.sign,
        tenthLord: result.tenthLord.planet,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      trackCareerEvent('career_error', { message: String(e) });
    } finally {
      setLoading(false);
    }
  }, [form, validateForm]);

  const reset = useCallback(() => {
    setSnapshot(null);
    setPositions(null);
    setError(null);
  }, []);

  return {
    form,
    setField,
    setPlace,
    blurField,
    setGeocoderUnavailable: (unavailable: boolean) =>
      setForm((prev) => ({ ...prev, geocoderUnavailable: unavailable })),
    setBirthTimeAssumedNoon: (assumed: boolean) =>
      setForm((prev) => ({ ...prev, birthTimeAssumedNoon: assumed, values: assumed ? { ...prev.values, birthTime: '12:00' } : prev.values })),
    setHoneypot: (value: string) => setForm((prev) => ({ ...prev, honeypot: value })),
    snapshot,
    positions,
    loading,
    error,
    calculate,
    reset,
  };
}
