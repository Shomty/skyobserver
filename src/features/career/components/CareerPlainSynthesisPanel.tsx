import { Loader2, Sparkles } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { CareerAiPlainSynthesis } from '../types';
import { SynthesisMarkdownBody } from './SynthesisMarkdownBody';

interface Props {
  synthesis: CareerAiPlainSynthesis | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

export function CareerPlainSynthesisPanel({ synthesis, loading, error, fromCache }: Props) {
  const { theme } = useTheme();

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        theme === 'dark'
          ? 'border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent'
          : 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white',
      )}
    >
      <header className="border-b border-emerald-500/15 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" aria-hidden />
          <p className="text-caption font-mono uppercase tracking-[0.2em] text-emerald-600/80">
            {t('plainSynthesis.kicker')}
          </p>
        </div>
        <h3 className="mt-2 font-serif text-heading">{t('plainSynthesis.title')}</h3>
        <p className={cn('mt-2 max-w-2xl text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
          {t('plainSynthesis.subtitle')}
        </p>
      </header>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-6',
              theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50',
            )}
            role="status"
          >
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-500" />
            <p className={cn('text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
              {t('plainSynthesis.loading')}
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
              <p className={cn('mb-4 text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-500')}>
                {t('plainSynthesis.cachedNote')}
              </p>
            ) : null}
            <div
              className={cn(
                'rounded-xl border px-4 py-5 sm:px-6 sm:py-6',
                theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white',
              )}
            >
              <SynthesisMarkdownBody text={synthesis.text} />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
