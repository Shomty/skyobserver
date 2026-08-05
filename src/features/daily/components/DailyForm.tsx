import { useEffect, useId, useRef, useState } from 'react';
import { Check, Loader2, LocateFixed, MapPin } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { primaryButtonClass } from '../../gift/components/buttonStyles';
import { FieldRenderer } from '../../gift/components/fields/FieldRenderer';
import { Honeypot } from '../../gift/components/fields/Honeypot';
import { GeocoderUnavailableError, searchPlaces } from '../../gift/lib/geocode';
import { t as giftT } from '../../gift/copy/t';
import type { FieldId, PlaceResolution } from '../../gift/types';
import { t } from '../copy/t';
import type { DailyFormState } from '../hooks/useDailyCalculator';
import { resolveBrowserGeolocation, resolveIpLocation } from '../lib/resolveCurrentLocation';
import type { DailyViewMode } from '../lib/dailyViewMode';
import { DailyViewModeToggle } from './DailyViewModeToggle';

const FIELDS: FieldId[] = ['fullName', 'email', 'birthDate', 'birthTime', 'birthPlace'];
const DEBOUNCE_MS = 300;

interface Props {
  form: DailyFormState;
  loading: boolean;
  onChange: (id: FieldId, value: string) => void;
  onBlur: (id: FieldId) => void;
  onResolvePlace: (place: PlaceResolution) => void;
  onCurrentPlaceText: (text: string) => void;
  onResolveCurrentPlace: (place: PlaceResolution) => void;
  onGeocoderUnavailable: (unavailable: boolean) => void;
  onAssumedNoonChange: (assumed: boolean) => void;
  onHoneypot: (value: string) => void;
  viewMode: DailyViewMode;
  onViewModeChange: (mode: DailyViewMode) => void;
  onSubmit: () => void;
}

export function DailyForm({
  form,
  loading,
  onChange,
  onBlur,
  onResolvePlace,
  onCurrentPlaceText,
  onResolveCurrentPlace,
  onGeocoderUnavailable,
  onAssumedNoonChange,
  onHoneypot,
  viewMode,
  onViewModeChange,
  onSubmit,
}: Props) {
  const { theme } = useTheme();
  const listboxId = `${useId()}-current-places`;
  const [suggestions, setSuggestions] = useState<PlaceResolution[]>([]);
  const [open, setOpen] = useState(false);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (form.currentPlace && form.currentPlace.label === form.currentPlaceText) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (form.currentPlaceText.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPlaceLoading(true);
      try {
        const results = await searchPlaces(form.currentPlaceText, controller.signal);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof GeocoderUnavailableError) onGeocoderUnavailable(true);
        setSuggestions([]);
        setOpen(false);
      } finally {
        setPlaceLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [form.currentPlace, form.currentPlaceText, onGeocoderUnavailable]);

  const handleLocate = async (mode: 'gps' | 'ip') => {
    setLocating(true);
    setLocateError(null);
    try {
      const place = mode === 'gps' ? await resolveBrowserGeolocation() : await resolveIpLocation();
      onResolveCurrentPlace(place);
      setOpen(false);
    } catch (e) {
      setLocateError(e instanceof Error ? e.message : 'Location lookup failed');
    } finally {
      setLocating(false);
    }
  };

  const inputClass = cn(
    'w-full rounded-xl border px-4 py-3 text-body outline-none transition',
    theme === 'dark'
      ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus:border-jyotish-gold/50'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-jyotish-gold',
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn(
        'rounded-2xl border p-4 sm:p-6 space-y-5',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
      )}
    >
      <div>
        <h2 className="font-serif text-heading">{t('form.title')}</h2>
        <p className={cn('mt-2 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
          {t('form.subtitle')}
        </p>
      </div>

      <Honeypot value={form.honeypot} onChange={onHoneypot} />

      <div className="space-y-2">
        <DailyViewModeToggle mode={viewMode} onChange={onViewModeChange} />
        <p className={cn('text-caption', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
          {t('viewMode.hint')}
        </p>
      </div>

      {FIELDS.map((id) => (
        <FieldRenderer
          key={id}
          id={id}
          value={form.values[id] ?? ''}
          error={form.errors[id] ? giftT(form.errors[id]) : undefined}
          required
          assumedNoon={form.birthTimeAssumedNoon}
          resolvedPlace={id === 'birthPlace' ? form.places.birthPlace : undefined}
          onChange={(v) => onChange(id, v)}
          onBlur={() => onBlur(id)}
          onAssumedNoonChange={onAssumedNoonChange}
          onResolvePlace={onResolvePlace}
          onGeocoderUnavailable={onGeocoderUnavailable}
        />
      ))}

      <div className="space-y-2" ref={containerRef}>
        <label className="block text-label font-medium" htmlFor="current-place">
          {t('form.currentPlace')} <span className="text-jyotish-gold">*</span>
        </label>
        <p className={cn('text-caption', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
          {t('form.currentPlaceHint')}
        </p>
        <div className="relative">
          <MapPin
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
              theme === 'dark' ? 'text-white/30' : 'text-slate-400',
            )}
            aria-hidden
          />
          <input
            id="current-place"
            type="text"
            autoComplete="off"
            value={form.currentPlaceText}
            onChange={(e) => onCurrentPlaceText(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            className={cn(inputClass, 'pl-10 pr-10')}
            placeholder="City, region, country"
          />
          {placeLoading ? (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jyotish-gold"
              aria-hidden
            />
          ) : form.currentPlace ? (
            <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" aria-hidden />
          ) : null}
          {open && suggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className={cn(
                'absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border shadow-lg',
                theme === 'dark' ? 'border-white/10 bg-[#1a0b2e]' : 'border-slate-200 bg-white',
              )}
            >
              {suggestions.map((place) => (
                <li key={`${place.label}-${place.latitude}`}>
                  <button
                    type="button"
                    role="option"
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-body transition hover:bg-jyotish-gold/10',
                      theme === 'dark' ? 'text-white/85' : 'text-slate-800',
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onResolveCurrentPlace(place);
                      setOpen(false);
                    }}
                  >
                    {place.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {form.errors.currentPlace ? (
          <p className="text-caption text-red-400">{giftT(form.errors.currentPlace)}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={locating || loading}
            onClick={() => void handleLocate('gps')}
            className={cn(
              'inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 text-caption font-medium transition',
              theme === 'dark'
                ? 'border-white/10 text-white/70 hover:border-jyotish-gold/40 hover:text-white'
                : 'border-slate-200 text-slate-600 hover:border-jyotish-gold/50',
            )}
          >
            <LocateFixed className="h-4 w-4" aria-hidden />
            {locating ? t('form.locating') : t('form.useMyLocation')}
          </button>
          <button
            type="button"
            disabled={locating || loading}
            onClick={() => void handleLocate('ip')}
            className={cn(
              'inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 text-caption font-medium transition',
              theme === 'dark'
                ? 'border-white/10 text-white/70 hover:border-jyotish-gold/40 hover:text-white'
                : 'border-slate-200 text-slate-600 hover:border-jyotish-gold/50',
            )}
          >
            {t('form.useApproxLocation')}
          </button>
        </div>
        {locateError ? <p className="text-caption text-amber-400">{locateError}</p> : null}
      </div>

      <button type="submit" disabled={loading} className={cn(primaryButtonClass(), 'w-full sm:w-auto')}>
        {loading ? t('page.loading') : t('page.submit')}
      </button>
    </form>
  );
}
