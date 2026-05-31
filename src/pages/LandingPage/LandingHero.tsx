import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CelestialBackground } from '../../components/CelestialBackground';

interface LandingHeroProps {
  onSignIn: () => Promise<void>;
}

const HEADLINE_WORDS = ['The', 'Sky', 'Has', 'Always', 'Known'];

function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const utc = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;

  return (
    <p className="font-mono text-xs text-white/30 tracking-widest mt-3 uppercase">
      UTC {utc}
    </p>
  );
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn }) => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6">
      <CelestialBackground />

      <div className="relative z-10 flex flex-col items-center">
        {/* Headline — staggered word entrance */}
        <h1 className="text-5xl md:text-7xl font-serif italic font-bold leading-tight mb-2">
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
              className="gold-gradient-text inline-block mr-[0.25em] last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <LiveClock />

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-sm md:text-base font-mono text-white/50 uppercase tracking-widest mt-6 max-w-xl"
        >
          Real-time Sidereal Vedic astrology. AI-powered interpretations. Swiss Ephemeris precision.
        </motion.p>

        {/* Trust tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex items-center gap-3 mt-4 flex-wrap justify-center"
        >
          {['Lahiri Ayanamsa', 'Swiss Ephemeris', 'Gemini AI'].map((tag, i) => (
            <React.Fragment key={tag}>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-jyotish-gold/60">
                {tag}
              </span>
              {i < 2 && <span className="text-jyotish-gold/20 text-xs">·</span>}
            </React.Fragment>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex flex-col items-center gap-3 mt-10"
        >
          <button
            onClick={onSignIn}
            className="bg-jyotish-gold text-black rounded-2xl px-8 py-4 text-base font-semibold hover:bg-celestial-gold transition-colors shadow-lg shadow-jyotish-gold/20"
          >
            Begin Your Chart
          </button>
          <button
            onClick={onSignIn}
            className="text-white/40 text-xs hover:text-white/60 transition-colors underline underline-offset-2"
          >
            Already have an account? Sign in
          </button>
        </motion.div>
      </div>
    </section>
  );
};
