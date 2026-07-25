import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CelestialBackground } from '../../../components/CelestialBackground';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

interface Props {
  children: ReactNode;
  /** Dim the starfield for form legibility on the wizard. */
  dimBackground?: boolean;
}

export function GiftShell({ children, dimBackground }: Props) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        'min-h-[100dvh] relative universe-bg',
        theme === 'dark' ? 'dark text-white' : 'light text-slate-900'
      )}
    >
      <div className={cn(dimBackground && 'opacity-40 transition-opacity')}>
        <CelestialBackground />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <Link
            to="/gift"
            className={cn(
              'font-serif italic text-title gold-gradient-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50 rounded',
              theme === 'dark' ? '' : ''
            )}
          >
            Vedic Sky
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
