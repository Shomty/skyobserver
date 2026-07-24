import type { ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface LabelProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  muted?: boolean;
}

/**
 * Canonical micro-label: replaces the old text-[8-10px] uppercase font-mono
 * pattern with a readable 12px sans caption.
 */
export function Label({ children, as: Tag = 'span', className, muted = true }: LabelProps) {
  const { theme } = useTheme();

  return (
    <Tag
      className={cn(
        'text-caption font-medium uppercase tracking-wider',
        muted
          ? theme === 'dark' ? 'text-white/50' : 'text-slate-500'
          : theme === 'dark' ? 'text-white/80' : 'text-slate-700',
        className
      )}
    >
      {children}
    </Tag>
  );
}
