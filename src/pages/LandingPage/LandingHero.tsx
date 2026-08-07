import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, Orbit } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { CelestialBackground } from '../../components/CelestialBackground';
import { FREE_REPORTS } from './lib/freeReportsConfig';

interface LandingHeroProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  children?: React.ReactNode;
}

function LiveClock({ isDark }: { isDark: boolean }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const utc = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;

  return (
    <p className={cn('font-mono text-[10px] tracking-[0.22em] uppercase tabular', isDark ? 'text-white/50' : 'text-ink-muted')}>
      Live cosmos · UTC {utc}
    </p>
  );
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenAuth, children }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section id="top" className="relative min-h-screen overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-40">
      <CelestialBackground />
      <div aria-hidden="true" className={cn('landing-hero-bottom-fade', isDark ? 'dark' : 'light')} />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <div className="landing-animate-fade-up-sm mb-8 flex items-center gap-4 motion-reduce:animate-none">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-jyotish-gold/30 bg-jyotish-gold/10">
              <Orbit className="h-4 w-4 text-jyotish-gold" />
            </span>
            <div>
              <p className="landing-kicker">Your personal pattern studio</p>
              <LiveClock isDark={isDark} />
            </div>
          </div>

          <h1
            className={cn(
              'landing-animate-fade-up landing-animate-delay-1 max-w-3xl motion-reduce:animate-none',
              isDark ? 'text-[#ede8f5]' : 'text-ink-primary'
            )}
          >
            <span className="landing-kicker mb-3 block not-italic">Your Soul Blueprint</span>
            <span className="block font-serif text-[clamp(4rem,9vw,7.7rem)] font-medium italic leading-[0.82] tracking-[-0.045em]">
              See the pattern behind your time.
            </span>
          </h1>

          <p
            className={cn(
              'landing-animate-fade-in landing-animate-delay-3 mt-8 max-w-xl text-base leading-7 md:text-lg motion-reduce:animate-none',
              isDark ? 'text-white/65' : 'text-ink-secondary'
            )}
          >
            Map your personality blueprint, life chapters, and daily emotional weather
            in one calm, precise workspace — grounded in psychology and real astronomy.
          </p>

          <div className="landing-animate-fade-up landing-animate-delay-4 mt-9 flex flex-col gap-3 sm:flex-row motion-reduce:animate-none">
            <button onClick={() => onOpenAuth('signup')} className="landing-btn-primary group inline-flex items-center justify-center gap-3">
              Create your profile
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </button>
            <button onClick={() => onOpenAuth('signin')} className={cn('landing-btn-secondary', isDark ? 'dark' : 'light')}>
              I already have an account
            </button>
          </div>

          <div className={cn('mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] uppercase tracking-[0.18em]', isDark ? 'text-white/45' : 'text-ink-muted')}>
            <span>Precision astronomy</span>
            <span>Private by default</span>
            <span>Reflective AI guidance</span>
          </div>

          <nav aria-label="Free reports" className="mt-8 flex flex-wrap gap-2">
            {FREE_REPORTS.map(({ href, eyebrow, seoLabel }) => (
              <Link
                key={href}
                to={href}
                title={seoLabel}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
                  isDark
                    ? 'border-white/15 text-white/70 hover:border-jyotish-gold/40 hover:text-white'
                    : 'border-border-gold text-ink-secondary hover:border-jyotish-gold/50 hover:text-ink-primary',
                )}
              >
                Free {eyebrow.toLowerCase()} report
              </Link>
            ))}
          </nav>
        </div>

        <div className="landing-animate-scale-in landing-animate-delay-2 relative motion-reduce:animate-none">
          <div className="pointer-events-none absolute -inset-16 rounded-full bg-cosmic-accent/10 blur-3xl" />
          {children}
        </div>
      </div>
    </section>
  );
};
