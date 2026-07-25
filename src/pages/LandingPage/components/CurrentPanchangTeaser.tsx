import React, { useEffect, useMemo, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { calculatePanchang, calculatePositions } from '../../../vedic-utils';
import type { PanchangData } from '../../../vedic-utils';
import { presentMoodLedger } from './moodLedgerPresentation';

interface Coordinates {
  latitude: number;
  longitude: number;
  label: string;
}

const DEFAULT_LOCATION: Coordinates = {
  latitude: 51.5074,
  longitude: -0.1278,
  label: 'London, UK',
};

type LocationStatus = 'idle' | 'requesting' | 'active' | 'denied';

const MoodDatum: React.FC<{ label: string; value: string; detail?: string }> = ({ label, value, detail }) => (
  <div className="border-t border-white/10 py-4 first:border-t-0 sm:py-5">
    <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-cosmic-accent/55">{label}</dt>
    <dd className="mt-1 font-serif text-xl text-white/90">{value}</dd>
    {detail && <dd className="mt-1 text-[11px] text-white/35">{detail}</dd>}
  </div>
);

export const CurrentPanchangTeaser: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const [coordinates, setCoordinates] = useState<Coordinates>(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const panchangResult = useMemo<{ data: PanchangData | null; error: string | null }>(() => {
    try {
      const positions = calculatePositions(now, coordinates.latitude, coordinates.longitude);
      return { data: calculatePanchang(now, positions), error: null };
    } catch {
      return { data: null, error: 'Today’s mood ledger could not be calculated.' };
    }
  }, [now, coordinates]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: 'Your current location',
        });
        setLocationStatus('active');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const panchang = panchangResult.data;
  const moodRows = useMemo(() => (panchang ? presentMoodLedger(panchang) : []), [panchang]);
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);

  return (
    <section aria-labelledby="daily-mood-title" className="px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] lg:grid-cols-[0.72fr_1.28fr]">
        <header className="relative flex min-h-72 flex-col justify-between overflow-hidden border-b border-white/10 p-7 lg:border-b-0 lg:border-r sm:p-10">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-cosmic-accent/15 shadow-[0_0_80px_rgba(157,124,255,0.12)]" />
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cosmic-accent/70">Today’s emotional weather</p>
            <h2 id="daily-mood-title" className="mt-4 max-w-sm font-serif text-4xl font-semibold leading-none text-white">
              Daily <span className="italic text-cosmic-accent">mood ledger</span>
            </h2>
            <p className="mt-5 text-sm leading-6 text-white/45">
              A live snapshot of today’s rhythm — lunar tone, weekday energy, and the mood of the moment.
            </p>
          </div>

          <div className="relative mt-10">
            <div className="flex items-center gap-2 text-xs text-white/65">
              <MapPin size={14} className="text-cosmic-accent" aria-hidden="true" />
              <span>{coordinates.label}</span>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationStatus === 'requesting'}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-cosmic-accent/50 hover:text-white disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent/70"
            >
              <LocateFixed size={14} aria-hidden="true" />
              {locationStatus === 'requesting' ? 'Awaiting permission…' : 'Use my location'}
            </button>
            <p className="mt-2 min-h-4 text-[10px] text-white/30" role="status">
              {locationStatus === 'denied' && 'Location unavailable. Showing London, UK instead.'}
              {locationStatus === 'active' && 'Mood ledger updated for your coordinates.'}
              {locationStatus === 'idle' && 'Showing London, UK until you share your location.'}
            </p>
          </div>
        </header>

        <div className="p-7 sm:p-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-cosmic-accent/25 pb-5">
            <p className="font-serif text-2xl text-white/90">{formattedDate}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
              {coordinates.latitude.toFixed(2)}° · {coordinates.longitude.toFixed(2)}°
            </p>
          </div>

          {panchang ? (
            <dl className="grid sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-3">
              {moodRows.map((row) => (
                <MoodDatum key={row.label} label={row.label} value={row.value} detail={row.detail} />
              ))}
            </dl>
          ) : (
            <p role="alert" className="py-16 text-center text-sm text-rose-200/70">{panchangResult.error}</p>
          )}

          <p className="mt-5 border-t border-white/10 pt-4 text-[10px] leading-5 text-white/25">
            A concise mood snapshot for reflection — not a substitute for major life decisions.
          </p>
        </div>
      </div>
    </section>
  );
};
