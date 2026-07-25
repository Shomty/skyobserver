import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { getGift } from '../config/gifts';
import { GiftShell } from '../components/GiftShell';
import { GiftWizard } from '../components/GiftWizard';
import { captureAttribution } from '../lib/utm';
import { t } from '../copy/t';

export default function GiftWizardPage() {
  const { slug = '' } = useParams();
  const gift = getGift(slug);
  const { theme } = useTheme();

  useEffect(() => {
    captureAttribution();
  }, []);

  if (!gift) {
    return (
      <GiftShell>
        <div className="space-y-4">
          <h1 className="font-serif text-heading">{t('notFound.title')}</h1>
          <p className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
            {t('notFound.body')}
          </p>
          <Link
            to="/gift"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
          >
            {t('notFound.cta')}
          </Link>
        </div>
      </GiftShell>
    );
  }

  return (
    <GiftShell dimBackground>
      <GiftWizard gift={gift} />
    </GiftShell>
  );
}
