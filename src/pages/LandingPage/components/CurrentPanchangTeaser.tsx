import React, { useEffect, useMemo, useState } from 'react';
import { Activity, LocateFixed, MapPin } from 'lucide-react';
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

type LocationStatus = 'idle' | 'requesting' | 'active' | 'approximate' | 'denied';

const MoodDatum: React.FC<{ label: string; value: string; detail?: string }> = ({ label, value, detail }) => (
  <div className="dashboard-stat">
    <dt className="dashboard-stat-label">{label}</dt>
    <dd className="dashboard-stat-value">{value}</dd>
    {detail && <dd className="mt-1 text-[11px] leading-5 text-white/35">{detail}</dd>}
  </div>
);

async function resolveLocationLabel(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!res.ok) return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    const data = await res.json() as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      address?: { city?: string; town?: string };
    };
    return (
      data.city
      || data.locality
      || data.principalSubdivision
      || data.address?.city
      || data.address?.town
      || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    );
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

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
      return { data: null, error: "Today's mood ledger could not be calculated." };
    }
  }, [now, coordinates]);

  const applyCoordinates = async (
    latitude: number,
    longitude: number,
    status: Extract<LocationStatus, 'active' | 'approximate'>,
    preferredLabel?: string,
  ) => {
    const label = preferredLabel || await resolveLocationLabel(latitude, longitude);
    setCoordinates({ latitude, longitude, label });
    setLocationStatus(status);
  };

  const requestIpLocation = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/ip-location');
      if (!res.ok) return false;
      const data = await res.json() as {
        latitude?: number;
        longitude?: number;
        label?: string;
      };
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return false;
      await applyCoordinates(data.latitude, data.longitude, 'approximate', data.label);
      return true;
    } catch {
      return false;
    }
  };

  const requestLocation = () => {
    setLocationStatus('requesting');

    const canUseGps = window.isSecureContext && 'geolocation' in navigator;
    if (!canUseGps) {
      void requestIpLocation().then((ok) => {
        if (!ok) setLocationStatus('denied');
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void applyCoordinates(coords.latitude, coords.longitude, 'active');
      },
      () => {
        void requestIpLocation().then((ok) => {
          if (!ok) setLocationStatus('denied');
        });
      },
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

  const statusMessage = (() => {
    if (locationStatus === 'active') return 'Mood ledger updated for your coordinates.';
    if (locationStatus === 'approximate') {
      return window.isSecureContext
        ? 'Using approximate city-level location from your network.'
        : 'Precise GPS needs HTTPS. Using approximate city-level location instead.';
    }
    if (locationStatus === 'denied') {
      return window.isSecureContext
        ? 'Location unavailable. Allow location access in your browser, or we will keep showing London.'
        : 'Location unavailable on this connection. Enable HTTPS for GPS, or allow network-based lookup.';
    }
    return 'Showing London, UK until you share your location.';
  })();

  return (
    <section aria-labelledby="daily-mood-title" className="dashboard-panel">
      <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
        <header className="relative flex min-h-64 flex-col justify-between overflow-hidden border-b border-cosmic-accent/12 p-6 lg:border-b-0 lg:border-r sm:p-8">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-cosmic-accent/15 shadow-[0_0_80px_rgba(157,124,255,0.12)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="landing-kicker">Panel · mood ledger</p>
              <h2 id="daily-mood-title" className="mt-3 max-w-sm font-serif text-3xl font-semibold leading-none text-white sm:text-4xl">
                Daily <span className="italic text-jyotish-gold">emotional weather</span>
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/45">
                Live snapshot of today's rhythm — lunar tone, weekday energy, and the mood of the moment.
              </p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-jyotish-gold/25 bg-jyotish-gold/10">
              <Activity size={16} className="text-jyotish-gold" aria-hidden="true" />
            </span>
          </div>

          <div className="relative mt-8">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">
              <MapPin size={14} className="text-jyotish-gold" aria-hidden="true" />
              <span>{coordinates.label}</span>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationStatus === 'requesting'}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-jyotish-gold/50 hover:text-white disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/70"
            >
              <LocateFixed size={14} aria-hidden="true" />
              {locationStatus === 'requesting' ? 'Awaiting permission…' : 'Use my location'}
            </button>
            <p className="mt-2 min-h-4 text-[10px] text-white/30" role="status">
              {statusMessage}
            </p>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-cosmic-accent/20 pb-5">
            <p className="font-serif text-2xl text-white/90">{formattedDate}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
              {coordinates.latitude.toFixed(2)}° · {coordinates.longitude.toFixed(2)}°
            </p>
          </div>

          {panchang ? (
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
