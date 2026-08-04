import { Loader2, Sparkles } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { useCareerPremiumUnlocked } from '../context/CareerPremiumContext';
import { t } from '../copy/t';
import type { CareerAiSynthesis } from '../types';
import { PremiumLock } from './PremiumLock';

interface Props {
  synthesis: CareerAiSynthesis | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

export function CareerSynthesisPanel({ synthesis, loading, error, fromCache }: Props) {
  const { theme } = useTheme();
  const premiumUnlocked = useCareerPremiumUnlocked();

  const body = (
    <div className="space-y-4">
      {loading ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-6',
            theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'
          )}
          role="status"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-jyotish-gold" />
          <p className={cn('text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
            {t('synthesis.loading')}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className={cn('text-body', theme === 'dark' ? 'text-red-300/90' : 'text-red-700')} role="alert">
          {error}
        </p>
      ) : null}

      {synthesis ? (
        <>
          {fromCache ? (
            <p className={cn('text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-500')}>
              {t('synthesis.cachedNote')}
            </p>
          ) : null}
          <div
            className={cn(
              'rounded-xl border px-4 py-5 sm:px-6 sm:py-6',
              theme === 'dark'
                ? 'border-jyotish-gold/15 bg-white/[0.02]'
                : 'border-amber-100 bg-white'
            )}
          >
            {synthesis.text.split(/\n\n+/).map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className={cn(
                  'text-body leading-relaxed [&+&]:mt-4',
                  theme === 'dark' ? 'text-white/80' : 'text-slate-700'
                )}
              >
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        theme === 'dark'
          ? 'border-jyotish-gold/25 bg-gradient-to-b from-jyotish-gold/[0.08] to-transparent'
          : 'border-amber-300/60 bg-gradient-to-b from-amber-50/90 to-white'
      )}
    >
      <header className="border-b border-jyotish-gold/15 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-jyotish-gold" aria-hidden />
          <p className="text-caption font-mono uppercase tracking-[0.2em] text-jyotish-gold/80">
            {t('synthesis.kicker')}
          </p>
        </div>
        <h3 className="mt-2 font-serif text-heading gold-gradient-text">{t('synthesis.title')}</h3>
        <p className={cn('mt-2 max-w-2xl text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
          {t('synthesis.subtitle')}
        </p>
      </header>

      <div className="p-4 sm:p-6">
        {premiumUnlocked ? (
          body
        ) : (
          <PremiumLock>
            <p className={cn('text-body leading-relaxed blur-sm select-none', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
              {t('synthesis.teaser')}
            </p>
          </PremiumLock>
        )}
      </div>
    </section>
  );
}
