import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { useCareerPremiumUnlocked } from '../context/CareerPremiumContext';
import { trackCareerEvent } from '../lib/analytics';
import { t } from '../copy/t';

export function CareerUpsell() {
  const { theme } = useTheme();
  const premiumUnlocked = useCareerPremiumUnlocked();

  if (premiumUnlocked) return null;

  return (
    <section className="rounded-2xl border border-jyotish-gold/30 bg-gradient-to-br from-mystic-purple/80 to-black/60 p-6 sm:p-8 text-center">
      <h3 className="font-serif text-heading gold-gradient-text">{t('upsell.title')}</h3>
      <p className={cn('mx-auto mt-3 max-w-lg text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-300')}>
        {t('upsell.body')}
      </p>
      <p className={cn('mt-2 text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
        {t('upsell.note')}
      </p>
      <Link
        to="/?auth=signup&from=career"
        onClick={() => trackCareerEvent('career_upsell_clicked')}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-jyotish-gold px-6 text-label font-semibold text-black shadow-[0_0_20px_rgba(212,175,55,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
      >
        {t('upsell.cta')}
      </Link>
    </section>
  );
}
