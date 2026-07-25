import React, { useState } from 'react';
import { CircleDot, Diamond } from 'lucide-react';

type ChartMode = 'circular' | 'north';

interface SamplePlanet {
  name: string;
  symbol: string;
  sign: string;
  degree: string;
  innerPattern: string;
  note: string;
  angle: number;
  house: number;
}

const SAMPLE_PLANETS: SamplePlanet[] = [
  { name: 'Ascendant', symbol: 'As', sign: 'Scorpio', degree: '14° 08′', innerPattern: 'Depth · Intensity · Privacy', note: 'A private, perceptive way of meeting the world.', angle: 225, house: 1 },
  { name: 'Sun', symbol: '☉', sign: 'Leo', degree: '18° 42′', innerPattern: 'Warmth · Visibility · Pride', note: 'Creative authority seeks a visible, generous expression.', angle: 138, house: 10 },
  { name: 'Moon', symbol: '☽', sign: 'Taurus', degree: '06° 17′', innerPattern: 'Stability · Comfort · Senses', note: 'Emotional steadiness favors calm, tangible reassurance.', angle: 39, house: 7 },
  { name: 'Mars', symbol: '♂', sign: 'Virgo', degree: '24° 51′', innerPattern: 'Precision · Repair · Drive', note: 'Action becomes precise, corrective, and craft-oriented.', angle: 174, house: 11 },
  { name: 'Jupiter', symbol: '♃', sign: 'Pisces', degree: '11° 03′', innerPattern: 'Meaning · Compassion · Trust', note: 'Growth comes through empathy and a long emotional horizon.', angle: 342, house: 5 },
  { name: 'Saturn', symbol: '♄', sign: 'Aquarius', degree: '02° 29′', innerPattern: 'Structure · Distance · Commitment', note: 'Patient systems-building turns ideals into durable work.', angle: 303, house: 4 },
];

const HOUSE_POSITIONS: Record<number, string> = {
  1: 'left-[49%] top-[47%]',
  4: 'left-[24%] top-[47%]',
  5: 'left-[25%] top-[69%]',
  7: 'left-[49%] top-[72%]',
  10: 'left-[49%] top-[20%]',
  11: 'left-[72%] top-[22%]',
};

const ToggleButton: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors motion-reduce:transition-none ${
      active
        ? 'bg-cosmic-accent text-white'
        : 'text-white/50 hover:bg-white/[0.05] hover:text-white focus-visible:text-white'
    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent/70`}
  >
    {icon}
    {label}
  </button>
);

interface SampleChartTeaserProps {
  compact?: boolean;
}

export const SampleChartTeaser: React.FC<SampleChartTeaserProps> = ({ compact = false }) => {
  const [mode, setMode] = useState<ChartMode>('circular');
  const [selectedName, setSelectedName] = useState('Moon');
  const selected = SAMPLE_PLANETS.find((planet) => planet.name === selectedName) ?? SAMPLE_PLANETS[0];

  return (
    <section
      aria-labelledby="sample-chart-title"
      className={compact ? 'relative' : 'relative overflow-hidden border-y border-white/10 px-5 py-20 sm:px-8'}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(157,124,255,0.1),transparent_34%)]" />
      <div className={compact ? 'relative' : 'relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center'}>
        <header className={compact ? 'sr-only' : 'max-w-xl'}>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-cosmic-accent/70">Sample personality map</p>
          <h2 id="sample-chart-title" className="font-serif text-4xl font-semibold leading-[0.95] text-white sm:text-5xl">
            One inner world.
            <span className="block italic text-cosmic-accent">Two ways to explore it.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
            Switch between a circular view and a life-area grid. Tap any marker to see its emotional tone.
          </p>

          <dl aria-live="polite" className="mt-9 border-l border-cosmic-accent/40 pl-5">
            <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3">
              <dt className="font-serif text-2xl text-white">{selected.symbol} {selected.name}</dt>
              <dd className="font-mono text-xs text-cosmic-accent">{selected.degree}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <dt className="font-mono uppercase tracking-widest text-white/30">Temperament</dt>
                <dd className="mt-1 text-white/80">{selected.sign}</dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-widest text-white/30">Inner pattern</dt>
                <dd className="mt-1 text-white/80">{selected.innerPattern}</dd>
              </div>
            </div>
            <dd className="text-sm italic leading-6 text-white/55">{selected.note}</dd>
          </dl>
        </header>

        <div className={compact ? 'landing-panel rounded-[2rem] p-3 backdrop-blur-md sm:p-6' : 'rounded-[2rem] border border-white/10 bg-slate-950/65 p-3 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-6'}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1" aria-label="Map view">
              <ToggleButton active={mode === 'circular'} icon={<CircleDot size={14} aria-hidden="true" />} label="Wheel" onClick={() => setMode('circular')} />
              <ToggleButton active={mode === 'north'} icon={<Diamond size={14} aria-hidden="true" />} label="Grid" onClick={() => setMode('north')} />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Illustrative sample</p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[31rem]" aria-label={`${mode === 'circular' ? 'Circular' : 'Grid'} sample personality map`}>
            {mode === 'circular' ? (
              <div className="absolute inset-[5%] rounded-full border border-cosmic-accent/35 bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.08)_0deg,rgba(255,255,255,0.08)_0.5deg,transparent_0.5deg,transparent_30deg)]">
                <div className="absolute inset-[13%] rounded-full border border-white/15" />
                <div className="absolute inset-[31%] grid place-items-center rounded-full border border-cosmic-accent/25 bg-slate-950">
                  <span className="text-center font-serif text-lg italic leading-tight text-cosmic-accent/80">Sample<br />profile</span>
                </div>
                {SAMPLE_PLANETS.map((planet) => {
                  const radius = 39;
                  const left = 50 + radius * Math.cos((planet.angle * Math.PI) / 180);
                  const top = 50 + radius * Math.sin((planet.angle * Math.PI) / 180);
                  return (
                    <button
                      key={planet.name}
                      type="button"
                      aria-label={`Select ${planet.name} in ${planet.sign}`}
                      aria-pressed={selectedName === planet.name}
                      onClick={() => setSelectedName(planet.name)}
                      style={{ left: `${left}%`, top: `${top}%` }}
                      className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-serif text-lg transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent ${
                        selectedName === planet.name
                          ? 'border-cosmic-accent bg-cosmic-accent text-white'
                          : 'border-white/15 bg-slate-950 text-white/75 hover:border-cosmic-accent/60 hover:text-cosmic-accent'
                      }`}
                    >
                      {planet.symbol}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-[7%]">
                <svg viewBox="0 0 100 100" role="presentation" className="h-full w-full text-cosmic-accent/40">
                  <rect x="1" y="1" width="98" height="98" fill="rgba(2,6,23,.58)" stroke="currentColor" strokeWidth=".8" />
                  <path d="M1 1 99 99M99 1 1 99M1 50 50 1 99 50 50 99Z" fill="none" stroke="currentColor" strokeWidth=".55" />
                  <path d="M1 1 50 50 99 1M1 99 50 50 99 99" fill="none" stroke="currentColor" strokeWidth=".35" opacity=".45" />
                  {[1, 4, 5, 7, 10, 11].map((house, index) => (
                    <text key={house} x={[50, 22, 26, 50, 50, 76][index]} y={[43, 54, 78, 88, 17, 27][index]} textAnchor="middle" fill="currentColor" fontSize="3.2">
                      {house}
                    </text>
                  ))}
                </svg>
                {SAMPLE_PLANETS.map((planet) => (
                  <button
                    key={planet.name}
                    type="button"
                    aria-label={`Select ${planet.name} in life area ${planet.house}`}
                    aria-pressed={selectedName === planet.name}
                    onClick={() => setSelectedName(planet.name)}
                    className={`absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-serif transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent ${HOUSE_POSITIONS[planet.house]} ${
                      selectedName === planet.name
                        ? 'border-cosmic-accent bg-cosmic-accent text-white'
                        : 'border-white/15 bg-slate-950 text-white/75 hover:border-cosmic-accent/60 hover:text-cosmic-accent'
                    }`}
                  >
                    {planet.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
