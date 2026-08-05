import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import { energyLevelColor, type DailyForecast, type DayForecast } from '../lib/dailyForecastEngine';
import type { DailyPlainGuidancePayload } from '../lib/dailyGuidanceFingerprint';
import { resolvePlainDayRead } from '../lib/resolvePlainDayRead';
import type { DailyViewMode } from '../lib/dailyViewMode';
import { DailyEnergyCard } from './DailyEnergyCard';

interface Props {
  forecast: DailyForecast;
  viewMode: DailyViewMode;
  plainGuidance?: DailyPlainGuidancePayload | null;
  selectedIndex: number;
  onSelectDay: (index: number) => void;
}

function DayDetail({
  day,
  viewMode,
  plainRead,
}: {
  day: DayForecast;
  viewMode: DailyViewMode;
  plainRead?: string;
}) {
  const { theme } = useTheme();
  const muted = theme === 'dark' ? 'text-white/70' : 'text-slate-600';

  if (viewMode === 'plain') {
    return (
      <div className="space-y-4">
        <DailyEnergyCard day={day} />
        <div
          className={cn(
            'rounded-xl border p-4',
            theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/80',
          )}
        >
          <h4 className="font-medium text-emerald-400">{t('plain.dayRead')}</h4>
          {plainRead ? (
            <p className={cn('mt-3 text-body leading-relaxed', muted)}>{plainRead}</p>
          ) : (
            <p className={cn('mt-3 text-body italic', muted)}>{t('plain.dayPending')}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DailyEnergyCard day={day} />
      <div
        className={cn(
          'rounded-xl border p-4',
          theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/80',
        )}
      >
        <h4 className="font-medium text-jyotish-gold">{t('forecast.panchang')}</h4>
        <p className={cn('mt-2 text-body', muted)}>
          {day.panchang.tithi.phase} {day.panchang.tithi.name} · {day.panchang.nakshatra.name} (
          {day.panchang.nakshatra.lord}) · {day.panchang.yoga.name} · {day.panchang.vara}
        </p>
      </div>
      <div
        className={cn(
          'rounded-xl border p-4',
          theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/80',
        )}
      >
        <h4 className="font-medium text-jyotish-gold">{t('forecast.transits')}</h4>
        {day.transitHits.length === 0 ? (
          <p className={cn('mt-2 text-body', muted)}>{t('forecast.noTransits')}</p>
        ) : (
          <ul className={cn('mt-3 space-y-3 text-body', muted)}>
            {day.transitHits.map((hit) => (
              <li key={`${hit.planet}-${hit.description}`}>
                <p className={cn('font-medium', theme === 'dark' ? 'text-white/90' : 'text-slate-800')}>
                  {hit.description}
                </p>
                <p className="mt-1 text-caption">{hit.interpretation}</p>
                {hit.actionableAdvice ? (
                  <p className="mt-1 text-caption italic text-jyotish-gold/80">{hit.actionableAdvice}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function DailyForecastPanel({
  forecast,
  viewMode,
  plainGuidance,
  selectedIndex,
  onSelectDay,
}: Props) {
  const { theme } = useTheme();
  const selected = forecast.days[selectedIndex] ?? forecast.days[0];
  const plainForDay =
    selected && plainGuidance
      ? resolvePlainDayRead(plainGuidance, selected, selectedIndex)
      : undefined;

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6 space-y-5',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
      )}
    >
      <div>
        <h3 className="font-serif text-title">{t('forecast.title')}</h3>
        <p className={cn('mt-1 text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
          {t('forecast.subtitle')} · {forecast.locationLabel}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('forecast.title')}>
        {forecast.days.map((day, index) => {
          const active = index === selectedIndex;
          const color = energyLevelColor(day.energyLevel);
          return (
            <button
              key={day.date}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectDay(index)}
              className={cn(
                'flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 transition',
                active
                  ? 'border-jyotish-gold/50 bg-jyotish-gold/10'
                  : theme === 'dark'
                    ? 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <span
                className={cn(
                  'text-caption font-medium',
                  active ? 'text-jyotish-gold' : theme === 'dark' ? 'text-white/50' : 'text-slate-500',
                )}
              >
                {day.label}
              </span>
              <span className="mt-1 font-serif text-lg tabular-nums" style={{ color }}>
                {day.energyScore}
              </span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <DayDetail day={selected} viewMode={viewMode} plainRead={plainForDay} />
      ) : null}
    </section>
  );
}
