import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import { energyLevelColor, type DayForecast } from '../lib/dailyForecastEngine';

interface Props {
  day: DayForecast;
}

export function DailyEnergyCard({ day }: Props) {
  const { theme } = useTheme();
  const color = energyLevelColor(day.energyLevel);
  const levelCopy = t(`energy.${day.energyLevel}`);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        theme === 'dark'
          ? 'border-jyotish-gold/25 bg-gradient-to-br from-jyotish-gold/[0.08] to-transparent'
          : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
      )}
    >
      <div className="p-4 sm:p-6">
        <p className="text-caption font-mono uppercase tracking-[0.2em] text-jyotish-gold/80">
          {t('energy.title')}
        </p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-5xl tabular-nums text-jyotish-gold">{day.energyScore}</span>
              <span className={cn('text-caption', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
                / 100
              </span>
            </div>
            <p className={cn('mt-2 text-body font-medium', theme === 'dark' ? 'text-white/85' : 'text-slate-800')}>
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
      </div>
    </section>
  );
}
