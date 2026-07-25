import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';

interface LandingSignUpCTAProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingSignUpCTA: React.FC<LandingSignUpCTAProps> = ({ onOpenAuth }) => {
  return (
    <section className="relative z-10 px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] border border-cosmic-accent/25 bg-[linear-gradient(135deg,#2e1065_0%,#1a0b2e_45%,#0f051d_100%)] px-7 py-12 text-white md:px-14 md:py-16"
        >
          <div className="relative z-10 grid gap-9 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cosmic-glow/80">Your private reflection space</p>
              <h2 className="mt-4 max-w-3xl font-serif text-5xl font-medium italic leading-[0.92] md:text-7xl">
                Your pattern is not a verdict. It is a map.
              </h2>
              <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
                <LockKeyhole className="h-4 w-4" />
                New accounts require approval before full access.
              </div>
            </div>
            <div className="flex flex-col gap-3 md:min-w-56">
              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center justify-between rounded-full bg-cosmic-accent px-6 py-4 font-semibold text-white transition hover:bg-cosmic-glow hover:text-cosmic-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-bright"
              >
                Create account <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onOpenAuth('signin')}
                className="rounded-full border border-white/20 px-6 py-4 font-medium text-white/85 transition hover:border-cosmic-accent/50 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent"
              >
                Sign in
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-cosmic-accent/15" />
          <div className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-cosmic-accent/10" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(157,124,255,0.18),transparent_45%)]" />
        </motion.div>
      </div>
    </section>
  );
};
