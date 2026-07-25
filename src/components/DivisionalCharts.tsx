import React, { useMemo, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Loader2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { PlanetPosition, NAKSHATRA_DATA } from '../vedic-utils';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import {
  DIVISIONAL_CHART_TYPES,
  DIVISIONAL_CHART_INFO,
  DivisionalChartType,
  computeDivisionalChart,
} from '../lib/divisionalChartUtils';
import NorthIndianChart from './NorthIndianChart';
import { getPerAccountReport, savePerAccountReport } from '../services/aiReportService';
import {
  generateDivisionalNakshatraInterpretations,
  DivisionalNakshatraInterpretations,
} from '../services/geminiService';

interface DivisionalChartsProps {
  birthPositions: PlanetPosition[];
  user?: any;
  userProfile?: any;
  birthFingerprint?: string | null;
  /** Initial chart when unlocked. Defaults to D9 (Vargas page). */
  initialChart?: DivisionalChartType;
  /** When set, locks to this chart and hides the Vargas selector. */
  lockedChart?: DivisionalChartType;
  /** Sticky short link at the bottom of the viewport (e.g. Kundli → Vargas). */
  footerLink?: { label: string; onClick: () => void };
}

const DivisionalCharts: React.FC<DivisionalChartsProps> = ({
  birthPositions,
  user,
  userProfile,
  birthFingerprint,
  initialChart = 'D9',
  lockedChart,
  footerLink,
}) => {
  const { theme } = useTheme();
  const [selected, setSelected] = React.useState<DivisionalChartType>(
    lockedChart ?? initialChart,
  );
  const [selectedPlanet, setSelectedPlanet] = React.useState<string | null>(null);
  const isLocked = !!lockedChart;

  // AI state
  const [aiData, setAiData] = React.useState<DivisionalNakshatraInterpretations | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiOutdated, setAiOutdated] = React.useState(false);
  const [aiExpanded, setAiExpanded] = React.useState(true);

  const divisionalPositions = useMemo(
    () => computeDivisionalChart(birthPositions, selected),
    [birthPositions, selected],
  );

  const info = DIVISIONAL_CHART_INFO[selected];
  const cacheDocId = `divisional-nakshatra-${selected}`;

  // Reset and reload from cache when chart type or birth fingerprint changes
  useEffect(() => {
    setAiData(null);
    setAiError(null);
    setAiOutdated(false);

    if (!user?.uid || !birthFingerprint) return;

    (async () => {
      const cached = await getPerAccountReport(user.uid, cacheDocId);
      if (!cached) return;
      if (cached.fingerprint === birthFingerprint) {
        setAiData(cached.data as DivisionalNakshatraInterpretations);
      } else {
        setAiOutdated(true);
      }
    })();
  }, [selected, birthFingerprint, user?.uid, cacheDocId]);

  const handleGenerateAI = useCallback(async () => {
    if (!user?.uid || !birthFingerprint) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiOutdated(false);
    try {
      const profile = {
        firstName: userProfile?.firstName,
        gender: userProfile?.gender,
      };
      const result = await generateDivisionalNakshatraInterpretations(
        selected,
        info,
        divisionalPositions,
        profile,
      );
      // Persist permanently — no TTL, one API call ever per chart per birth details
      await savePerAccountReport(user.uid, cacheDocId, result, birthFingerprint);
      setAiData(result);
    } catch (err: any) {
      setAiError(err?.message ?? 'Failed to generate interpretation.');
    } finally {
      setIsAiLoading(false);
    }
  }, [user?.uid, birthFingerprint, selected, info, divisionalPositions, userProfile, cacheDocId]);

  const isDark = theme === 'dark';
  const cardBase = cn(
    'px-5 pt-5 pb-4 rounded-3xl border',
    isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm',
  );

  const selectedPosition = divisionalPositions.find(p => p.name === selectedPlanet);
  const selectedNakData = selectedPosition
    ? NAKSHATRA_DATA[selectedPosition.nakshatra as keyof typeof NAKSHATRA_DATA]
    : null;

  return (
    <div className={cn('flex flex-col gap-4', footerLink && 'pb-14')}>
      {/* Header + Dropdown (selector hidden when locked) */}
      <div className={cardBase}>
        <div className={cn(
          'text-[10px] uppercase tracking-widest font-mono mb-3 flex items-center gap-2',
          isDark ? 'text-jyotish-gold/60' : 'text-slate-400',
        )}>
          {isLocked ? `◈ ${selected} — ${info.name}` : '◈ Divisional Charts (Vargas)'}
        </div>

        {!isLocked && (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as DivisionalChartType)}
            className={cn(
              'w-full px-4 py-3 rounded-2xl border text-sm font-mono font-semibold appearance-none cursor-pointer outline-none transition-all focus:ring-2 focus:ring-jyotish-gold/40',
              isDark
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
        )}

        <div className={cn(!isLocked && 'mt-3')}>
          <div className={cn(
            'text-base font-semibold leading-tight',
            isDark ? 'text-white' : 'text-slate-900',
          )}>
            {info.name}
            {selected === 'D9' && (
              <span className="ml-2 text-xs font-bold text-jyotish-gold">Most Important</span>
            )}
          </div>
          <div className={cn(
            'text-xs mt-1 leading-relaxed',
            isDark ? 'text-white/50' : 'text-slate-500',
          )}>
            {info.purpose}
          </div>
        </div>
      </div>

      {/* North Indian Chart */}
      <div className={cn(
        'rounded-3xl border overflow-hidden',
        isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm',
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

      {/* Planet positions grid — nakshatra + pada included */}
      <div className={cn(
        'px-4 py-4 rounded-3xl border',
        isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm',
      )}>
        <div className={cn(
          'text-[10px] uppercase tracking-widest font-mono mb-3',
          isDark ? 'text-jyotish-gold/60' : 'text-slate-400',
        )}>
          Planetary Positions — {selected}
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[13px]">
          {divisionalPositions
            .filter(p => p.name !== 'Ascendant')
            .map(p => (
              <button
                key={p.name}
                onClick={() => setSelectedPlanet(selectedPlanet === p.name ? null : p.name)}
                className={cn(
                  'flex items-start gap-2 px-3 py-2 rounded-xl text-left transition-colors',
                  selectedPlanet === p.name
                    ? isDark ? 'bg-jyotish-gold/20 ring-1 ring-jyotish-gold/40' : 'bg-orange-50 ring-1 ring-orange-300'
                    : isDark ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-slate-50 hover:bg-slate-100',
                  isDark ? 'text-white/60' : 'text-slate-500',
                )}
              >
                <span className="font-bold text-xs shrink-0 mt-0.5" style={{ color: p.color }}>
                  {p.symbol}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('font-medium truncate', isDark ? 'text-white/80' : 'text-slate-700')}>
                      {p.name}
                    </span>
                    {p.isRetrograde && (
                      <span className="text-[9px] text-jyotish-gold font-bold">R</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="opacity-70">{p.rashi.slice(0, 3)}</span>
                    <span className={cn('text-[9px]', isDark ? 'text-jyotish-gold/50' : 'text-orange-400')}>
                      · {p.nakshatra} P{p.pada}
                    </span>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Nakshatra Detail panel for selected planet */}
      {selectedPosition && selectedNakData && (
        <div className={cn(
          'px-5 py-4 rounded-3xl border',
          isDark ? 'bg-jyotish-gold/5 border-jyotish-gold/20' : 'bg-orange-50 border-orange-200',
        )}>
          <div className={cn(
            'text-[10px] uppercase tracking-widest font-mono mb-3 flex items-center gap-2',
            isDark ? 'text-jyotish-gold/60' : 'text-orange-500',
          )}>
            <Star className="w-3 h-3" /> Nakshatra Detail
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5" style={{ color: selectedPosition.color }}>
              {selectedPosition.symbol}
            </span>
            <div className="flex-1 min-w-0">
              <div className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                {selectedPosition.name}
                <span className={cn('ml-2 text-xs font-normal', isDark ? 'text-white/50' : 'text-slate-500')}>
                  in {selectedPosition.rashi}
                </span>
              </div>
              <div className={cn('text-sm font-semibold mt-1', isDark ? 'text-jyotish-gold' : 'text-orange-600')}>
                {selectedPosition.nakshatra}
                <span className={cn('ml-1.5 text-xs font-normal', isDark ? 'text-white/50' : 'text-slate-500')}>
                  Pada {selectedPosition.pada}
                </span>
              </div>
              <div className={cn('text-[13px] mt-2', isDark ? 'text-white/50' : 'text-slate-500')}>
                <span className="mr-3">
                  Lord: <span className={cn('font-medium', isDark ? 'text-white/70' : 'text-slate-700')}>{selectedNakData.lord}</span>
                </span>
                <span className="mr-3">
                  Deity: <span className={cn('font-medium', isDark ? 'text-white/70' : 'text-slate-700')}>{selectedNakData.deity}</span>
                </span>
                <span>
                  Symbol: <span className={cn('font-medium', isDark ? 'text-white/70' : 'text-slate-700')}>{selectedNakData.symbol}</span>
                </span>
              </div>
              <p className={cn('text-[13px] mt-2 italic leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                {selectedNakData.characteristics}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Nakshatra Interpretation section */}
      {user?.uid && birthFingerprint && (
        <div className={cn('rounded-3xl border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className={cn(
                'text-[10px] uppercase tracking-widest font-mono flex items-center gap-2',
                isDark ? 'text-jyotish-gold/60' : 'text-slate-400',
              )}>
                <Sparkles className="w-3 h-3" /> AI Nakshatra Reading — {selected}
              </div>
              {aiData && (
                <button
                  onClick={() => setAiExpanded(v => !v)}
                  className={cn('transition-colors', isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')}
                >
                  {aiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* No cache yet */}
            {!aiData && !isAiLoading && !aiOutdated && (
              <div className="mt-4 flex flex-col items-start gap-3">
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                  Generate a personalized reading of how each planet's Nakshatra shapes its expression
                  in the {info.name} chart. Saved permanently — one API call ever per chart.
                </p>
                <button
                  onClick={handleGenerateAI}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all',
                    isDark
                      ? 'bg-jyotish-gold/15 border border-jyotish-gold/30 text-jyotish-gold hover:bg-jyotish-gold/25'
                      : 'bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100',
                  )}
                >
                  <Sparkles className="w-3 h-3" /> Generate Reading
                </button>
              </div>
            )}

            {/* Outdated */}
            {aiOutdated && !isAiLoading && (
              <div className="mt-4 flex flex-col items-start gap-3">
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-amber-400/70' : 'text-amber-600')}>
                  ⚠ Birth details changed — previous reading is outdated.
                </p>
                <button
                  onClick={handleGenerateAI}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all',
                    isDark
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100',
                  )}
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate (uses API call)
                </button>
              </div>
            )}

            {/* Loading */}
            {isAiLoading && (
              <div className="mt-4 flex items-center gap-3">
                <Loader2 className={cn('w-4 h-4 animate-spin', isDark ? 'text-jyotish-gold' : 'text-orange-500')} />
                <span className={cn('text-xs', isDark ? 'text-white/40' : 'text-slate-500')}>
                  Generating Nakshatra reading…
                </span>
              </div>
            )}

            {/* Error */}
            {aiError && !isAiLoading && (
              <div className="mt-4 flex flex-col items-start gap-2">
                <p className={cn('text-xs', isDark ? 'text-red-400' : 'text-red-500')}>{aiError}</p>
                <button
                  onClick={handleGenerateAI}
                  className={cn(
                    'text-xs font-bold px-3 py-1.5 rounded-xl transition-all',
                    isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100',
                  )}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loaded — regenerate button */}
            {aiData && (
              <div className="mt-2 flex items-center justify-end">
                <button
                  onClick={handleGenerateAI}
                  title="Regenerate (uses an API call)"
                  disabled={isAiLoading}
                  className={cn(
                    'flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl transition-all',
                    isDark
                      ? 'text-white/20 hover:text-jyotish-gold/60 hover:bg-jyotish-gold/10'
                      : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50',
                  )}
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Regenerate
                </button>
              </div>
            )}
          </div>

          {/* AI content */}
          {aiData && aiExpanded && (
            <div className="px-5 pb-5 space-y-5">
              {/* Overview */}
              <div className={cn('p-4 rounded-2xl border', isDark ? 'bg-jyotish-gold/5 border-jyotish-gold/15' : 'bg-orange-50 border-orange-100')}>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-white/70' : 'text-slate-600')}>
                  {aiData.overview}
                </p>
              </div>

              {/* Planet × Nakshatra */}
              {Object.keys(aiData.planets).length > 0 && (
                <div>
                  <div className={cn('text-[9px] uppercase tracking-widest font-mono mb-3', isDark ? 'text-white/25' : 'text-slate-400')}>
                    Planet × Nakshatra
                  </div>
                  <div className="space-y-2.5">
                    {divisionalPositions
                      .filter(p => p.name !== 'Ascendant' && aiData.planets[p.name])
                      .map(p => (
                        <div key={p.name} className={cn('p-3.5 rounded-2xl border', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100')}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base leading-none" style={{ color: p.color }}>{p.symbol}</span>
                            <span className={cn('text-xs font-bold', isDark ? 'text-white/80' : 'text-slate-700')}>
                              {p.name}
                            </span>
                            <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-mono', isDark ? 'bg-jyotish-gold/10 text-jyotish-gold/70' : 'bg-orange-100 text-orange-500')}>
                              {p.nakshatra} P{p.pada}
                            </span>
                          </div>
                          <p className={cn('text-[13px] leading-relaxed', isDark ? 'text-white/55' : 'text-slate-600')}>
                            {aiData.planets[p.name]}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* House (Rasi) × Nakshatra */}
              {Object.keys(aiData.houses).length > 0 && (
                <div>
                  <div className={cn('text-[9px] uppercase tracking-widest font-mono mb-3', isDark ? 'text-white/25' : 'text-slate-400')}>
                    House (Rasi) × Nakshatra
                  </div>
                  <div className="space-y-2.5">
                    {Object.entries(aiData.houses).map(([rasi, text]) => (
                      <div key={rasi} className={cn('p-3.5 rounded-2xl border', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100')}>
                        <div className={cn('text-xs font-bold mb-2', isDark ? 'text-white/70' : 'text-slate-700')}>
                          {rasi}
                        </div>
                        <p className={cn('text-[13px] leading-relaxed', isDark ? 'text-white/55' : 'text-slate-600')}>
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {footerLink && (
        <div
          className={cn(
            'fixed left-0 right-0 z-40 flex justify-center pointer-events-none',
            'bottom-[calc(56px+env(safe-area-inset-bottom))] lg:bottom-4',
          )}
        >
          <button
            type="button"
            onClick={footerLink.onClick}
            className={cn(
              'pointer-events-auto text-xs font-medium underline underline-offset-4 decoration-jyotish-gold/50 hover:decoration-jyotish-gold transition-colors px-3 py-2',
              isDark ? 'text-jyotish-gold/80 hover:text-jyotish-gold' : 'text-orange-600/80 hover:text-orange-600',
            )}
          >
            {footerLink.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default DivisionalCharts;
