import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { Label } from './Label';

interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  delta?: ReactNode;
  className?: string;
}

/**
 * Summary tile for dashboard overview grids. Replaces the old
 * text-[8px] label + cramped value pattern.
 */
export function StatTile({ label, value, icon, delta, className }: StatTileProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        'rounded-xl border p-3 flex flex-col gap-1.5 transition-colors duration-500',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {icon && <span className="text-jyotish-gold shrink-0">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'text-title font-semibold',
            theme === 'dark' ? 'text-white/90' : 'text-slate-900'
          )}
        >
          {value}
        </span>
        {delta && <span className="text-caption text-jyotish-gold">{delta}</span>}
      </div>
    </div>
  );
}
