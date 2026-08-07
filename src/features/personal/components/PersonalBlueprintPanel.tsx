import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { PersonalSnapshot } from '../types';

interface Props {
  wheel: PersonalSnapshot['personalityWheel'];
}

const LAYER_STYLES = [
  { key: 'persona' as const, field: 'outerStyle' as const, color: 'from-amber-500/20 to-amber-600/5' },
  { key: 'emotion' as const, field: 'emotionalStyle' as const, color: 'from-slate-400/20 to-slate-500/5' },
  { key: 'drive' as const, field: 'driveStyle' as const, color: 'from-jyotish-gold/25 to-jyotish-gold/5' },
];

export function PersonalBlueprintPanel({ wheel }: Props) {
  const { theme } = useTheme();

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
      )}
    >
      <h3 className="font-serif text-title">{t('blueprint.title')}</h3>
      <p className={cn('mt-1 text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
        {t('blueprint.subtitle')}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {LAYER_STYLES.map(({ key, field, color }) => (
          <div
            key={key}
            className={cn(
              'rounded-xl border bg-gradient-to-b p-4',
              color,
              theme === 'dark' ? 'border-white/10' : 'border-slate-200',
            )}
          >
            <p className={cn('text-caption uppercase tracking-wider', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
              {t(`blueprint.${key}`)}
            </p>
            <p className="mt-2 text-body font-medium capitalize">{wheel[field]}</p>
          </div>
        ))}
      </div>
      <p className={cn('mt-4 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
        <span className="font-medium">{t('blueprint.identityFocus')}:</span> {wheel.identityFocus}
      </p>
    </section>
  );
}
