import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { CareerViewMode } from '../lib/careerViewMode';

interface Props {
  mode: CareerViewMode;
  onChange: (mode: CareerViewMode) => void;
  className?: string;
}

export function CareerViewModeToggle({ mode, onChange, className }: Props) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex rounded-xl border p-1',
        theme === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50',
        className,
      )}
      role="group"
      aria-label={t('viewMode.label')}
    >
      {(['vedic', 'plain'] as const).map((value) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={cn(
              'min-h-[40px] rounded-lg px-4 text-label font-medium transition',
              active
                ? 'bg-jyotish-gold text-black shadow-sm'
                : theme === 'dark'
                  ? 'text-white/60 hover:text-white/85'
                  : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {t(value === 'vedic' ? 'viewMode.vedic' : 'viewMode.plain')}
          </button>
        );
      })}
    </div>
  );
}
