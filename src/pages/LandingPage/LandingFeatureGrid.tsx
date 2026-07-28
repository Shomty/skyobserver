import React from 'react';
import { motion } from 'motion/react';
import { ChartNoAxesCombined, Clock3, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

interface FeatureGroup {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  desc: string;
  features: string[];
}

const featureGroups: FeatureGroup[] = [
  {
    icon: ChartNoAxesCombined,
    eyebrow: 'Identity',
    title: 'A complete view of who you are',
    desc: 'Move from the whole personality map to the exact trait, need, or tendency without losing context.',
    features: ['Personality wheel', 'Life-area breakdowns', 'Inner vs outer self', 'Strengths & blind spots'],
  },
  {
    icon: Clock3,
    eyebrow: 'Timing',
    title: 'Understand what is active now',
    desc: 'Read life in chapters — from today’s emotional weather to the long arcs that shape your story.',
    features: ['Daily mood ledger', 'Life chapter timeline', 'Current influences', 'Best timing windows'],
  },
  {
    icon: Sparkles,
    eyebrow: 'Insight',
    title: 'Reflection with evidence attached',
    desc: 'See the patterns behind an interpretation, then ask a focused question in plain language.',
    features: ['Pattern recognition', 'Strength mapping', 'AI reflection & chat', 'Saved personal archive'],
  },
];

export const LandingFeatureGrid: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section id="inside" className={cn('landing-section-features relative z-10 px-5 py-20 md:px-8 md:py-24', isDark ? 'dark' : 'light')}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid gap-5 md:grid-cols-[0.65fr_1fr] md:items-end">
          <div>
            <p className="landing-kicker mb-4">What you get</p>
            <h2 className={cn('max-w-xl font-serif text-5xl font-medium italic leading-[0.95] md:text-6xl', isDark ? 'text-[#ede8f5]' : 'text-ink-primary')}>
              One life. Three lenses to read it.
            </h2>
          </div>
          <p className={cn('max-w-xl text-base leading-7 md:justify-self-end', isDark ? 'text-white/60' : 'text-ink-secondary')}>
            Soul Blueprint keeps identity, timing, and reflection connected — so every insight
            can be traced back to the pattern it came from.
          </p>
        </div>

        <div className={cn(
          'grid grid-cols-1 gap-px overflow-hidden rounded-2xl border lg:grid-cols-3',
          isDark ? 'border-cosmic-accent/15 bg-cosmic-accent/8' : 'border-border-gold bg-jyotish-gold/5'
        )}>
          {featureGroups.map((group, i) => {
            const Icon = group.icon;
            return (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'dashboard-panel !rounded-none border-0 p-7 md:p-9',
                  isDark ? 'dark bg-[#0b0711]/95' : 'light'
                )}
              >
                <div className="mb-10 flex items-center justify-between">
                  <span className="landing-kicker">{group.eyebrow}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-jyotish-gold/25 bg-jyotish-gold/10">
                    <Icon className="h-4 w-4 text-jyotish-gold" />
                  </span>
                </div>
                <h3 className={cn('max-w-sm font-serif text-3xl font-medium italic leading-tight', isDark ? 'text-white' : 'text-ink-primary')}>{group.title}</h3>
                <p className={cn('mt-4 min-h-14 text-sm leading-6', isDark ? 'text-white/55' : 'text-ink-muted')}>{group.desc}</p>
                <ul className={cn('mt-8 border-t pt-5', isDark ? 'border-white/10' : 'border-border-gold')}>
                  {group.features.map(feature => (
                    <li key={feature} className={cn('flex items-center gap-3 border-b py-3 text-sm last:border-0', isDark ? 'border-white/[0.06] text-white/72' : 'border-border-gold text-ink-secondary')}>
                      <span className="h-1.5 w-1.5 rounded-sm bg-jyotish-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
