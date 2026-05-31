import React, { useEffect, useState } from 'react';
import { Compass, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface LandingNavbarProps {
  onSignIn: () => Promise<void>;
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

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onSignIn }) => {
  const scrolled = useScrolled();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300',
        scrolled
          ? 'backdrop-blur-xl bg-black/40 border-b border-jyotish-gold/10'
          : 'bg-transparent'
      )}
    >
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-jyotish-gold" />
        <span className="font-serif italic text-white/90 text-base font-semibold">Vedic Sky</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={onSignIn}
          className="bg-jyotish-gold text-black rounded-xl px-4 py-2 text-sm font-semibold hover:bg-celestial-gold transition-colors"
        >
          Sign In
        </button>
      </div>
    </nav>
  );
};
