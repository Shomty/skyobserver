import React, { useEffect, useMemo, useState } from 'react';
import { CircleDot, Diamond, Flame, LocateFixed, MapPin } from 'lucide-react';
import { CircularSkyChart } from '../../../components/charts/CircularSkyChart';
import NorthIndianChart from '../../../components/NorthIndianChart';
import { useTeaserAstronomy } from '../hooks/useTeaserAstronomy';

type ChartMode = 'circular' | 'north';

const ToggleButton: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors motion-reduce:transition-none ${
      active
        ? 'bg-jyotish-gold text-[#1a0b2e]'
        : 'text-white/50 hover:bg-white/[0.05] hover:text-white focus-visible:text-white'
    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/70`}
  >
    {icon}
    {label}
  </button>
);

interface LiveChartTeaserProps {
  compact?: boolean;
}

export const LiveChartTeaser: React.FC<LiveChartTeaserProps> = ({ compact = false }) => {
  const [mode, setMode] = useState<ChartMode>('circular');
  const [selectedName, setSelectedName] = useState<string | null>('Moon');
  const {
    coordinates,
    locationStatus,
    locationStatusMessage,
    positions,
    positionsLoading,
    positionsError,
    mapOffset,
    requestLocation,
  } = useTeaserAstronomy();

  const selectablePlanets = useMemo(
    () => positions.filter((p) => p.name !== 'Ascendant' && p.name !== 'Bhrigu Bindu'),
    [positions],
  );

  useEffect(() => {
    if (selectedName && !positions.some((p) => p.name === selectedName)) {
      setSelectedName(selectablePlanets[0]?.name ?? null);
    }
  }, [positions, selectedName, selectablePlanets]);

  const selected = positions.find((planet) => planet.name === selectedName) ?? selectablePlanets[0];

  return (
    <section
      aria-labelledby="live-chart-title"
      className={compact ? 'relative' : 'relative overflow-hidden border-y border-white/10 px-5 py-20 sm:px-8'}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(157,124,255,0.1),transparent_34%)]" />
      <div className={compact ? 'relative' : 'relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center'}>
        <header className={compact ? 'sr-only' : 'max-w-xl'}>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-jyotish-gold/70">Live sky map</p>
          <h2 id="live-chart-title" className="font-serif text-4xl font-semibold leading-[0.95] text-white sm:text-5xl">
            The cosmos right now.
            <span className="block italic text-jyotish-gold">Two ways to read it.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
            Switch between the circular sky wheel and the Rasi house chart. Tap any planet to inspect its current position.
          </p>

          {selected && (
            <dl aria-live="polite" className="mt-9 border-l-2 border-jyotish-gold/40 pl-5">
              <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3">
                <dt className="font-serif text-2xl text-white">{selected.symbol} {selected.name}</dt>
                <dd className="font-mono text-xs text-jyotish-gold">{selected.degree}° {selected.minute}&apos;</dd>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                <div>
                  <dt className="font-mono uppercase tracking-widest text-white/30">Rasi</dt>
                  <dd className="mt-1 text-white/80">{selected.rashi}</dd>
                </div>
                <div>
                  <dt className="font-mono uppercase tracking-widest text-white/30">Nakshatra</dt>
                  <dd className="mt-1 text-white/80">{selected.nakshatra} · Pada {selected.pada}</dd>
                </div>
              </div>
              <dd className="flex flex-wrap items-center gap-2 text-sm text-white/55">
                {selected.dignity && (
                  <span className="rounded-md border border-jyotish-gold/30 bg-jyotish-gold/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-jyotish-gold">
                    {selected.dignity}
                  </span>
                )}
                {selected.isRetrograde && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-orange-400">Retrograde</span>
                )}
                {selected.isCombust && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-red-400">
                    <Flame className="h-3 w-3" aria-hidden="true" /> Combust
                  </span>
                )}
              </dd>
            </dl>
          )}
        </header>

        <div className={compact ? 'landing-panel rounded-2xl p-3 backdrop-blur-md sm:p-6' : 'dashboard-panel p-3 sm:p-6'}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-white/10 bg-black/20 p-1" aria-label="Map view">
              <ToggleButton active={mode === 'circular'} icon={<CircleDot size={14} aria-hidden="true" />} label="Wheel" onClick={() => setMode('circular')} />
              <ToggleButton active={mode === 'north'} icon={<Diamond size={14} aria-hidden="true" />} label="Rasi" onClick={() => setMode('north')} />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-jyotish-gold/70">
              Live · updates every minute
            </p>
          </div>

          <div
            className={`relative mx-auto aspect-square w-full max-w-[31rem] ${
              mode === 'circular' ? 'overflow-hidden rounded-full border border-jyotish-gold/25 bg-black/20' : ''
            }`}
            aria-label={`${mode === 'circular' ? 'Circular' : 'Rasi'} live sky chart`}
          >
            {positionsLoading && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 animate-pulse rounded-[inherit] bg-white/[0.03]"
              />
            )}
            {mode === 'circular' ? (
              <CircularSkyChart
                positions={positions}
                mapOffset={mapOffset}
                selectedPlanet={selectedName}
                onSelectPlanet={setSelectedName}
                showHorizonLabels={false}
                compact
                className="p-[5%]"
              />
            ) : (
              <NorthIndianChart
                positions={positions}
                viewMode="transit"
                isBirthMode={false}
                selectedPlanet={selectedName}
                setSelectedPlanet={setSelectedName}
                className="h-full w-full"
              />
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">
              <MapPin size={14} className="shrink-0 text-jyotish-gold" aria-hidden="true" />
              <span className="truncate">{coordinates.label}</span>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationStatus === 'requesting'}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-jyotish-gold/50 hover:text-white disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/70"
            >
              <LocateFixed size={14} aria-hidden="true" />
              {locationStatus === 'requesting' ? 'Awaiting permission…' : 'Use my location'}
            </button>
            <p className="min-h-4 text-[10px] text-white/30" role="status">
              {locationStatusMessage}
            </p>
            {positionsError && (
              <p className="text-[10px] text-amber-200/60" role="status">{positionsError}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
