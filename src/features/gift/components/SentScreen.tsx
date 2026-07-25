import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { GiftSlug } from '../types';
import { ShareRow } from './ShareRow';

interface Props {
  gift: GiftSlug;
  maskedEmail: string;
}

export function SentScreen({ gift, maskedEmail }: Props) {
  const { theme } = useTheme();

  return (
    <section
      className={cn(
        'rounded-2xl border p-6 sm:p-8 space-y-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <div>
        <h1 className="font-serif text-heading">{t('sent.title')}</h1>
        <p className="mt-4 text-body-lg font-medium text-jyotish-gold">{t('sent.headline')}</p>
        <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/65' : 'text-slate-600')}>
          {t('sent.body', { email: maskedEmail })}
        </p>
        <p className={cn('mt-2 text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-500')}>
          {t('sent.spam')}
        </p>
      </div>
      <ShareRow gift={gift} />
      <Link
        to="/gift"
        className={cn(
          'inline-flex min-h-[44px] items-center text-label underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50 rounded',
          theme === 'dark' ? 'text-white/60' : 'text-slate-600'
        )}
      >
        {t('sent.back')}
      </Link>
    </section>
  );
}
