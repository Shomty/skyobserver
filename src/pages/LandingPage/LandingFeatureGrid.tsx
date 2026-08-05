import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { FREE_REPORTS } from './lib/freeReportsConfig';

export const LandingFeatureGrid: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section id="inside" className={cn('landing-section-features relative z-10 px-5 py-20 md:px-8 md:py-24', isDark ? 'dark' : 'light')}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid gap-5 md:grid-cols-[0.65fr_1fr] md:items-end">
          <div>
            <p className="landing-kicker mb-4">Start here · free</p>
            <h2 className={cn('max-w-xl font-serif text-5xl font-medium italic leading-[0.95] md:text-6xl', isDark ? 'text-[#ede8f5]' : 'text-ink-primary')}>
              One life. Three lenses to read it.
            </h2>
          </div>
          <p className={cn('max-w-xl text-base leading-7 md:justify-self-end', isDark ? 'text-white/60' : 'text-ink-secondary')}>
            Career, daily energy, and personal blueprint — each a free instant report with a
            shareable link. No account required to start.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {FREE_REPORTS.map(({ id, icon: Icon, href, eyebrow, title, description, cta, highlights }, i) => (
            <motion.article
              key={id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
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

              <h3 className={cn('font-serif text-2xl font-medium italic leading-tight', isDark ? 'text-white' : 'text-ink-primary')}>
                {title}
              </h3>
              <p className={cn('mt-3 text-sm leading-6', isDark ? 'text-white/55' : 'text-ink-muted')}>
                {description}
              </p>

              <ul className={cn('mt-6 flex-1 border-t pt-5', isDark ? 'border-white/10' : 'border-border-gold')}>
                {highlights.map(({ label, detail }) => (
                  <li key={label} className={cn('border-b py-3 text-sm last:border-0', isDark ? 'border-white/[0.06]' : 'border-border-gold')}>
                    <p className={cn('font-medium', isDark ? 'text-white/85' : 'text-ink-primary')}>{label}</p>
                    <p className={cn('mt-0.5 text-[11px] leading-4', isDark ? 'text-white/35' : 'text-ink-faint')}>{detail}</p>
                  </li>
                ))}
              </ul>

              <Link
                to={href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-jyotish-gold transition hover:text-celestial-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
              >
                {cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
