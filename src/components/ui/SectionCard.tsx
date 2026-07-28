import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeClasses } from '../../lib/themeClasses';

interface SectionCardProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Canonical glassmorphism card used across data-dense views. Keeps the
 * existing dark/light conditional convention so it drops into any screen.
 */
export function SectionCard({
  title,
  icon,
  action,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
}: SectionCardProps) {
  const tc = useThemeClasses();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const hasHeader = Boolean(title || icon || action);

  return (
    <div className={cn('rounded-2xl border p-4 transition-colors duration-500', tc.surface, className)}>
      {hasHeader && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={collapsible ? () => setCollapsed((c) => !c) : undefined}
            className={cn(
              'flex items-center gap-2 min-w-0',
              collapsible ? 'cursor-pointer' : 'cursor-default'
            )}
            disabled={!collapsible}
          >
            {icon && <span className="text-jyotish-gold">{icon}</span>}
            {title && (
              <h3 className={cn('text-title font-serif truncate', tc.textPrimary)}>
                {title}
              </h3>
            )}
            {collapsible && (
              <ChevronDown
                className={cn(
                  'w-4 h-4 shrink-0 transition-transform',
                  collapsed && '-rotate-90',
                  tc.textFaint
                )}
              />
            )}
          </button>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {!collapsed && children}
    </div>
  );
}
