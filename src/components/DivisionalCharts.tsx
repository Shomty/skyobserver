import React, { useMemo } from 'react';
import { PlanetPosition } from '../vedic-utils';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import {
  DIVISIONAL_CHART_TYPES,
  DIVISIONAL_CHART_INFO,
  DivisionalChartType,
  computeDivisionalChart,
} from '../lib/divisionalChartUtils';
import NorthIndianChart from './NorthIndianChart';

interface DivisionalChartsProps {
  birthPositions: PlanetPosition[];
}

const DivisionalCharts: React.FC<DivisionalChartsProps> = ({ birthPositions }) => {
  const { theme } = useTheme();
  const [selected, setSelected] = React.useState<DivisionalChartType>('D1');
  const [selectedPlanet, setSelectedPlanet] = React.useState<string | null>(null);

  const divisionalPositions = useMemo(
    () => computeDivisionalChart(birthPositions, selected),
    [birthPositions, selected],
  );

  const info = DIVISIONAL_CHART_INFO[selected];

  return (
    <div className="flex flex-col gap-4">
      {/* Header + Dropdown */}
      <div className={cn(
        'px-5 pt-5 pb-4 rounded-3xl border',
        theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm',
      )}>
        <div className={cn(
          'text-[10px] uppercase tracking-widest font-mono mb-3 flex items-center gap-2',
          theme === 'dark' ? 'text-jyotish-gold/60' : 'text-slate-400',
        )}>
          ◈ Divisional Charts (Vargas)
        </div>

        {/* Dropdown selector */}
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as DivisionalChartType)}
          className={cn(
            'w-full px-4 py-3 rounded-2xl border text-sm font-mono font-semibold appearance-none cursor-pointer outline-none transition-all focus:ring-2 focus:ring-jyotish-gold/40',
            theme === 'dark'
              ? 'bg-black/40 border-white/10 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-900',
          )}
        >
          {DIVISIONAL_CHART_TYPES.map((ct) => {
            const i = DIVISIONAL_CHART_INFO[ct];
            return (
              <option key={ct} value={ct}>
                {ct} — {i.name}{ct === 'D9' ? ' ★' : ''}
              </option>
            );
          })}
        </select>

        {/* Chart description */}
        <div className="mt-3">
          <div className={cn(
            'text-base font-semibold leading-tight',
            theme === 'dark' ? 'text-white' : 'text-slate-900',
          )}>
            {info.name}
            {selected === 'D9' && (
              <span className="ml-2 text-xs font-bold text-jyotish-gold">Most Important</span>
            )}
          </div>
          <div className={cn(
            'text-xs mt-1 leading-relaxed',
            theme === 'dark' ? 'text-white/50' : 'text-slate-500',
          )}>
            {info.purpose}
          </div>
        </div>
      </div>

      {/* North Indian Chart — full width like Sky Map */}
      <div className={cn(
        'rounded-3xl border overflow-hidden',
        theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm',
      )}>
        <div className="aspect-square w-full">
          <NorthIndianChart
            positions={divisionalPositions}
            isBirthMode={true}
            showHover={true}
            selectedPlanet={selectedPlanet}
            setSelectedPlanet={setSelectedPlanet}
          />
        </div>
      </div>

      {/* Planet positions grid */}
      <div className={cn(
        'px-4 py-4 rounded-3xl border',
        theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm',
      )}>
        <div className={cn(
          'text-[10px] uppercase tracking-widest font-mono mb-3',
          theme === 'dark' ? 'text-jyotish-gold/60' : 'text-slate-400',
        )}>
          Planetary Positions — {selected}
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {divisionalPositions
            .filter(p => p.name !== 'Ascendant')
            .map(p => (
              <button
                key={p.name}
                onClick={() => setSelectedPlanet(selectedPlanet === p.name ? null : p.name)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-left transition-colors',
                  selectedPlanet === p.name
                    ? theme === 'dark' ? 'bg-jyotish-gold/20 ring-1 ring-jyotish-gold/40' : 'bg-orange-50 ring-1 ring-orange-300'
                    : theme === 'dark' ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-slate-50 hover:bg-slate-100',
                  theme === 'dark' ? 'text-white/60' : 'text-slate-500',
                )}
              >
                <span className="font-bold text-xs shrink-0" style={{ color: p.color }}>{p.symbol}</span>
                <span className={cn('font-medium truncate', theme === 'dark' ? 'text-white/80' : 'text-slate-700')}>
                  {p.name}
                </span>
                <span className="ml-auto opacity-70 shrink-0">{p.rashi.slice(0, 3)}</span>
                {p.isRetrograde && (
                  <span className="text-[9px] text-jyotish-gold font-bold">R</span>
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DivisionalCharts;
