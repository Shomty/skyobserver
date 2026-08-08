import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { reportGlassSegmentTrackClass } from '../../../lib/reportGlassStyles';
import { t } from '../copy/t';
import type { DailyViewMode } from '../lib/dailyViewMode';

interface Props {
  mode: DailyViewMode;
  onChange: (mode: DailyViewMode) => void;
  className?: string;
}

export function DailyViewModeToggle({ mode, onChange, className }: Props) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(reportGlassSegmentTrackClass(theme), className)}
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
              'min-h-[36px] rounded-full px-3.5 text-label font-medium transition',
              active
                ? 'bg-jyotish-gold/90 text-black shadow-sm'
                : theme === 'dark'
                  ? 'text-white/55 hover:text-white/85'
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
