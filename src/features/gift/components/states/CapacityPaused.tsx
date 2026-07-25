import { Link } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../lib/utils';
import { t } from '../../copy/t';

interface Props {
  resumeDate?: string;
  message?: string;
}

export function CapacityPaused({ resumeDate, message }: Props) {
  const { theme } = useTheme();
  return (
    <section
      className={cn(
        'rounded-2xl border p-6 sm:p-8',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <h1 className="font-serif text-heading">{t('capacity.paused.title')}</h1>
      <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
        {message || t('capacity.paused.body')}
      </p>
      {resumeDate ? (
        <p className={cn('mt-2 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
          {t('capacity.paused.resume', { date: resumeDate })}
        </p>
      ) : null}
      <Link
        to="/gift"
        className="inline-flex mt-6 min-h-[44px] items-center rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black shadow-[0_0_15px_rgba(212,175,55,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
      >
        {t('capacity.paused.back')}
      </Link>
    </section>
  );
}
