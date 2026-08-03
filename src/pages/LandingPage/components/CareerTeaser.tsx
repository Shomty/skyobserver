import React from 'react';
import { ArrowRight, Briefcase, Clock3, House, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

const HIGHLIGHTS = [
  { icon: House, label: '10th house', detail: 'Career sign & lord placement' },
  { icon: Clock3, label: 'Vimshottari dashas', detail: 'Current mahadasha & timing windows' },
  { icon: Sparkles, label: 'Career strengths', detail: 'Suggested fields from your chart' },
];

export const CareerTeaser: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section
      id="career"
      aria-labelledby="career-teaser-title"
      className={cn(
        'dashboard-panel overflow-hidden',
        isDark
          ? 'dark border-jyotish-gold/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.08),rgba(10,6,18,0.98))]'
          : 'light border-border-gold bg-gradient-to-br from-jyotish-gold/[0.06] to-surface-card',
      )}
    >
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-jyotish-gold/25 bg-jyotish-gold/10">
              <Briefcase size={16} className="text-jyotish-gold" aria-hidden="true" />
            </span>
            <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-300/90">
              Free · no account
            </span>
          </div>

          <p className="landing-kicker mt-5">Career report calculator</p>
          <h2
            id="career-teaser-title"
            className={cn('mt-2 font-serif text-2xl font-semibold sm:text-3xl', isDark ? 'text-white' : 'text-ink-primary')}
          >
            Your professional path,{' '}
            <span className="italic text-cosmic-accent">from the chart.</span>
          </h2>
          <p className={cn('mt-3 max-w-xl text-sm leading-6', isDark ? 'text-white/50' : 'text-ink-muted')}>
            Enter birth details once and get a free Vedic career snapshot — 10th house analysis,
            dasha timing, and strength scores. Shareable link included.
          </p>

          <ul className="mt-6 grid gap-2 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
              <li
                key={label}
                className={cn('dashboard-stat flex gap-3 !p-3', isDark ? 'dark' : 'light')}
              >
                <Icon size={15} className="mt-0.5 shrink-0 text-jyotish-gold/80" aria-hidden="true" />
                <div>
                  <p className={cn('text-sm font-medium', isDark ? 'text-white/85' : 'text-ink-primary')}>{label}</p>
                  <p className={cn('mt-0.5 text-[11px] leading-4', isDark ? 'text-white/35' : 'text-ink-faint')}>{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:items-start lg:min-w-[220px] lg:items-stretch">
          <Link
            to="/career"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-jyotish-gold px-6 text-sm font-semibold text-[#1a0b2e] shadow-[0_0_24px_rgba(212,175,55,0.22)] transition hover:bg-celestial-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/60"
          >
            Calculate free career snapshot
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p className={cn('text-center text-[11px] leading-5 lg:text-left', isDark ? 'text-white/30' : 'text-ink-faint')}>
            Instant results · unique share link · optional full report with signup
          </p>
        </div>
      </div>
    </section>
  );
};
