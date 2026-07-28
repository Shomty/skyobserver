import type { ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useThemeClasses } from '../../lib/themeClasses';

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
  const tc = useThemeClasses();

  return (
    <Tag
      className={cn(
        'text-caption font-medium uppercase tracking-wider',
        muted ? tc.textMuted : tc.textSecondary,
        className
      )}
    >
      {children}
    </Tag>
  );
}
