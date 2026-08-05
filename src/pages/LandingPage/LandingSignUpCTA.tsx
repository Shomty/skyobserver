import React from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface LandingSignUpCTAProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingSignUpCTA: React.FC<LandingSignUpCTAProps> = ({ onOpenAuth }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className={cn('landing-section-cta relative z-10 px-5 py-20 md:px-8 md:py-24', isDark ? 'dark' : 'light')}>
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            'landing-animate-fade-up relative overflow-hidden rounded-2xl border px-7 py-12 motion-reduce:animate-none md:px-14 md:py-16',
            isDark
              ? 'border-cosmic-accent/20 bg-[linear-gradient(135deg,#2e1065_0%,#1a0b2e_45%,#0f051d_100%)] text-white'
              : 'border-border-gold bg-[linear-gradient(135deg,#fff9f0_0%,#fffcf7_45%,#f4f0e8_100%)] text-ink-primary',
          )}
        >
          <div className="relative z-10 grid gap-9 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-jyotish-gold/80">Your private reflection space</p>
              <h2 className="mt-4 max-w-3xl font-serif text-5xl font-medium italic leading-[0.92] md:text-7xl">
                Your pattern is not a verdict. It is a map.
              </h2>
              <div className={cn('mt-6 flex items-center gap-2 text-sm', isDark ? 'text-white/60' : 'text-ink-secondary')}>
                <LockKeyhole className="h-4 w-4" />
                New accounts require approval before full access.
              </div>
            </div>
            <div className="flex flex-col gap-3 md:min-w-56">
              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center justify-between rounded-full bg-jyotish-gold px-6 py-4 font-semibold text-[#1a0b2e] transition hover:bg-celestial-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/60"
              >
                Create account <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onOpenAuth('signin')}
                className={cn(
                  'rounded-full border px-6 py-4 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent',
                  isDark
                    ? 'border-white/20 text-white/85 hover:border-cosmic-accent/50 hover:bg-white/5'
                    : 'border-border-gold text-ink-secondary hover:border-jyotish-gold/50 hover:bg-surface-muted',
                )}
              >
                Sign in
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-cosmic-accent/15" />
          <div className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-jyotish-gold/10" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(157,124,255,0.16),transparent_45%)]" />
        </div>
      </div>
    </section>
  );
};
