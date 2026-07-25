import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

const OBSERVATIONS = [
  'Emotional steadiness',
  'Compassionate growth',
  'Private intensity',
];

export const SampleAIInterpretation: React.FC = () => (
  <section aria-labelledby="interpretation-title" className="px-5 py-20 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(125deg,rgba(157,124,255,0.1),rgba(2,6,23,0.72)_42%)] p-7 sm:p-10 lg:p-14">
        <div aria-hidden="true" className="absolute right-0 top-0 font-serif text-[14rem] leading-none text-white/[0.025]">“</div>
        <div className="relative grid gap-10 lg:grid-cols-[0.55fr_1fr]">
          <header>
            <span className="inline-flex items-center gap-2 rounded-full border border-cosmic-accent/30 bg-cosmic-accent/[0.08] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-cosmic-accent">
              <Sparkles size={12} aria-hidden="true" />
              Static sample · reflective guidance
            </span>
            <h2 id="interpretation-title" className="mt-5 font-serif text-4xl font-semibold leading-none text-white">
              From pattern
              <span className="block italic text-cosmic-accent">to perspective.</span>
            </h2>
            <p className="mt-5 text-sm leading-6 text-white/40">
              An example of the reflective voice. No AI request is made in this preview.
            </p>
          </header>

          <figure className="border-l border-cosmic-accent/30 pl-6 sm:pl-9">
            <blockquote className="font-serif text-2xl leading-relaxed text-white/85 sm:text-3xl">
              “Your pattern pairs emotional steadiness with unusual depth. The need for calm and tangible reassurance sits beside a private, perceptive edge. Growth becomes most powerful when insight is used with compassion — not as judgment, but as self-understanding.”
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-3 text-xs text-white/35">
              <BookOpen size={15} className="text-cosmic-accent/70" aria-hidden="true" />
              Illustrative reflection, not a personal reading
            </figcaption>
          </figure>
        </div>

        <ul className="relative mt-10 flex flex-wrap gap-2 border-t border-white/10 pt-6" aria-label="Sample profile observations">
          {OBSERVATIONS.map((observation) => (
            <li key={observation} className="rounded-full bg-white/[0.04] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
              {observation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);
