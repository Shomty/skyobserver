import type { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import {
  reportGlassActionBarClass,
  reportGlassBadgeClass,
  reportGlassPanelClass,
} from '../../lib/reportGlassStyles';

interface Props {
  /** Small caps label — e.g. page title */
  kicker?: string;
  personName?: string;
  /** Muted descriptor under the name — e.g. "Your personal snapshot" */
  subtitle?: string;
  meta?: ReactNode;
  toolbar?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ReportMetaBadge({
  children,
  accent,
  className,
}: {
  children: ReactNode;
  accent?: 'gold' | 'emerald';
  className?: string;
}) {
  const { theme } = useTheme();
  return <span className={cn(reportGlassBadgeClass(theme, accent), className)}>{children}</span>;
}

export function ReportResultHeader({
  kicker,
  personName,
  subtitle,
  meta,
  toolbar,
  actions,
  className,
}: Props) {
  const { theme } = useTheme();
  const muted = theme === 'dark' ? 'text-white/45' : 'text-slate-500';
  const hasFooter = Boolean(toolbar || actions);

  return (
    <div className={cn(reportGlassPanelClass(theme), 'print:hidden', className)}>
      <div className="relative px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
        {kicker ? (
          <p className="text-caption font-mono uppercase tracking-[0.22em] text-jyotish-gold/75">{kicker}</p>
        ) : null}
        {personName ? (
          <h2 className="report-hero-name mt-2 max-w-3xl">{personName}</h2>
        ) : null}
        {subtitle ? <p className={cn('mt-2 text-body', muted)}>{subtitle}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>

      {hasFooter ? (
        <div className={reportGlassActionBarClass(theme)}>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : <span />}
          {toolbar ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{toolbar}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
