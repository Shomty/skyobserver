import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const hasHeader = Boolean(title || icon || action);

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-colors duration-500',
        theme === 'dark'
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white border-slate-200 shadow-sm',
        className
      )}
    >
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
            {icon && (
              <span className={theme === 'dark' ? 'text-jyotish-gold' : 'text-jyotish-gold'}>
                {icon}
              </span>
            )}
            {title && (
              <h3
                className={cn(
                  'text-title font-serif truncate',
                  theme === 'dark' ? 'text-white/90' : 'text-slate-900'
                )}
              >
                {title}
              </h3>
            )}
            {collapsible && (
              <ChevronDown
                className={cn(
                  'w-4 h-4 shrink-0 transition-transform',
                  collapsed && '-rotate-90',
                  theme === 'dark' ? 'text-white/40' : 'text-slate-400'
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
