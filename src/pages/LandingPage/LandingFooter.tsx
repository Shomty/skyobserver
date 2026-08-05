import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { FREE_REPORTS } from './lib/freeReportsConfig';

const FOOTER_LINKS = [
  ...FREE_REPORTS.map(({ href, seoLabel }) => ({ to: href, label: seoLabel })),
  { to: '/gift', label: 'Gift a reading' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
] as const;

export const LandingFooter: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer className={cn('landing-section-footer px-5 py-10 md:px-8', isDark ? 'dark' : 'light')}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <nav
          aria-label="Site links"
          className={cn('flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.14em]', isDark ? 'text-white/45' : 'text-ink-muted')}
        >
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn('rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent/50', isDark ? 'hover:text-white/60' : 'hover:text-ink-primary')}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-cosmic-accent/25">
              <Compass className="h-4 w-4 text-cosmic-accent" />
            </span>
            <span className={cn('font-serif text-base italic', isDark ? 'text-white/85' : 'text-ink-primary')}>Soul Blueprint</span>
            <span className={cn('ml-1 text-xs', isDark ? 'text-white/35' : 'text-ink-faint')}>© 2026</span>
          </div>
          <p className={cn('font-mono text-[10px] uppercase tracking-[0.14em]', isDark ? 'text-white/45' : 'text-ink-muted')}>
            Patterns before conclusions
          </p>
        </div>
      </div>
    </footer>
  );
};
