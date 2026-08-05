import React from 'react';
import { ArrowRight, Briefcase, CalendarDays, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

interface CalculatorLink {
  icon: LucideIcon;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
}

const CALCULATORS: CalculatorLink[] = [
  {
    icon: Briefcase,
    href: '/career',
    eyebrow: 'Career',
    title: 'Free Vedic career report',
    description: '10th house analysis, Vimshottari dashas, and professional strengths from your sidereal birth chart.',
    cta: 'Career calculator',
  },
  {
    icon: UserRound,
    href: '/personal',
    eyebrow: 'Personal',
    title: 'Free personal insight report',
    description: 'Personality wheel, inner vs outer self, life mission themes, and shadow patterns — instant snapshot.',
    cta: 'Personal calculator',
  },
  {
    icon: CalendarDays,
    href: '/daily',
    eyebrow: 'Daily',
    title: 'Free daily energy report',
    description: 'Today\'s cosmic weather, 7-day forecast, and transit guidance from your chart and current location.',
    cta: 'Daily calculator',
  },
  {
    icon: Sparkles,
    href: '/gift',
    eyebrow: 'Gift',
    title: 'Send a chart reading as a gift',
    description: 'Share a thoughtful Vedic astrology report with someone special — no account required to start.',
    cta: 'Gift a reading',
  },
];

export const LandingCalculators: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section
      id="calculators"
      aria-labelledby="calculators-title"
      className={cn('relative z-10 px-5 py-20 md:px-8 md:py-24', isDark ? 'dark' : 'light')}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 max-w-2xl">
          <p className="landing-kicker mb-4">Free tools</p>
          <h2
            id="calculators-title"
            className={cn('font-serif text-4xl font-medium italic leading-tight md:text-5xl', isDark ? 'text-[#ede8f5]' : 'text-ink-primary')}
          >
            Vedic report calculators — no account needed
          </h2>
          <p className={cn('mt-4 text-base leading-7', isDark ? 'text-white/60' : 'text-ink-secondary')}>
            Start with a free sidereal chart snapshot. Each calculator uses Lahiri ayanamsa,
            real ephemeris positions, and a unique share link you can send anywhere.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {CALCULATORS.map(({ icon: Icon, href, eyebrow, title, description, cta }) => (
            <article
              key={href}
              className={cn(
                'dashboard-panel flex h-full flex-col p-6 sm:p-8',
                isDark ? 'dark' : 'light',
              )}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="landing-kicker">{eyebrow}</span>
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-jyotish-gold/25 bg-jyotish-gold/10">
                  <Icon className="h-4 w-4 text-jyotish-gold" aria-hidden="true" />
                </span>
              </div>
              <h3 className={cn('font-serif text-2xl font-medium italic', isDark ? 'text-white' : 'text-ink-primary')}>
                {title}
              </h3>
              <p className={cn('mt-3 flex-1 text-sm leading-6', isDark ? 'text-white/55' : 'text-ink-muted')}>
                {description}
              </p>
              <Link
                to={href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-jyotish-gold transition hover:text-celestial-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
              >
                {cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
