import React from 'react';
import { BookOpen, MessageSquareText, Sparkles } from 'lucide-react';

const OBSERVATIONS = [
  'Emotional steadiness',
  'Compassionate growth',
  'Private intensity',
];

export const SampleAIInterpretation: React.FC = () => (
  <section aria-labelledby="interpretation-title" className="dashboard-panel">
    <div className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
      <div aria-hidden="true" className="absolute right-0 top-0 font-serif text-[14rem] leading-none text-white/[0.025]">"</div>
      <div className="relative grid gap-8 lg:grid-cols-[0.55fr_1fr]">
        <header>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-jyotish-gold/25 bg-jyotish-gold/10">
              <MessageSquareText size={16} className="text-jyotish-gold" aria-hidden="true" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-jyotish-gold/30 bg-jyotish-gold/[0.08] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-jyotish-gold">
              <Sparkles size={12} aria-hidden="true" />
              Panel · reflective guidance
            </span>
          </div>
          <h2 id="interpretation-title" className="mt-5 font-serif text-3xl font-semibold leading-none text-white sm:text-4xl">
            From pattern
            <span className="block italic text-cosmic-accent">to perspective.</span>
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/40">
            An example of the reflective voice. No AI request is made in this preview.
          </p>
        </header>

        <figure className="rounded-xl border border-cosmic-accent/12 bg-white/[0.02] p-5 sm:p-6 lg:border-l-4 lg:border-l-jyotish-gold/45">
          <blockquote className="font-serif text-xl leading-relaxed text-white/85 sm:text-2xl">
            "Your pattern pairs emotional steadiness with unusual depth. The need for calm and tangible reassurance sits beside a private, perceptive edge. Growth becomes most powerful when insight is used with compassion — not as judgment, but as self-understanding."
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3 text-xs text-white/35">
            <BookOpen size={15} className="text-jyotish-gold/70" aria-hidden="true" />
            Illustrative reflection, not a personal reading
          </figcaption>
        </figure>
      </div>

      <ul className="relative mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-5" aria-label="Sample profile observations">
        {OBSERVATIONS.map((observation) => (
          <li key={observation} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">
            {observation}
          </li>
        ))}
      </ul>
    </div>
  </section>
);
