import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { CareerSnapshot } from '../types';

interface Props {
  timing: CareerSnapshot['timing'];
}

export function CareerTimeline({ timing }: Props) {
  const { theme } = useTheme();
  const rowClass = cn(
    'rounded-lg px-4 py-3',
    theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-50'
  );

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <h3 className="font-serif text-title">{t('timing.title')}</h3>
      <dl className="mt-4 space-y-3">
        <div className={rowClass}>
          <dt className={cn('text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
            {t('timing.opportunity')}
          </dt>
          <dd className="mt-1 text-body font-medium">
            {timing.opportunityWindow
              ? `${timing.opportunityWindow.from} – ${timing.opportunityWindow.to}`
              : t('timing.none')}
          </dd>
          {timing.opportunityWindow ? (
            <dd className={cn('mt-1 text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
              {timing.opportunityWindow.reason}
            </dd>
          ) : null}
        </div>
        <div className={rowClass}>
          <dt className={cn('text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
            {t('timing.peak')}
          </dt>
          <dd className="mt-1 text-body font-medium">
            {timing.peakEarning
              ? `${timing.peakEarning.from} – ${timing.peakEarning.to}`
              : t('timing.none')}
          </dd>
        </div>
        <div className={rowClass}>
          <dt className={cn('text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
            {t('timing.current')}
          </dt>
          <dd className="mt-1 text-body font-medium text-jyotish-gold">{timing.currentPeriodLord}</dd>
        </div>
      </dl>
    </section>
  );
}
