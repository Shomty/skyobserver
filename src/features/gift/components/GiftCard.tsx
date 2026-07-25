import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import { trackGiftEvent } from '../lib/analytics';
import type { GiftDefinition } from '../types';

interface Props {
  gift: GiftDefinition;
}

const accentBorder: Record<string, string> = {
  'accent-gold': 'border-jyotish-gold/30 hover:border-jyotish-gold/60',
  'accent-violet': 'border-violet-400/30 hover:border-violet-400/50',
  'accent-indigo': 'border-indigo-400/30 hover:border-indigo-400/50',
};

export function GiftCard({ gift }: Props) {
  const { theme } = useTheme();
  const note = t(`${gift.copyKey}.note`);

  return (
    <article
      className={cn(
        'rounded-2xl border p-5 flex flex-col gap-3 transition-colors duration-300',
        theme === 'dark' ? 'bg-white/[0.03]' : 'bg-white shadow-sm',
        accentBorder[gift.accentClass] ?? 'border-white/10'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          className={cn(
            'font-serif text-title',
            theme === 'dark' ? 'text-white/95' : 'text-slate-900'
          )}
        >
          {t(`${gift.copyKey}.name`)}
        </h2>
        {gift.badge === 'new' ? (
          <span className="shrink-0 rounded-full bg-jyotish-gold/15 px-2 py-0.5 text-caption font-mono uppercase tracking-wider text-jyotish-gold">
            {t('chooser.badge.new')}
          </span>
        ) : null}
      </div>
      <p className={cn('text-body flex-1', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
        {t(`${gift.copyKey}.description`)}
      </p>
      {note ? (
        <p
          className={cn(
            'text-caption rounded-xl px-3 py-2',
            theme === 'dark' ? 'bg-white/[0.04] text-white/50' : 'bg-slate-50 text-slate-500'
          )}
        >
          {note}
        </p>
      ) : null}
      <Link
        to={`/gift/${gift.slug}`}
        onClick={() => trackGiftEvent('gift_card_clicked', { gift: gift.slug })}
        className="mt-1 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-jyotish-gold px-4 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
      >
        {t(`${gift.copyKey}.cta`)}
      </Link>
    </article>
  );
}
