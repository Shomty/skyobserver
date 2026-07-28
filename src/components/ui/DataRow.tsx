import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useThemeClasses } from '../../lib/themeClasses';
import { Label } from './Label';

interface DataRowProps {
  label: ReactNode;
  value: ReactNode;
  sublabel?: ReactNode;
  numeric?: boolean;
  accent?: 'gold' | 'red' | 'green' | 'blue' | 'neutral';
  className?: string;
}

const ACCENT_CLASSES: Record<NonNullable<DataRowProps['accent']>, string> = {
  gold: 'text-jyotish-gold',
  red: 'text-red-500',
  green: 'text-green-500',
  blue: 'text-blue-500',
  neutral: '',
};

/**
 * Definition-list row for planetary positions, dashas, degrees, etc.
 * Replaces ad-hoc flex rows with pervasive text-[10px] labels.
 */
export function DataRow({ label, value, sublabel, numeric = false, accent = 'neutral', className }: DataRowProps) {
  const tc = useThemeClasses();

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 min-h-[44px] py-1.5',
        className
      )}
    >
      <div className="min-w-0 flex flex-col justify-center">
        <Label muted>{label}</Label>
        {sublabel && (
          <span className={cn('text-caption mt-0.5', tc.textFaint)}>
            {sublabel}
          </span>
        )}
      </div>
      <div
        className={cn(
          'text-body font-medium text-right shrink-0',
          numeric && 'font-mono tabular',
          accent !== 'neutral' ? ACCENT_CLASSES[accent] : tc.textPrimary
        )}
      >
        {value}
      </div>
    </div>
  );
}
