import { useEffect, useId, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../lib/utils';
import { t } from '../../copy/t';
import { GeocoderUnavailableError, searchPlaces } from '../../lib/geocode';
import type { FieldDef, PlaceResolution } from '../../types';
import { FieldShell } from './FieldShell';
import { inputClass } from './fieldStyles';

interface Props {
  def: FieldDef;
  value: string;
  error?: string;
  required?: boolean;
  resolved?: PlaceResolution;
  onChange: (value: string) => void;
  onBlur: () => void;
  onResolve: (place: PlaceResolution) => void;
  onGeocoderUnavailable: (unavailable: boolean) => void;
}

const DEBOUNCE_MS = 300;

/**
 * Place lookup against the app's geocoding proxy. Selecting a suggestion is what
 * gives the lead coordinates and a timezone — without those the chart engine
 * cannot cast a chart, so free text alone is not enough.
 */
export function PlaceField({
  def,
  value,
  error,
  required,
  resolved,
  onChange,
  onBlur,
  onResolve,
  onGeocoderUnavailable,
}: Props) {
  const { theme } = useTheme();
  const listboxId = `${useId()}-places`;
  const [suggestions, setSuggestions] = useState<PlaceResolution[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A resolved value needs no lookup; editing the text clears the resolution
    // in the reducer, which re-runs this effect and searches again.
    if (resolved && resolved.label === value) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(value, controller.signal);
        setSuggestions(results);
        setActiveIndex(-1);
        setOpen(results.length > 0);
        onGeocoderUnavailable(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof GeocoderUnavailableError) {
          // Let the visitor through on free text rather than lose the lead.
          onGeocoderUnavailable(true);
        }
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // onGeocoderUnavailable is a stable dispatch wrapper
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, resolved]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const select = (place: PlaceResolution) => {
    onResolve(place);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <FieldShell id={def.id} copyKey={def.copyKey} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <div ref={containerRef} className="relative">
          <input
            id={inputId}
            name={def.id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder={t(`${def.copyKey}.placeholder`)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(inputClass(theme, Boolean(error)), 'pr-10')}
          />

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-jyotish-gold/70" aria-hidden />
            ) : resolved && resolved.label === value ? (
              <Check className="h-4 w-4 text-jyotish-gold" aria-hidden />
            ) : null}
          </span>

          {open && suggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className={cn(
                'absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border py-1 shadow-xl',
                theme === 'dark'
                  ? 'bg-mystic-purple border-white/10'
                  : 'bg-white border-slate-200'
              )}
            >
              {suggestions.map((place, i) => (
                <li
                  key={`${place.label}-${place.latitude}-${place.longitude}`}
                  id={`${listboxId}-option-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => {
                    // mousedown, not click: blur would close the list first.
                    e.preventDefault();
                    select(place);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-body',
                    i === activeIndex
                      ? theme === 'dark'
                        ? 'bg-white/10'
                        : 'bg-slate-100'
                      : ''
                  )}
                >
                  {place.label}
                </li>
              ))}
            </ul>
          ) : null}

          {resolved && resolved.label === value ? (
            <p
              className={cn(
                'mt-1 text-caption font-mono',
                theme === 'dark' ? 'text-white/40' : 'text-slate-500'
              )}
            >
              {t('fields.place.resolved', {
                lat: resolved.latitude.toFixed(2),
                lon: resolved.longitude.toFixed(2),
                zone: resolved.timezone,
              })}
            </p>
          ) : null}
        </div>
      )}
    </FieldShell>
  );
}
