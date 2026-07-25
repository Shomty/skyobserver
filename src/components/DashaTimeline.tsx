import React from 'react';
import { format } from 'date-fns';
import { Circle, Loader2, Pause, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import type { DashaMahadashaPeriod, VimshottariDashasResponse } from '../services/dashasService';

const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

const PLANET_COLORS: Record<string, { bar: string; text: string }> = {
  Sun: { bar: 'bg-amber-500/70', text: 'text-amber-300' },
  Moon: { bar: 'bg-slate-300/60', text: 'text-slate-200' },
  Mars: { bar: 'bg-red-500/65', text: 'text-red-300' },
  Mercury: { bar: 'bg-teal-400/65', text: 'text-teal-200' },
  Jupiter: { bar: 'bg-orange-400/65', text: 'text-orange-200' },
  Venus: { bar: 'bg-pink-400/70', text: 'text-pink-200' },
  Saturn: { bar: 'bg-indigo-400/60', text: 'text-indigo-200' },
  Rahu: { bar: 'bg-purple-500/65', text: 'text-purple-200' },
  Ketu: { bar: 'bg-stone-400/60', text: 'text-stone-300' },
};

function findMahadasha(periods: DashaMahadashaPeriod[], date: Date) {
  return periods.find((period) => {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return date >= start && date < end;
  }) ?? periods[periods.length - 1];
}

function findAntardasha(mahadasha: DashaMahadashaPeriod | undefined, date: Date) {
  if (!mahadasha) return undefined;
  return mahadasha.subPeriods.find((period) => {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return date >= start && date < end;
  }) ?? mahadasha.subPeriods[mahadasha.subPeriods.length - 1];
}

function dateToPercent(date: Date, start: Date, end: Date) {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / total) * 100));
}

interface DashaTimelineProps {
  data: VimshottariDashasResponse;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  isPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

export const DashaTimeline: React.FC<DashaTimelineProps> = ({
  data,
  selectedDate,
  onSelectedDateChange,
  isPlaying = false,
  onPlayingChange,
}) => {
  const { theme } = useTheme();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const { dashaPeriods } = data;
  const timelineStart = React.useMemo(
    () => new Date(dashaPeriods[0].startDate),
    [dashaPeriods],
  );
  const timelineEnd = React.useMemo(
    () => new Date(dashaPeriods[dashaPeriods.length - 1].endDate),
    [dashaPeriods],
  );

  const activeMahadasha = React.useMemo(
    () => findMahadasha(dashaPeriods, selectedDate),
    [dashaPeriods, selectedDate],
  );
  const activeAntardasha = React.useMemo(
    () => findAntardasha(activeMahadasha, selectedDate),
    [activeMahadasha, selectedDate],
  );

  const playheadPercent = dateToPercent(selectedDate, timelineStart, timelineEnd);
  const selectedDateRef = React.useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  const updateFromClientX = React.useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const nextTime = timelineStart.getTime() + ratio * (timelineEnd.getTime() - timelineStart.getTime());
    onSelectedDateChange(new Date(nextTime));
  }, [onSelectedDateChange, timelineEnd, timelineStart]);

  React.useEffect(() => {
    if (!isPlaying) return;
    const stepMs = 1000 * 60 * 60 * 24 * 30;
    const id = window.setInterval(() => {
      const current = selectedDateRef.current;
      const next = new Date(current.getTime() + stepMs);
      if (next >= timelineEnd) {
        onPlayingChange?.(false);
        onSelectedDateChange(timelineEnd);
        return;
      }
      onSelectedDateChange(next);
    }, 120);

    return () => window.clearInterval(id);
  }, [isPlaying, onPlayingChange, onSelectedDateChange, timelineEnd]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) => updateFromClientX(event.clientX);
    const handleUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, updateFromClientX]);

  const rangeLabel = `${format(timelineStart, 'yyyy')} – ${format(timelineEnd, 'yyyy')}`;

  return (
    <div
      className={cn(
        'rounded-3xl border p-5 space-y-5',
        theme === 'dark'
          ? 'bg-mystic-purple/40 border-jyotish-gold/20'
          : 'bg-orange-50 border-orange-200',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Circle className="w-4 h-4 text-jyotish-gold/70 shrink-0" strokeWidth={1.5} />
          <h3 className="text-[13px] font-bold uppercase tracking-[0.22em] text-jyotish-gold truncate">
            Dasha Timeline
          </h3>
        </div>
        <span className={cn('text-[10px] font-mono shrink-0', theme === 'dark' ? 'text-white/35' : 'text-slate-400')}>
          {rangeLabel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPlayingChange?.(!isPlaying)}
          className={cn(
            'w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors',
            theme === 'dark'
              ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600',
          )}
          aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <div
          ref={trackRef}
          className={cn(
            'relative flex-1 h-9 rounded-lg overflow-hidden cursor-pointer border',
            theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-white',
          )}
          onPointerDown={(event) => {
            setIsDragging(true);
            updateFromClientX(event.clientX);
          }}
        >
          <div className="absolute inset-0">
            {dashaPeriods.map((period) => {
              const start = new Date(period.startDate);
              const end = new Date(period.endDate);
              const left = dateToPercent(start, timelineStart, timelineEnd);
              const width = dateToPercent(end, timelineStart, timelineEnd) - left;
              const colors = PLANET_COLORS[period.planet] ?? PLANET_COLORS.Ketu;
              const isActive = activeMahadasha?.planet === period.planet;

              return (
                <button
                  key={`${period.planet}-${period.startDate}`}
                  type="button"
                  className={cn(
                    'absolute top-0 bottom-0 border-r border-black/20 transition-opacity',
                    colors.bar,
                    isActive ? 'opacity-100' : 'opacity-70 hover:opacity-90',
                  )}
                  style={{ left: `${left}%`, width: `${Math.max(width, 0.4)}%` }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectedDateChange(start);
                  }}
                  title={`${period.planet} Mahadasha`}
                >
                  {width > 4 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-black/55 pointer-events-none">
                      {PLANET_ABBR[period.planet] ?? period.planet.slice(0, 2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none z-10"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border border-black/20" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border border-black/20" />
          </div>
        </div>

        <div className="text-right shrink-0 min-w-[4.5rem]">
          <div className="text-2xl font-bold font-mono text-jyotish-gold leading-none">
            {format(selectedDate, 'yyyy')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cn('rounded-2xl border p-4', theme === 'dark' ? 'bg-black/25 border-white/5' : 'bg-white border-slate-100')}>
          <div className={cn('text-[9px] uppercase tracking-[0.2em] font-mono mb-2', theme === 'dark' ? 'text-white/35' : 'text-slate-400')}>Mahadasha</div>
          {activeMahadasha && (
            <>
              <div className={cn('text-2xl font-serif italic', PLANET_COLORS[activeMahadasha.planet]?.text ?? 'text-jyotish-gold')}>
                {activeMahadasha.planet}
              </div>
              <div className={cn('text-[10px] font-mono mt-1', theme === 'dark' ? 'text-white/40' : 'text-slate-500')}>
                {format(new Date(activeMahadasha.startDate), 'MMM yyyy')} – {format(new Date(activeMahadasha.endDate), 'MMM yyyy')}
              </div>
            </>
          )}
        </div>

        <div className={cn('rounded-2xl border p-4', theme === 'dark' ? 'bg-black/25 border-white/5' : 'bg-white border-slate-100')}>
          <div className={cn('text-[9px] uppercase tracking-[0.2em] font-mono mb-3', theme === 'dark' ? 'text-white/35' : 'text-slate-400')}>Antardasha Sequence</div>
          {activeMahadasha && (
            <div className={cn('relative h-8 rounded-lg overflow-hidden border', theme === 'dark' ? 'border-white/5' : 'border-slate-200')}>
              {activeMahadasha.subPeriods.map((sub) => {
                const start = new Date(sub.startDate);
                const end = new Date(sub.endDate);
                const mdStart = new Date(activeMahadasha.startDate);
                const mdEnd = new Date(activeMahadasha.endDate);
                const left = dateToPercent(start, mdStart, mdEnd);
                const width = dateToPercent(end, mdStart, mdEnd) - left;
                const isActive = activeAntardasha?.planet === sub.planet;
                const colors = PLANET_COLORS[sub.planet] ?? PLANET_COLORS.Ketu;

                return (
                  <button
                    key={`${sub.planet}-${sub.startDate}`}
                    type="button"
                    onClick={() => onSelectedDateChange(start)}
                    className={cn(
                      'absolute top-0 bottom-0 border-r border-black/15 text-[8px] font-bold transition-all',
                      colors.bar,
                      isActive
                        ? 'ring-2 ring-pink-400 ring-inset text-white z-10'
                        : 'opacity-60 hover:opacity-90 text-black/55',
                    )}
                    style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                    title={`${sub.planet} Antardasha`}
                  >
                    {width > 6 ? (PLANET_ABBR[sub.planet] ?? sub.planet.slice(0, 2)) : ''}
                  </button>
                );
              })}
            </div>
          )}
          {activeAntardasha && (
            <div className={cn('text-[10px] font-mono mt-2', theme === 'dark' ? 'text-white/40' : 'text-slate-500')}>
              Active: <span className="text-jyotish-gold">{activeAntardasha.planet}</span>
              {' · '}
              {format(new Date(activeAntardasha.startDate), 'MMM yyyy')} – {format(new Date(activeAntardasha.endDate), 'MMM yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface DashaTimelineLoaderProps {
  birthTime: Date;
  lat: number;
  lon: number;
  timezone?: string | null;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
}

export const DashaTimelineLoader: React.FC<DashaTimelineLoaderProps> = ({
  birthTime,
  lat,
  lon,
  timezone,
  selectedDate,
  onSelectedDateChange,
}) => {
  const { theme } = useTheme();
  const [data, setData] = React.useState<VimshottariDashasResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    import('../services/dashasService')
      .then(({ fetchVimshottariDashas }) => fetchVimshottariDashas(birthTime, lat, lon, timezone))
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Failed to load dasha timeline');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [birthTime, lat, lon, timezone]);

  if (isLoading) {
    return (
      <div className={cn(
        'rounded-3xl border p-8 flex items-center justify-center gap-3',
        theme === 'dark' ? 'bg-mystic-purple/20 border-jyotish-gold/10' : 'bg-orange-50 border-orange-200',
      )}>
        <Loader2 className="w-5 h-5 animate-spin text-jyotish-gold" />
        <span className={cn('text-sm', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
          Calculating Vimshottari timeline…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn(
        'rounded-3xl border p-5 text-sm',
        theme === 'dark' ? 'bg-red-500/5 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-600',
      )}>
        {error ?? 'Dasha timeline unavailable'}
      </div>
    );
  }

  return (
    <DashaTimeline
      data={data}
      selectedDate={selectedDate}
      onSelectedDateChange={onSelectedDateChange}
      isPlaying={isPlaying}
      onPlayingChange={setIsPlaying}
    />
  );
};
