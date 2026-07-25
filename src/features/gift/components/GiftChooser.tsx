import { useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { GIFT_SLUGS, GIFTS } from '../config/gifts';
import { t } from '../copy/t';
import { trackGiftEvent } from '../lib/analytics';
import { captureAttribution } from '../lib/utm';
import { GiftCard } from './GiftCard';
import { SuggestionForm } from './SuggestionForm';

export function GiftChooser() {
  const { theme } = useTheme();

  useEffect(() => {
    captureAttribution();
    trackGiftEvent('gift_chooser_viewed');
  }, []);

  return (
    <div className="space-y-10">
      <header>
        <h1
          className={cn(
            'font-serif text-display',
            theme === 'dark' ? 'text-white/95' : 'text-slate-900'
          )}
        >
          {t('chooser.title')}
        </h1>
        <p
          className={cn(
            'mt-3 text-body-lg max-w-xl',
            theme === 'dark' ? 'text-white/55' : 'text-slate-600'
          )}
        >
          {t('chooser.subtitle')}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GIFT_SLUGS.map((slug) => (
          <GiftCard key={slug} gift={GIFTS[slug]} />
        ))}
      </div>

      <SuggestionForm />
    </div>
  );
}
