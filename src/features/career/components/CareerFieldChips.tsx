import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { useCareerPremiumUnlocked } from '../context/CareerPremiumContext';
import { t } from '../copy/t';
import type { CareerField } from '../types';
import { PremiumLock } from './PremiumLock';

interface Props {
  fields: CareerField[];
  freeCount?: number;
}

export function CareerFieldChips({ fields, freeCount = 2 }: Props) {
  const { theme } = useTheme();
  const premiumUnlocked = useCareerPremiumUnlocked();
  const visible = premiumUnlocked ? fields : fields.slice(0, freeCount);
  const locked = premiumUnlocked ? [] : fields.slice(freeCount, freeCount + 3);

  const chipClass = cn(
    'inline-flex rounded-full px-3 py-1.5 text-caption font-medium',
    theme === 'dark' ? 'bg-jyotish-gold/15 text-jyotish-gold border border-jyotish-gold/30' : 'bg-amber-50 text-amber-900 border border-amber-200'
  );

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <h3 className="font-serif text-title">{t('fields.title')}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {visible.map((f) => (
          <span key={f.label} className={chipClass}>
            {f.label}
          </span>
        ))}
      </div>
      {locked.length > 0 ? (
        <div className="mt-4">
          <PremiumLock>
            <div className="flex flex-wrap gap-2 p-2">
              {locked.map((f) => (
                <span key={f.label} className={chipClass}>
                  {f.label}
                </span>
              ))}
            </div>
          </PremiumLock>
          <p className={cn('mt-2 text-center text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
            {t('fields.locked')}
          </p>
        </div>
      ) : null}
    </section>
  );
}
