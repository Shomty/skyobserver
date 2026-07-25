import { Link } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../lib/utils';
import { t } from '../../copy/t';

export function DailyCapReached() {
  const { theme } = useTheme();
  return (
    <section
      className={cn(
        'rounded-2xl border p-6 sm:p-8',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <h1 className="font-serif text-heading">{t('capacity.daily.title')}</h1>
      <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
        {t('capacity.daily.body')}
      </p>
      <Link
        to="/gift"
        className="inline-flex mt-6 min-h-[44px] items-center rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
      >
        {t('capacity.daily.cta')}
      </Link>
    </section>
  );
}
