import React, { useEffect, useState } from 'react';
import { Compass, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 px-5 py-4 transition-all duration-300 md:px-8',
        scrolled
          ? 'backdrop-blur-xl bg-[#08060d]/85 border-b border-cosmic-accent/15'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#top" className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-cosmic-accent/30 bg-cosmic-accent/10">
            <Compass className="h-4 w-4 text-cosmic-accent" />
          </span>
          <span>
            <span className="block font-serif text-lg font-semibold italic leading-none text-white">Soul Blueprint</span>
            <span className="mt-1 hidden font-mono text-[8px] uppercase tracking-[0.24em] text-white/45 sm:block">Pattern & reflection</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#observatory" className="text-sm text-white/65 transition-colors hover:text-white">Explore</a>
          <a href="#inside" className="text-sm text-white/65 transition-colors hover:text-white">Features</a>
          <button onClick={() => onOpenAuth('signin')} className="text-sm text-white/70 transition-colors hover:text-white">Sign in</button>
          <button
            onClick={() => onOpenAuth('signup')}
            className="rounded-full bg-cosmic-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cosmic-glow hover:text-cosmic-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-bright"
          >
            Create your profile
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(value => !value)}
          className="rounded-full border border-white/15 p-2 text-white md:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-4 flex max-w-7xl flex-col gap-2 rounded-2xl border border-white/10 bg-[#0d0914]/95 p-3 md:hidden">
          <a href="#observatory" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-white/75">Explore</a>
          <a href="#inside" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-white/75">Features</a>
          <button onClick={() => { setMenuOpen(false); onOpenAuth('signin'); }} className="rounded-xl px-4 py-3 text-left text-sm text-white/75">Sign in</button>
          <button onClick={() => { setMenuOpen(false); onOpenAuth('signup'); }} className="rounded-xl bg-cosmic-accent px-4 py-3 text-sm font-semibold text-white">Create your profile</button>
        </div>
      )}
    </nav>
  );
};
