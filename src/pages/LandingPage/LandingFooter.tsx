import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export const LandingFooter: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer className={cn('landing-section-footer px-5 py-10 md:px-8', isDark ? 'dark' : 'light')}>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-cosmic-accent/25">
            <Compass className="h-4 w-4 text-cosmic-accent" />
          </span>
          <span className={cn('font-serif text-base italic', isDark ? 'text-white/85' : 'text-ink-primary')}>Soul Blueprint</span>
          <span className={cn('ml-1 text-xs', isDark ? 'text-white/35' : 'text-ink-faint')}>© 2026</span>
        </div>
        <div className={cn('flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-[0.14em]', isDark ? 'text-white/45' : 'text-ink-muted')}>
          <span>Patterns before conclusions</span>
          <Link
            to="/privacy"
            className={cn('rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent/50', isDark ? 'hover:text-white/60' : 'hover:text-ink-primary')}
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className={cn('rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent/50', isDark ? 'hover:text-white/60' : 'hover:text-ink-primary')}
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
};
