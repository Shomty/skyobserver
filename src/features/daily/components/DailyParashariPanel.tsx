import { Sparkles } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { ParashariSection } from '../lib/dailyParashariEngine';

interface Props {
  sections: ParashariSection[];
}

function SectionBody({ section }: { section: ParashariSection }) {
  const { theme } = useTheme();
  const muted = theme === 'dark' ? 'text-white/70' : 'text-slate-600';

  return (
    <div className="space-y-3">
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 48)} className={cn('text-body leading-relaxed', muted)}>
          {p}
        </p>
      ))}
      {section.bullets && section.bullets.length > 0 ? (
        <ul className={cn('list-disc space-y-1 pl-5 text-body', muted)}>
          {section.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DailyParashariPanel({ sections }: Props) {
  const { theme } = useTheme();

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        theme === 'dark'
          ? 'border-jyotish-gold/20 bg-gradient-to-b from-jyotish-gold/[0.06] to-transparent'
          : 'border-amber-200 bg-gradient-to-b from-amber-50/80 to-white',
      )}
    >
      <header className="border-b border-jyotish-gold/15 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-jyotish-gold" aria-hidden />
          <p className="text-caption font-mono uppercase tracking-[0.2em] text-jyotish-gold/80">
            {t('parashari.kicker')}
          </p>
        </div>
        <h3 className="mt-2 font-serif text-heading gold-gradient-text">{t('parashari.title')}</h3>
        <p className={cn('mt-2 max-w-2xl text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
          {t('parashari.subtitle')}
        </p>
      </header>

      <div className="space-y-4 p-4 sm:p-6">
        {sections.map((section) => (
          <article
            key={section.id}
            className={cn(
              'rounded-xl border p-4 sm:p-5',
              theme === 'dark' ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200',
            )}
          >
            <h4 className="font-serif text-lg text-jyotish-gold">{section.title}</h4>
            <p className={cn('mt-0.5 text-caption', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
              {section.subtitle}
            </p>
            <p className={cn('mt-3 text-body font-medium', theme === 'dark' ? 'text-white/85' : 'text-slate-800')}>
              {section.teaser}
            </p>
            <div className="mt-4">
              <SectionBody section={section} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
