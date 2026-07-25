import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, Orbit } from 'lucide-react';
import { CelestialBackground } from '../../components/CelestialBackground';

interface LandingHeroProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  children?: React.ReactNode;
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const utc = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;

  return (
    <p className="font-mono text-[10px] text-white/50 tracking-[0.22em] uppercase tabular">
      Live cosmos · UTC {utc}
    </p>
  );
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenAuth, children }) => {
  return (
    <section id="top" className="relative min-h-screen overflow-hidden px-5 pb-20 pt-32 md:px-8 md:pt-40">
      <CelestialBackground />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-cosmic-accent/30 bg-cosmic-accent/10">
              <Orbit className="h-4 w-4 text-cosmic-accent" />
            </span>
            <div>
              <p className="landing-kicker">Your personal pattern studio</p>
              <LiveClock />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.75, ease: 'easeOut' }}
            className="max-w-3xl font-serif text-[clamp(4rem,9vw,7.7rem)] font-medium italic leading-[0.82] tracking-[-0.045em] text-[#ede8f5]"
          >
            See the pattern behind your time.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-8 max-w-xl text-base leading-7 text-white/65 md:text-lg"
          >
            Map your personality blueprint, life chapters, and daily emotional weather
            in one calm, precise workspace — grounded in psychology and real astronomy.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <button onClick={() => onOpenAuth('signup')} className="landing-btn-primary group inline-flex items-center justify-center gap-3">
              Create your profile
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </button>
            <button onClick={() => onOpenAuth('signin')} className="landing-btn-secondary">
              I already have an account
            </button>
          </motion.div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
            <span>Precision astronomy</span>
            <span>Private by default</span>
            <span>Reflective AI guidance</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, rotate: 1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.22, duration: 0.8 }}
          className="relative"
        >
          <div className="pointer-events-none absolute -inset-16 rounded-full bg-cosmic-accent/10 blur-3xl" />
          {children}
        </motion.div>
      </div>
    </section>
  );
};
