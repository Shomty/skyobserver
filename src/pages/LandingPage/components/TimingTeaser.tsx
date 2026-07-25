import React from 'react';
import { Check, Clock3, Sunrise } from 'lucide-react';

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
  <section aria-labelledby="timing-title" className="px-5 py-20 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cosmic-accent/70">How time feels</p>
          <h2 id="timing-title" className="mt-3 font-serif text-4xl font-semibold text-white">
            Long chapters. <span className="italic text-cosmic-accent">Small openings.</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-white/45">
          See life-scale chapters beside the smaller windows when energy, focus, and timing align.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Sample life chapter</p>
              <h3 className="mt-2 font-serif text-2xl text-white">The connection chapter</h3>
            </div>
            <span className="rounded-full border border-cosmic-accent/25 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-cosmic-accent">
              sample
            </span>
          </div>

          <div className="mt-10 overflow-hidden rounded-full bg-white/[0.04]" aria-label="Sample life chapter timeline">
            <div className="flex h-3">
              {LIFE_CHAPTERS.map((segment) => (
                <div
                  key={segment.theme}
                  className={`${segment.width} ${segment.active ? 'bg-cosmic-accent' : 'border-l border-slate-950 bg-white/15'}`}
                  title={`${segment.theme}, ${segment.dates}`}
                />
              ))}
            </div>
          </div>
          <ol className="mt-4 grid grid-cols-3 gap-2">
            {LIFE_CHAPTERS.map((segment) => (
              <li key={segment.theme}>
                <p className={`font-serif text-lg ${segment.active ? 'text-cosmic-accent' : 'text-white/55'}`}>{segment.theme}</p>
                <p className="font-mono text-[9px] tracking-wider text-white/25">{segment.dates}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Main chapter</p>
              <p className="mt-2 text-sm text-white/80">Connection</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Current sub-chapter</p>
              <p className="mt-2 text-sm text-white/80">Structure</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Psychological theme</p>
              <p className="mt-2 text-sm text-white/80">Refining commitments</p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-cosmic-accent/20 bg-cosmic-accent/[0.06] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cosmic-accent/65">Illustrative day</p>
              <h3 className="mt-2 font-serif text-2xl text-white">Best timing windows</h3>
            </div>
            <Sunrise className="text-cosmic-accent" size={24} aria-hidden="true" />
          </div>

          <ol className="mt-7 space-y-3">
            {TIMING_WINDOWS.map((window) => (
              <li key={window.time} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-white/10 pt-3">
                <Clock3 size={14} className="text-white/30" aria-hidden="true" />
                <div>
                  <p className="font-mono text-[10px] text-cosmic-accent">{window.time}</p>
                  <p className="mt-1 text-xs text-white/55">{window.label}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-300/70">
                  <Check size={11} aria-hidden="true" />
                  {window.score}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-7 text-[10px] leading-5 text-white/30">
            Static sample windows. Real recommendations depend on date, place, purpose, and your full context.
          </p>
        </article>
      </div>
    </div>
  </section>
);
