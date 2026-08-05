import { Loader2, Sparkles } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { DailyPlainGuidancePayload } from '../lib/dailyGuidanceFingerprint';
import type { DayForecast } from '../lib/dailyForecastEngine';
import { resolvePlainDayRead } from '../lib/resolvePlainDayRead';

interface Props {
  guidance: DailyPlainGuidancePayload | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  selectedDay: DayForecast | null;
  selectedDayIndex: number;
}

function Paragraphs({ text }: { text: string }) {
  const { theme } = useTheme();
  return (
    <>
      {text.split(/\n\n+/).map((p) => (
        <p
          key={p.slice(0, 48)}
          className={cn(
            'text-body leading-relaxed [&+&]:mt-3',
            theme === 'dark' ? 'text-white/80' : 'text-slate-700',
          )}
        >
          {p.trim()}
        </p>
      ))}
    </>
  );
}

export function DailyPlainGuidancePanel({
  guidance,
  loading,
  error,
  fromCache,
  selectedDay,
  selectedDayIndex,
}: Props) {
  const { theme } = useTheme();
  const dayRead =
    guidance && selectedDay ? resolvePlainDayRead(guidance, selectedDay, selectedDayIndex) : null;
  const dayLabel = selectedDay?.isToday ? t('plain.today') : (selectedDay?.label ?? t('plain.today'));

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        theme === 'dark'
          ? 'border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent'
          : 'border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white',
      )}
    >
      <header className="border-b border-emerald-500/15 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" aria-hidden />
          <p className="text-caption font-mono uppercase tracking-[0.2em] text-emerald-400/80">
            {t('plain.kicker')}
          </p>
        </div>
        <h3 className="mt-2 font-serif text-heading">{t('plain.title')}</h3>
        <p className={cn('mt-2 max-w-2xl text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
          {t('plain.subtitle')}
        </p>
      </header>

      <div className="space-y-4 p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center gap-3 py-8" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <p className={cn('text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
              {t('plain.loading')}
            </p>
          </div>
        ) : null}
        {error ? (
          <p className={cn('text-body', theme === 'dark' ? 'text-red-300/90' : 'text-red-700')} role="alert">
            {error}
          </p>
        ) : null}
        {guidance ? (
          <>
            {fromCache ? (
              <p className={cn('text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-500')}>
                {t('plain.cachedNote')}
              </p>
            ) : null}
            <p className={cn('text-caption italic', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
              {t('plain.disclaimer')}
            </p>
            {[
              { key: 'dayRead', label: dayLabel, text: dayRead },
              { key: 'innerFoundation', label: t('plain.foundation'), text: guidance.innerFoundation },
              { key: 'periodGuidance', label: t('plain.period'), text: guidance.periodGuidance },
              { key: 'practicalMoves', label: t('plain.moves'), text: guidance.practicalMoves },
            ].map(({ key, label, text }) => (
              <article
                key={key}
                className={cn(
                  'rounded-xl border p-4 sm:p-5',
                  theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white',
                )}
              >
                <h4 className="font-serif text-subtitle text-emerald-300/90">{label}</h4>
                <div className="mt-3">
                  {text ? <Paragraphs text={text} /> : null}
                </div>
              </article>
            ))}
          </>
        ) : null}
      </div>
    </section>
  );
}
