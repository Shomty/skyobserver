import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  desc: string;
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Create Your Chart',
    desc: 'Enter your birth date, time, and location. We calculate your sidereal positions using the Lahiri ayanamsa instantly.',
  },
  {
    number: '02',
    title: 'Explore the Sky',
    desc: 'Navigate the live sky map, birth chart, panchang, dasha timeline, and ashtakavarga — all in one place.',
  },
  {
    number: '03',
    title: 'Ask the AI',
    desc: "Chat with Gemini AI about your chart, transits, and yogas. Get personalized Jyotish insights on demand.",
  },
];

export const LandingHowItWorks: React.FC = () => {
  return (
    <section className="relative z-10 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-jyotish-gold/60 mb-3">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-serif italic font-bold gold-gradient-text">
            Three steps to cosmic clarity
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-0">
          {steps.map((step, i) => (
            <React.Fragment key={step.number}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' }}
                className="flex-1 flex flex-col gap-3 px-0 md:px-6 first:pl-0 last:pr-0"
              >
                <span className="text-6xl font-mono text-jyotish-gold/20 leading-none">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold text-white/90">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
              </motion.div>

              {/* Arrow connector between steps (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center self-center px-2 text-white/15">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
