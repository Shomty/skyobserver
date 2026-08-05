import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../context/ThemeContext';

interface StaticHeroChartProps {
  compact?: boolean;
  onLoadLive?: () => void;
  showLoadButton?: boolean;
}

/** Lightweight CSS/SVG chart placeholder — avoids vedic-utils on mobile first paint. */
export const StaticHeroChart: React.FC<StaticHeroChartProps> = ({
  compact = false,
  onLoadLive,
  showLoadButton = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'dashboard-panel relative overflow-hidden',
        compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8',
        isDark ? 'dark' : 'light',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(157,124,255,0.12),transparent_62%)]" />
      <div className="relative mx-auto aspect-square max-w-[min(100%,22rem)]">
        <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" className={isDark ? 'text-white' : 'text-ink-primary'} />
          <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.75" className={isDark ? 'text-white' : 'text-ink-primary'} />
          {[0, 30, 60, 90, 120, 150].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x2 = 100 + Math.cos(rad) * 88;
            const y2 = 100 + Math.sin(rad) * 88;
            return (
              <line
                key={deg}
                x1="100"
                y1="100"
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="0.75"
                className={isDark ? 'text-jyotish-gold' : 'text-jyotish-gold'}
              />
            );
          })}
          <circle cx="100" cy="52" r="5" fill="#d4af37" fillOpacity="0.9" />
          <circle cx="145" cy="118" r="4" fill="#9d7cff" fillOpacity="0.85" />
          <circle cx="72" cy="130" r="4.5" fill="#f9e29b" fillOpacity="0.9" />
          <circle cx="128" cy="68" r="3.5" fill="#c4b5fd" fillOpacity="0.8" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn('rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em]', isDark ? 'border-white/15 bg-black/30 text-white/60' : 'border-border-gold bg-white/80 text-ink-muted')}>
            Sample sky map
          </div>
        </div>
      </div>
      {showLoadButton && onLoadLive && (
        <button
          type="button"
          onClick={onLoadLive}
          className={cn(
            'mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/60',
            isDark
              ? 'border-jyotish-gold/25 bg-jyotish-gold/10 text-jyotish-gold hover:bg-jyotish-gold/15'
              : 'border-jyotish-gold/40 bg-jyotish-gold/5 text-ink-secondary hover:bg-jyotish-gold/10',
          )}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Load live chart
        </button>
      )}
    </div>
  );
};
