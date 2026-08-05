import React, { useEffect, useState } from 'react';
import { Compass, Menu, Moon, Sun, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface LandingNavbarProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

function useScrolled(threshold = 20): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onOpenAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 px-5 py-4 transition-all duration-300 md:px-8',
        scrolled
          ? isDark
            ? 'backdrop-blur-xl bg-[#08060d]/85 border-b border-cosmic-accent/15'
            : 'backdrop-blur-xl bg-surface-card/90 border-b border-border-gold'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#top" className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-jyotish-gold/30 bg-jyotish-gold/10">
            <Compass className="h-4 w-4 text-jyotish-gold" />
          </span>
          <span>
            <span className={cn('block font-serif text-lg font-semibold italic leading-none', isDark ? 'text-white' : 'text-ink-primary')}>Soul Blueprint</span>
            <span className={cn('mt-1 hidden font-mono text-[8px] uppercase tracking-[0.24em] sm:block', isDark ? 'text-white/45' : 'text-ink-muted')}>Pattern & reflection</span>
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#observatory" className={cn('text-sm transition-colors', isDark ? 'text-white/65 hover:text-white' : 'text-ink-muted hover:text-ink-primary')}>Explore</a>
          <a href="#calculators" className={cn('text-sm transition-colors', isDark ? 'text-white/65 hover:text-white' : 'text-ink-muted hover:text-ink-primary')}>Free tools</a>
          <a href="#inside" className={cn('text-sm transition-colors', isDark ? 'text-white/65 hover:text-white' : 'text-ink-muted hover:text-ink-primary')}>Features</a>
          <button onClick={() => onOpenAuth('signin')} className={cn('text-sm transition-colors', isDark ? 'text-white/70 hover:text-white' : 'text-ink-secondary hover:text-ink-primary')}>Sign in</button>
          <button
            onClick={toggleTheme}
            className={cn(
              'rounded-lg border p-2 transition-all',
              isDark
                ? 'border-jyotish-gold/20 bg-mystic-purple/40 text-jyotish-gold hover:bg-mystic-purple/60'
                : 'border-border-gold bg-surface-card text-jyotish-gold hover:bg-surface-muted shadow-sm'
            )}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onOpenAuth('signup')}
            className="rounded-full bg-jyotish-gold px-5 py-2.5 text-sm font-semibold text-[#1a0b2e] transition hover:bg-celestial-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/60"
          >
            Create your profile
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'rounded-full border p-2',
              isDark ? 'border-white/15 text-jyotish-gold' : 'border-border-gold text-jyotish-gold bg-surface-card'
            )}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(value => !value)}
            className={cn('rounded-full border p-2 md:hidden', isDark ? 'border-white/15 text-white' : 'border-border-gold text-ink-primary')}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={cn(
          'mx-auto mt-4 flex max-w-7xl flex-col gap-2 rounded-2xl border p-3 md:hidden',
          isDark ? 'border-white/10 bg-[#0d0914]/95' : 'border-border-gold bg-surface-card/95'
        )}>
          <a href="#observatory" onClick={() => setMenuOpen(false)} className={cn('rounded-xl px-4 py-3 text-sm', isDark ? 'text-white/75' : 'text-ink-secondary')}>Explore</a>
          <a href="#calculators" onClick={() => setMenuOpen(false)} className={cn('rounded-xl px-4 py-3 text-sm', isDark ? 'text-white/75' : 'text-ink-secondary')}>Free tools</a>
          <a href="#inside" onClick={() => setMenuOpen(false)} className={cn('rounded-xl px-4 py-3 text-sm', isDark ? 'text-white/75' : 'text-ink-secondary')}>Features</a>
          <button onClick={() => { setMenuOpen(false); onOpenAuth('signin'); }} className={cn('rounded-xl px-4 py-3 text-left text-sm', isDark ? 'text-white/75' : 'text-ink-secondary')}>Sign in</button>
          <button onClick={() => { setMenuOpen(false); onOpenAuth('signup'); }} className="rounded-xl bg-jyotish-gold px-4 py-3 text-sm font-semibold text-[#1a0b2e]">Create your profile</button>
        </div>
      )}
    </nav>
  );
};
