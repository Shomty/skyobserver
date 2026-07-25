import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';

interface Props {
  step: 1 | 2 | 3;
}

export function WizardProgress({ step }: Props) {
  const { theme } = useTheme();
  return (
    <div className="mb-6" aria-hidden="false">
      <p
        className={cn(
          'text-caption font-mono uppercase tracking-widest mb-3',
          theme === 'dark' ? 'text-white/40' : 'text-slate-500'
        )}
      >
        {t('wizard.progress', { current: step, total: 3 })}
      </p>
      <div className="flex gap-2" role="presentation">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              n <= step
                ? 'bg-jyotish-gold'
                : theme === 'dark'
                  ? 'bg-white/10'
                  : 'bg-slate-200'
            )}
          />
        ))}
      </div>
    </div>
  );
}
