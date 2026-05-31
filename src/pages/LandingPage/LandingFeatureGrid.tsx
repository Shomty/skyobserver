import React from 'react';
import { motion } from 'motion/react';
import { Compass, LayoutGrid, Sparkles, CalendarDays, Activity, CircleDot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: Compass,
    title: 'Real-Time Sky Map',
    desc: 'Watch the planets move in sidereal space, updated live to your location.',
  },
  {
    icon: LayoutGrid,
    title: 'Birth Chart Engine',
    desc: 'North Indian & circular charts with nakshatra, pada, and dignity analysis.',
  },
  {
    icon: Sparkles,
    title: 'AI Interpretations',
    desc: 'Gemini-powered readings for every transit, yoga, and planetary conjunction.',
  },
  {
    icon: CalendarDays,
    title: 'Panchang & Muhurta',
    desc: 'Daily tithi, nakshatra, yoga, karana — auspicious timing for every act.',
  },
  {
    icon: Activity,
    title: 'Dasha Timeline',
    desc: 'Vimshottari dasha sequence mapped across your life events.',
  },
  {
    icon: CircleDot,
    title: 'Sudarshana Chakra',
    desc: 'Three-layer chakra wheel showing lagna, solar, and lunar perspectives.',
  },
];

export const LandingFeatureGrid: React.FC = () => {
  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-jyotish-gold/60 mb-3">
            What&apos;s Inside
          </p>
          <h2 className="text-3xl md:text-4xl font-serif italic font-bold gold-gradient-text">
            Precision Tools for the Modern Jyotishi
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
              >
                <Icon className="text-jyotish-gold w-8 h-8 mb-4" />
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
