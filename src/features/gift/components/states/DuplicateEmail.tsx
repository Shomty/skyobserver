import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../lib/utils';
import { t } from '../../copy/t';

interface Props {
  maskedEmail: string;
  onUseDifferent: () => void;
}

export function DuplicateEmail({ maskedEmail, onUseDifferent }: Props) {
  const { theme } = useTheme();
  return (
    <section
      className={cn(
        'rounded-2xl border p-6 sm:p-8',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <h1 className="font-serif text-heading">{t('duplicate.title')}</h1>
      <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
        {t('duplicate.body', { email: maskedEmail })}
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onUseDifferent}
          className="min-h-[44px] rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
        >
          {t('duplicate.different')}
        </button>
        <a
          href={t('contact.href')}
          className={cn(
            'inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 text-label font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
            theme === 'dark' ? 'border-white/15 text-white/80' : 'border-slate-200 text-slate-700'
          )}
        >
          {t('duplicate.contact')}
        </a>
      </div>
    </section>
  );
}
