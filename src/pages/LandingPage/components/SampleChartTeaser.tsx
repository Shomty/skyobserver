import React, { useState } from 'react';
import { CircleDot, Diamond } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

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
  isDark: boolean;
  onClick: () => void;
}> = ({ active, icon, label, isDark, onClick }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      'inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/70',
      active
        ? 'bg-jyotish-gold text-[#1a0b2e]'
        : isDark
          ? 'text-white/50 hover:bg-white/[0.05] hover:text-white focus-visible:text-white'
          : 'text-ink-muted hover:bg-surface-muted hover:text-ink-primary focus-visible:text-ink-primary',
    )}
  >
    {icon}
    {label}
  </button>
);

interface SampleChartTeaserProps {
  compact?: boolean;
}

export const SampleChartTeaser: React.FC<SampleChartTeaserProps> = ({ compact = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<ChartMode>('circular');
  const [selectedName, setSelectedName] = useState('Moon');
  const selected = SAMPLE_PLANETS.find((planet) => planet.name === selectedName) ?? SAMPLE_PLANETS[0];

  return (
    <section
      aria-labelledby="sample-chart-title"
      className={compact ? 'relative' : cn('relative overflow-hidden border-y px-5 py-20 sm:px-8', isDark ? 'border-white/10' : 'border-border-gold')}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(157,124,255,0.1),transparent_34%)]" />
      <div className={compact ? 'relative' : 'relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center'}>
        <header className={compact ? 'sr-only' : 'max-w-xl'}>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-jyotish-gold/70">Sample personality map</p>
          <h2 id="sample-chart-title" className={cn('font-serif text-4xl font-semibold leading-[0.95] sm:text-5xl', isDark ? 'text-white' : 'text-ink-primary')}>
            One inner world.
            <span className="block italic text-jyotish-gold">Two ways to explore it.</span>
          </h2>
          <p className={cn('mt-6 max-w-md text-sm leading-7', isDark ? 'text-white/50' : 'text-ink-muted')}>
            Switch between a circular view and a life-area grid. Tap any marker to see its emotional tone.
          </p>

          <dl aria-live="polite" className="mt-9 border-l-2 border-jyotish-gold/40 pl-5">
            <div className={cn('flex items-baseline justify-between gap-4 border-b pb-3', isDark ? 'border-white/10' : 'border-border-gold')}>
              <dt className={cn('font-serif text-2xl', isDark ? 'text-white' : 'text-ink-primary')}>{selected.symbol} {selected.name}</dt>
              <dd className="font-mono text-xs text-jyotish-gold">{selected.degree}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <dt className={cn('font-mono uppercase tracking-widest', isDark ? 'text-white/30' : 'text-ink-faint')}>Temperament</dt>
                <dd className={cn('mt-1', isDark ? 'text-white/80' : 'text-ink-primary')}>{selected.sign}</dd>
              </div>
              <div>
                <dt className={cn('font-mono uppercase tracking-widest', isDark ? 'text-white/30' : 'text-ink-faint')}>Inner pattern</dt>
                <dd className={cn('mt-1', isDark ? 'text-white/80' : 'text-ink-primary')}>{selected.innerPattern}</dd>
              </div>
            </div>
            <dd className={cn('text-sm italic leading-6', isDark ? 'text-white/55' : 'text-ink-secondary')}>{selected.note}</dd>
          </dl>
        </header>

        <div className={cn(
          compact ? 'landing-panel rounded-2xl p-3 backdrop-blur-md sm:p-6' : 'dashboard-panel p-3 sm:p-6',
          isDark ? 'dark' : 'light',
        )}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className={cn('inline-flex rounded-lg border p-1', isDark ? 'border-white/10 bg-black/20' : 'border-border-gold bg-surface-muted')} aria-label="Map view">
              <ToggleButton active={mode === 'circular'} isDark={isDark} icon={<CircleDot size={14} aria-hidden="true" />} label="Wheel" onClick={() => setMode('circular')} />
              <ToggleButton active={mode === 'north'} isDark={isDark} icon={<Diamond size={14} aria-hidden="true" />} label="Grid" onClick={() => setMode('north')} />
            </div>
            <p className={cn('font-mono text-[9px] uppercase tracking-[0.2em]', isDark ? 'text-white/25' : 'text-ink-faint')}>Illustrative sample</p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[31rem]" aria-label={`${mode === 'circular' ? 'Circular' : 'Grid'} sample personality map`}>
            {mode === 'circular' ? (
              <div className="absolute inset-[5%] rounded-full border border-jyotish-gold/35 bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.08)_0deg,rgba(255,255,255,0.08)_0.5deg,transparent_0.5deg,transparent_30deg)]">
                <div className={cn('absolute inset-[13%] rounded-full border', isDark ? 'border-white/15' : 'border-border-gold')} />
                <div className={cn('absolute inset-[31%] grid place-items-center rounded-full border border-jyotish-gold/25', isDark ? 'bg-slate-950' : 'bg-surface-muted')}>
                  <span className="text-center font-serif text-lg italic leading-tight text-jyotish-gold/80">Sample<br />profile</span>
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
                      className={cn(
                        'absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-serif text-lg transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold',
                        selectedName === planet.name
                          ? 'border-jyotish-gold bg-jyotish-gold text-[#1a0b2e]'
                          : isDark
                            ? 'border-white/15 bg-slate-950 text-white/75 hover:border-jyotish-gold/60 hover:text-jyotish-gold'
                            : 'border-border-gold bg-surface-card text-ink-secondary hover:border-jyotish-gold/60 hover:text-jyotish-gold',
                      )}
                    >
                      {planet.symbol}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-[7%]">
                <svg viewBox="0 0 100 100" role="presentation" className="h-full w-full text-jyotish-gold/40">
                  <rect x="1" y="1" width="98" height="98" fill={isDark ? 'rgba(2,6,23,.58)' : 'rgba(255,252,247,.92)'} stroke="currentColor" strokeWidth=".8" />
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
                    className={cn(
                      `absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-serif transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold ${HOUSE_POSITIONS[planet.house]}`,
                      selectedName === planet.name
                        ? 'border-jyotish-gold bg-jyotish-gold text-[#1a0b2e]'
                        : isDark
                          ? 'border-white/15 bg-slate-950 text-white/75 hover:border-jyotish-gold/60 hover:text-jyotish-gold'
                          : 'border-border-gold bg-surface-card text-ink-secondary hover:border-jyotish-gold/60 hover:text-jyotish-gold',
                    )}
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
