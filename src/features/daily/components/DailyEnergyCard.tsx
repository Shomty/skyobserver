import { Loader2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import type { DailyPlainEnergyProfile } from '../lib/dailyGuidanceFingerprint';
import type { DailyViewMode } from '../lib/dailyViewMode';
import { t } from '../copy/t';
import { energyLevelColor, type DayForecast } from '../lib/dailyForecastEngine';

interface Props {
  day: DayForecast;
  viewMode?: DailyViewMode;
  plainEnergy?: DailyPlainEnergyProfile | null;
  plainEnergyLoading?: boolean;
}

export function DailyEnergyCard({ day, viewMode = 'vedic', plainEnergy, plainEnergyLoading }: Props) {
  const { theme } = useTheme();
  const color = energyLevelColor(day.energyLevel);
  const isPlain = viewMode === 'plain';
  const levelCopy = isPlain && plainEnergy?.scoreMeaning
    ? plainEnergy.scoreMeaning
    : t(`energy.${day.energyLevel}`);

  const title = isPlain
    ? t('plain.energyTitle', { day: day.isToday ? t('plain.today') : day.label })
    : t('energy.title');

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        theme === 'dark'
          ? 'border-jyotish-gold/25 bg-gradient-to-br from-jyotish-gold/[0.08] to-transparent'
          : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
        isPlain && 'border-emerald-500/25',
      )}
    >
      <div className="p-4 sm:p-6">
        <p
          className={cn(
            'text-caption font-mono uppercase tracking-[0.2em]',
            isPlain ? 'text-emerald-400/80' : 'text-jyotish-gold/80',
          )}
        >
          {title}
        </p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span
                className={cn(
                  'font-serif text-5xl tabular-nums',
                  isPlain ? 'text-emerald-400' : 'text-jyotish-gold',
                )}
              >
                {day.energyScore}
              </span>
              <span className={cn('text-caption', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
                / 100
              </span>
            </div>
            <p className={cn('mt-2 text-body font-medium leading-relaxed', theme === 'dark' ? 'text-white/85' : 'text-slate-800')}>
              {levelCopy}
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <div
              className={cn(
                'mb-2 flex justify-between text-caption',
                theme === 'dark' ? 'text-white/40' : 'text-slate-500',
              )}
            >
              <span>{t('energy.score')}</span>
              <span style={{ color }}>{day.energyLevel}</span>
            </div>
            <div
              className={cn(
                'h-3 overflow-hidden rounded-full',
                theme === 'dark' ? 'bg-white/10' : 'bg-slate-100',
              )}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${day.energyScore}%`, backgroundColor: color }}
              />
            </div>
          </div>
        </div>

        {isPlain ? (
          <div className="mt-5">
            {plainEnergyLoading && !plainEnergy ? (
              <div className="flex items-center gap-2" role="status">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" aria-hidden />
                <p className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
                  {t('plain.energyLoading')}
                </p>
              </div>
            ) : plainEnergy ? (
              <dl className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ['mind', 'plain.energyMind', plainEnergy.mind],
                    ['body', 'plain.energyBody', plainEnergy.body],
                    ['soul', 'plain.energySoul', plainEnergy.soul],
                  ] as const
                ).map(([key, labelKey, text]) => (
                  <div
                    key={key}
                    className={cn(
                      'rounded-xl border p-3',
                      theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white/80',
                    )}
                  >
                    <dt className="text-caption font-medium uppercase tracking-wide text-emerald-400/90">
                      {t(labelKey)}
                    </dt>
                    <dd className={cn('mt-2 text-body leading-relaxed', theme === 'dark' ? 'text-white/75' : 'text-slate-600')}>
                      {text}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={cn('text-body italic', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
                {t('plain.energyPending')}
              </p>
            )}
          </div>
        ) : (
          <ul className={cn('mt-5 space-y-2 text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
            {day.highlights.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-jyotish-gold" aria-hidden>
                  ·
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
