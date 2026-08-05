import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';

interface Props {
  detail?: string | null;
  onRetry: () => void;
}

export function DailyNetworkError({ detail, onRetry }: Props) {
  const { theme } = useTheme();
  return (
    <section
      className={cn(
        'rounded-2xl border p-6 sm:p-8',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
      )}
    >
      <h2 className="font-serif text-heading">{t('network.title')}</h2>
      <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
        {t('network.body')}
      </p>
      {detail ? (
        <p
          className={cn(
            'mt-3 rounded-lg border px-3 py-2 font-mono text-caption',
            theme === 'dark' ? 'border-white/10 bg-white/[0.03] text-white/50' : 'border-slate-200 bg-slate-50 text-slate-500',
          )}
        >
          {detail}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 min-h-[44px] rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
      >
        {t('network.retry')}
      </button>
    </section>
  );
}
