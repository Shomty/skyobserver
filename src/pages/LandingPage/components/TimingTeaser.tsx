import React from 'react';
import { Check, Clock3, Sunrise, Timer } from 'lucide-react';

const LIFE_CHAPTERS = [
  { theme: 'Connection', dates: '2018–2038', width: 'w-[46%]', active: true },
  { theme: 'Identity', dates: '2038–2044', width: 'w-[20%]', active: false },
  { theme: 'Emotion', dates: '2044–2054', width: 'w-[34%]', active: false },
];

const TIMING_WINDOWS = [
  { time: '06:14–07:02', label: 'Quiet focus window', score: 'Excellent' },
  { time: '10:38–11:26', label: 'Momentum window', score: 'Supportive' },
  { time: '16:42–17:31', label: 'Renewal window', score: 'Excellent' },
];

export const TimingTeaser: React.FC = () => (
  <section aria-labelledby="timing-title" className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
    <article className="dashboard-panel p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="landing-kicker">Panel · life chapters</p>
          <h2 id="timing-title" className="mt-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
            Long chapters. <span className="italic text-cosmic-accent">Small openings.</span>
          </h2>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
          <Timer size={16} className="text-jyotish-gold" aria-hidden="true" />
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Sample life chapter</p>
          <h3 className="mt-1 font-serif text-xl text-white">The connection chapter</h3>
        </div>
        <span className="rounded-md border border-jyotish-gold/30 bg-jyotish-gold/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-jyotish-gold">
          sample
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-full bg-white/[0.04]" aria-label="Sample life chapter timeline">
        <div className="flex h-2.5">
          {LIFE_CHAPTERS.map((segment) => (
            <div
              key={segment.theme}
              className={`${segment.width} ${segment.active ? 'bg-jyotish-gold' : 'border-l border-slate-950 bg-white/15'}`}
              title={`${segment.theme}, ${segment.dates}`}
            />
          ))}
        </div>
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2">
        {LIFE_CHAPTERS.map((segment) => (
          <li key={segment.theme} className="dashboard-stat !p-3">
            <p className={`font-serif text-base ${segment.active ? 'text-jyotish-gold' : 'text-white/55'}`}>{segment.theme}</p>
            <p className="font-mono text-[9px] tracking-wider text-white/25">{segment.dates}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
        {[
          { label: 'Main chapter', value: 'Connection' },
          { label: 'Current sub-chapter', value: 'Structure' },
          { label: 'Psychological theme', value: 'Refining commitments' },
        ].map((item) => (
          <div key={item.label} className="dashboard-stat !p-3">
            <p className="dashboard-stat-label !text-[8px]">{item.label}</p>
            <p className="mt-1 text-sm text-white/80">{item.value}</p>
          </div>
        ))}
      </div>
    </article>

    <article className="dashboard-panel border-cosmic-accent/15 bg-[linear-gradient(160deg,rgba(157,124,255,0.08),rgba(10,6,18,0.95))] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="landing-kicker">Panel · timing windows</p>
          <h3 className="mt-2 font-serif text-2xl text-white">Best timing windows</h3>
        </div>
        <Sunrise className="text-jyotish-gold" size={24} aria-hidden="true" />
      </div>

      <ol className="mt-6 space-y-2">
        {TIMING_WINDOWS.map((window) => (
          <li key={window.time} className="dashboard-stat grid grid-cols-[auto_1fr_auto] items-center gap-3 !p-3">
            <Clock3 size={14} className="text-jyotish-gold/60" aria-hidden="true" />
            <div>
              <p className="font-mono text-[10px] text-jyotish-gold">{window.time}</p>
              <p className="mt-0.5 text-xs text-white/55">{window.label}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] uppercase tracking-wider text-emerald-300/80">
              <Check size={11} aria-hidden="true" />
              {window.score}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-[10px] leading-5 text-white/30">
        Static sample windows. Real recommendations depend on date, place, purpose, and your full context.
      </p>
    </article>
  </section>
);
