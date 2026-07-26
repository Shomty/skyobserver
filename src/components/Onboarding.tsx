import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { withRetry } from '../lib/api-utils';
import { resolveBirthInstant } from '../features/gift/lib/birthInstant';
import { DateTimePicker } from './DateTimePicker';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../lib/dateInputUtils';

interface OnboardingFlowProps {
  theme: 'light' | 'dark';
  onComplete: (data: OnboardingData) => Promise<void>;
  user: unknown;
}

interface Place {
  label: string;
  lat: number;
  lon: number;
  timezone?: string;
}

interface GeocodeResult {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface OnboardingData {
  firstName: string;
  lastName: string;
  gender: string;
  birthTime: string;
  birthCity: string;
  lat: number;
  lon: number;
  timezone?: string;
}

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Birth', icon: Calendar },
  { id: 3, label: 'Review', icon: Check },
];

function localDateTimeToIso(localDateTime: string, timeZone?: string): string {
  if (!timeZone) return new Date(localDateTime).toISOString();
  const [datePart, timePart] = localDateTime.split('T');
  return resolveBirthInstant(datePart, timePart, timeZone)?.iso ?? new Date(localDateTime).toISOString();
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ theme, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'male',
    birthTime: '',
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    if (place?.label === query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError('');
      try {
        let response = await withRetry(() =>
          fetch(`/api/geocode?name=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        );
        if (!response.ok) {
          response = await withRetry(() =>
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`, {
              signal: controller.signal,
            })
          );
        }
        if (!response.ok) throw new Error('City search is unavailable.');
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSearchError('We could not search places. Check your connection and try again.');
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, place]);

  const selectPlace = (result: GeocodeResult) => {
    const label = [result.name, result.admin1, result.country].filter(Boolean).join(', ');
    setPlace({
      label,
      lat: result.latitude,
      lon: result.longitude,
      timezone: result.timezone,
    });
    setQuery(label);
    setSuggestions([]);
    setSearchError('');
  };

  const personalValid = form.firstName.trim().length > 0 && form.lastName.trim().length > 0;
  const birthDate = form.birthTime ? new Date(form.birthTime) : null;
  const birthValid = Boolean(
    birthDate &&
    !Number.isNaN(birthDate.getTime()) &&
    birthDate.getTime() <= Date.now() &&
    place &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lon)
  );
  const stepValid = step === 1 ? personalValid : step === 2 ? birthValid : true;

  const continueStep = () => {
    setTouched(true);
    if (!stepValid) return;
    setTouched(false);
    setStep(current => Math.min(3, current + 1));
  };

  const complete = async () => {
    if (!place || !birthValid) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await onComplete({
        ...form,
        birthTime: localDateTimeToIso(form.birthTime, place.timezone),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthCity: place.label,
        lat: place.lat,
        lon: place.lon,
        timezone: place.timezone,
      });
    } catch {
      setSaveError('Your profile could not be saved. Nothing was lost—please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = cn(
    'w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:border-jyotish-gold focus:ring-2 focus:ring-jyotish-gold/15',
    isDark ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/30' : 'border-slate-200 bg-slate-50 text-slate-900'
  );

  return (
    <main className={cn('min-h-screen px-4 py-10 md:py-16', isDark ? 'bg-[#08060d] text-white' : 'bg-[#f4f0e8] text-slate-900')}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-jyotish-gold">Create your observatory</p>
            <h1 className="mt-2 font-serif text-3xl font-medium italic md:text-4xl">Begin with accurate coordinates.</h1>
          </div>
          <span className={cn('hidden text-sm md:block', isDark ? 'text-white/45' : 'text-slate-500')}>About 2 minutes</span>
        </header>

        <div className="mb-8 grid grid-cols-3 gap-2" aria-label="Onboarding progress">
          {STEPS.map(item => {
            const Icon = item.icon;
            const active = step === item.id;
            const completeStep = step > item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-3 transition',
                  active || completeStep
                    ? 'border-jyotish-gold/35 bg-jyotish-gold/[0.07]'
                    : isDark ? 'border-white/[0.07] text-white/35' : 'border-slate-200 text-slate-400'
                )}
                aria-current={active ? 'step' : undefined}
              >
                <span className={cn('grid h-7 w-7 place-items-center rounded-full text-xs', active || completeStep ? 'bg-jyotish-gold text-black' : 'bg-current/10')}>
                  {completeStep ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden text-xs font-medium sm:block">{item.label}</span>
              </div>
            );
          })}
        </div>

        <section className={cn('overflow-hidden rounded-[2rem] border shadow-2xl', isDark ? 'border-white/10 bg-[#100c17]' : 'border-slate-200 bg-white')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="grid min-h-[31rem] md:grid-cols-[0.42fr_0.58fr]"
            >
              <div className={cn('relative hidden overflow-hidden p-9 md:block', isDark ? 'bg-jyotish-gold text-[#150e08]' : 'bg-[#17101f] text-white')}>
                <div className="relative z-10">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">Step {step} of 3</p>
                  <h2 className="mt-5 font-serif text-4xl font-medium italic leading-none">
                    {step === 1 && 'Who is this chart for?'}
                    {step === 2 && 'Where and when did the sky begin?'}
                    {step === 3 && 'Check the chart foundation.'}
                  </h2>
                  <p className="mt-5 text-sm leading-6 opacity-70">
                    {step === 1 && 'Your profile keeps this chart distinct from any family or research profiles you add later.'}
                    {step === 2 && 'A few minutes or kilometres can change the ascendant and house structure.'}
                    {step === 3 && 'You can update these details later, but precision now gives you a better starting point.'}
                  </p>
                </div>
                <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-current/15" />
                <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full border border-current/15" />
              </div>

              <div className="p-6 md:p-10">
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-jyotish-gold">Personal details</p>
                      <h2 className="mt-2 font-serif text-3xl font-medium italic">Name your chart</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm">
                        <span>First name</span>
                        <input className={fieldClass} autoComplete="given-name" value={form.firstName} onChange={event => setForm(value => ({ ...value, firstName: event.target.value }))} />
                        {touched && !form.firstName.trim() && <span className="block text-xs text-red-400">Enter a first name.</span>}
                      </label>
                      <label className="space-y-2 text-sm">
                        <span>Last name</span>
                        <input className={fieldClass} autoComplete="family-name" value={form.lastName} onChange={event => setForm(value => ({ ...value, lastName: event.target.value }))} />
                        {touched && !form.lastName.trim() && <span className="block text-xs text-red-400">Enter a last name.</span>}
                      </label>
                    </div>
                    <fieldset>
                      <legend className="mb-3 text-sm">Gender</legend>
                      <div className="grid grid-cols-3 gap-2">
                        {['male', 'female', 'other'].map(gender => (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => setForm(value => ({ ...value, gender }))}
                            className={cn('rounded-xl border px-3 py-3 text-xs capitalize transition', form.gender === gender ? 'border-jyotish-gold bg-jyotish-gold text-black' : isDark ? 'border-white/10 text-white/60' : 'border-slate-200')}
                            aria-pressed={form.gender === gender}
                          >
                            {gender}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-jyotish-gold">Birth details</p>
                      <h2 className="mt-2 font-serif text-3xl font-medium italic">Set the chart coordinates</h2>
                    </div>
                    <div className="space-y-2">
                      <DateTimePicker
                        label="Date & time of birth"
                        placeholder="Select birth moment"
                        value={fromDateTimeLocalValue(form.birthTime)}
                        onChange={(date) => setForm((value) => ({ ...value, birthTime: date ? toDateTimeLocalValue(date) : '' }))}
                        theme={isDark ? 'dark' : 'light'}
                        maxDate={new Date()}
                        showNowButton={false}
                        error={touched && (!birthDate || (birthDate && birthDate.getTime() > Date.now()))}
                      />
                      {touched && !birthDate && <span className="block text-xs text-red-400">Enter a birth date and time.</span>}
                      {birthDate && birthDate.getTime() > Date.now() && <span className="block text-xs text-red-400">Birth time cannot be in the future.</span>}
                    </div>
                    <div className="relative space-y-2 text-sm">
                      <label htmlFor="birth-place">Place of birth</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-jyotish-gold" />
                        <input
                          id="birth-place"
                          className={cn(fieldClass, 'pl-11 pr-11')}
                          value={query}
                          onChange={event => {
                            setQuery(event.target.value);
                            setPlace(null);
                          }}
                          placeholder="Search city or town"
                          autoComplete="off"
                          role="combobox"
                          aria-expanded={suggestions.length > 0}
                        />
                        {isSearching && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jyotish-gold" />}
                      </div>
                      {place && (
                        <p className="flex items-center gap-2 text-xs text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          Coordinates selected · {place.lat.toFixed(3)}, {place.lon.toFixed(3)}
                        </p>
                      )}
                      {touched && !place && <span className="block text-xs text-red-400">Choose a place from the results.</span>}
                      {searchError && <p className="text-xs text-red-400">{searchError}</p>}
                      {suggestions.length > 0 && (
                        <div className={cn('absolute z-20 mt-1 w-full overflow-hidden rounded-xl border shadow-2xl', isDark ? 'border-white/10 bg-[#16101f]' : 'border-slate-200 bg-white')}>
                          {suggestions.map(result => (
                            <button
                              key={`${result.name}-${result.latitude}-${result.longitude}`}
                              type="button"
                              onClick={() => selectPlace(result)}
                              className={cn('block w-full border-b px-4 py-3 text-left text-sm last:border-0', isDark ? 'border-white/[0.06] hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50')}
                            >
                              <span className="block font-medium">{result.name}</span>
                              <span className={cn('text-xs', isDark ? 'text-white/45' : 'text-slate-500')}>{[result.admin1, result.country].filter(Boolean).join(', ')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && place && (
                  <div className="space-y-6">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-jyotish-gold">Review</p>
                      <h2 className="mt-2 font-serif text-3xl font-medium italic">Ready to calculate</h2>
                    </div>
                    <dl className={cn('divide-y rounded-2xl border', isDark ? 'divide-white/10 border-white/10' : 'divide-slate-200 border-slate-200')}>
                      <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`} />
                      <ReviewRow label="Gender" value={form.gender} />
                      <ReviewRow label="Birth time" value={format(new Date(form.birthTime), 'MMM d, yyyy · HH:mm')} />
                      <ReviewRow label="Birth place" value={place.label} />
                      <ReviewRow label="Timezone" value={place.timezone || 'Local time entered'} />
                    </dl>
                    <p className={cn('text-xs leading-5', isDark ? 'text-white/45' : 'text-slate-500')}>
                      These details calculate your natal chart and can be updated later from your profile.
                    </p>
                    {saveError && (
                      <div role="alert" className="flex gap-3 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {saveError}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-10 flex gap-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => { setTouched(false); setStep(value => value - 1); }}
                      disabled={isSaving}
                      className={cn('inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm transition', isDark ? 'border-white/15 text-white/65 hover:text-white' : 'border-slate-300 text-slate-600')}
                    >
                      <ChevronLeft className="h-4 w-4" /> Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={step === 3 ? complete : continueStep}
                    disabled={isSaving}
                    className="ml-auto inline-flex min-w-40 items-center justify-center gap-2 rounded-full bg-jyotish-gold px-6 py-3 text-sm font-semibold text-black transition hover:bg-celestial-gold disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 3 ? <Sparkles className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {isSaving ? 'Saving…' : step === 3 ? 'Create my chart' : 'Continue'}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 px-4 py-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-45">{label}</dt>
      <dd className="text-right text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}
