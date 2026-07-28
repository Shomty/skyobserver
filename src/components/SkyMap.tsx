import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ZoomIn, ZoomOut, RotateCcw, Eye, Home, Shield, Maximize2, Minimize2 } from 'lucide-react';
import { cn, getOrdinal } from '../lib/utils';
import NorthIndianChart from './NorthIndianChart';
import { DateTimePicker } from './DateTimePicker';
import { CircularSkyChart } from './charts/CircularSkyChart';
import { PlanetPosition, RASHIS, calculateDrishti, getDignityInterpretation, getRashiLord, HOUSE_DATA, getPlanetInHouseInterpretation, NAKSHATRA_DATA } from '../vedic-utils';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { NavId } from '../lib/navigation';

interface SkyMapProps {
  chartType: 'circle' | 'north-indian';
  setChartType: (type: 'circle' | 'north-indian') => void;
  activeTab?: NavId;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number, y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  selectedPlanet: string | null;
  setSelectedPlanet: (name: string | null) => void;
  hoveredPlanetName: string | null;
  setHoveredPlanetName: (name: string | null) => void;
  selectedZodiac: number | null;
  setSelectedZodiac: (idx: number | null) => void;
  positions: PlanetPosition[];
  comparisonPositions: PlanetPosition[] | null;
  isBirthMode: boolean;
  viewMode: 'transit' | 'natal';
  setViewMode: (mode: 'transit' | 'natal') => void;
  hoveredHouse: number | null;
  setHoveredHouse: (house: number | null) => void;
  location: { lat: number, lon: number } | null;
  mapOffset: number;
  birthTime: Date | null;
  setBirthTime: (date: Date | null) => void;
  birthCity: string;
  setBirthCity: (city: string) => void;
  birthLocation: { lat: number, lon: number } | null;
  saveBirthDetails: () => Promise<void>;
}

export const SkyMap: React.FC<SkyMapProps> = ({
  chartType,
  setChartType,
  activeTab = 'overview',
  zoom,
  setZoom,
  pan,
  setPan,
  selectedPlanet,
  setSelectedPlanet,
  hoveredPlanetName,
  setHoveredPlanetName,
  selectedZodiac,
  setSelectedZodiac,
  positions,
  comparisonPositions,
  isBirthMode,
  viewMode,
  setViewMode,
  hoveredHouse,
  setHoveredHouse,
  location,
  mapOffset,
  birthTime,
  setBirthTime,
  birthCity,
  setBirthCity,
  birthLocation,
  saveBirthDetails
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isSavingBirth, setIsSavingBirth] = React.useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = React.useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const selectedPlanetDrishti = React.useMemo(() => {
    if (!selectedPlanet) return null;
    return calculateDrishti(selectedPlanet, positions);
  }, [selectedPlanet, positions]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.min(Math.max(0.5, z - e.deltaY * 0.001), 3));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  return (
    <div
      ref={rootRef}
      className={cn(
      "flex flex-col relative border-b lg:border-r lg:border-b-0 w-full min-h-0 min-w-0 overflow-hidden transition-colors duration-500 lg:col-span-6",
      // Hide on mobile when Insights is active; always show on lg+ dual pane
      activeTab === 'stats' ? "hidden lg:flex" : "flex",
      // Mobile NI: claim the fold (header + bottom nav + floating pill)
      chartType === 'north-indian' &&
        "min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] lg:min-h-0",
      isFullscreen
        ? (theme === 'dark' ? "bg-mystic-purple" : "bg-white")
        : (theme === 'dark' ? "border-white/5 bg-black/40" : "border-slate-200 bg-white/40")
    )}>
      {/* Mobile Controls Bar — zoom/fullscreen only; chart type comes from bottom nav */}
      <div className={cn(
        "lg:hidden flex items-center justify-end px-4 py-2.5 border-b transition-colors duration-500 z-20",
        theme === 'dark' ? "bg-mystic-purple/80 border-white/5" : "bg-surface-card/80 border-border-gold"
      )}>
        <div className={cn(
          "flex items-center p-0.5 rounded-lg border",
          theme === 'dark' ? "bg-black/25 border-white/10" : "bg-slate-100 border-slate-200"
        )}>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
            className={cn(
              "p-1.5 rounded transition-colors",
              theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
            )}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
            className={cn(
              "p-1.5 rounded transition-colors",
              theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
            )}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className={cn(
              "p-1.5 rounded transition-colors",
              theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
            )}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className={cn(
              "p-1.5 rounded transition-colors",
              theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
            )}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Transit View Enhancement: Background Glow */}
      {viewMode === 'transit' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[100px]",
              theme === 'dark' ? "bg-blue-500/20" : "bg-blue-500/10"
            )}
            style={{ animation: 'transit-glow 10s linear infinite' }}
          />
        </div>
      )}
      {/* Unified Planet / House Info Bar — always rendered to avoid layout-shift flicker */}
      {(() => {
        const activeName = hoveredPlanetName || selectedPlanet;
        const planet = activeName
          ? [...positions, ...(comparisonPositions || [])].find(p => p.name === activeName)
          : null;

        const ascPos = positions.find(p => p.name === 'Ascendant');
        const startIdx = ascPos ? RASHIS.indexOf(ascPos.rashi) : 0;
        const houseRashi = hoveredHouse ? RASHIS[(startIdx + hoveredHouse - 1) % 12] : null;
        const houseLord = houseRashi ? getRashiLord(houseRashi) : null;

        return (
          <div className="hidden lg:block flex-shrink-0 px-3 pt-3 z-10">
            <div className={cn(
              "backdrop-blur-md border rounded-xl p-2 flex items-center justify-between pointer-events-auto min-h-[44px]",
              theme === 'dark' ? "bg-black/80 border-white/10" : "bg-surface-card/95 border-border-gold shadow-sm"
            )}>
              <AnimatePresence mode="wait">
                {planet ? (
                  <motion.div
                    key={`planet-${planet.name}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center justify-between w-full gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: planet.color, color: '#000' }}
                      >
                        {planet.symbol}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn("font-semibold text-sm leading-none truncate", theme === 'dark' ? "text-white" : "text-ink-primary")}>{planet.name}</span>
                        <span className={cn("text-[9px] uppercase tracking-widest font-mono mt-0.5", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>
                          {planet.rashi}{planet.house ? ` · House ${planet.house}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className={cn("font-mono text-xs", theme === 'dark' ? "text-white" : "text-ink-primary")}>{planet.degree}°{planet.minute}'</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {planet.dignity && (
                          <span className={cn(
                            "text-[8px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded",
                            planet.dignity === 'Exalted' ? "bg-green-500/20 text-green-400" :
                            planet.dignity === 'Debilitated' ? "bg-red-500/20 text-red-400" :
                            planet.dignity === 'Own Sign' ? "bg-blue-500/20 text-blue-400" :
                            theme === 'dark' ? "bg-white/10 text-white/60" : "bg-surface-muted text-ink-muted"
                          )}>
                            {planet.dignity}
                          </span>
                        )}
                        {planet.isRetrograde && <span className="text-[8px] text-orange-400 uppercase tracking-widest font-mono">℞</span>}
                        {planet.isCombust && <span className="text-[8px] text-red-400 uppercase tracking-widest font-mono flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />Combust</span>}
                      </div>
                    </div>
                  </motion.div>
                ) : hoveredHouse && houseRashi ? (
                  <motion.div
                    key={`house-${hoveredHouse}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex flex-col">
                      <span className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>{getOrdinal(hoveredHouse)} House</span>
                      <span className={cn("font-semibold text-sm", theme === 'dark' ? "text-white" : "text-ink-primary")}>{houseRashi}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>Lord</span>
                      <span className="text-jyotish-gold font-semibold text-sm">{houseLord}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center gap-2 w-full"
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex-shrink-0", theme === 'dark' ? "border border-white/10" : "border border-border-gold")} />
                    <span className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/25" : "text-ink-faint")}>
                      Tap a planet or house to inspect
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })()}

      <div className={cn(
        "relative w-full flex justify-center min-h-0",
        // Mobile NI: grow to fill the expanded SkyMap fold; keep chart centered & max-sized.
        chartType === 'north-indian'
          ? "flex-1 items-center p-2 lg:p-8"
          : "flex-1 items-center p-4 lg:p-8"
      )}>
        {/* View Mode Controls - Desktop Only */}
        <div className="hidden lg:flex absolute top-4 lg:top-8 left-4 lg:left-8 z-20 flex-col gap-3">
          <AnimatePresence>
            {viewMode === 'natal' && !birthTime && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "mt-2 p-4 rounded-2xl border backdrop-blur-xl w-64 shadow-2xl",
                  theme === 'dark' ? "bg-black/60 border-orange-500/20" : "bg-white/90 border-orange-500/20 shadow-orange-500/5"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <h3 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-ink-primary")}>Enter Birth Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <DateTimePicker
                      label="Date & time of birth"
                      placeholder="Select birth moment"
                      value={birthTime}
                      onChange={setBirthTime}
                      theme={theme}
                      maxDate={new Date()}
                      showNowButton={false}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>City of birth</label>
                    <input 
                      type="text" 
                      placeholder="City, Country"
                      className={cn(
                        "w-full bg-transparent border rounded-lg p-2 text-xs transition-colors",
                        theme === 'dark' ? "border-white/10 text-white focus:border-orange-500/50" : "border-slate-200 text-slate-800 focus:border-orange-500/50"
                      )}
                      value={birthCity}
                      onChange={(e) => setBirthCity(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      setIsSavingBirth(true);
                      await saveBirthDetails();
                      setIsSavingBirth(false);
                    }}
                    disabled={!birthTime || !birthCity || !birthLocation || isSavingBirth}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-xs transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isSavingBirth ? "Calculating..." : (!birthLocation && birthCity.length >= 3 ? "Locating..." : "Create Natal Chart")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden lg:flex absolute top-4 right-4 z-20 flex-wrap gap-2">
          {/* Zoom Controls */}
          <div className={cn(
            "flex backdrop-blur-md rounded-lg border p-1 mr-2 transition-colors duration-500",
            theme === 'dark' ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200 shadow-sm"
          )}>
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
              className={cn(
                "p-1.5 rounded transition-colors",
                theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              )}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
              className={cn(
                "p-1.5 rounded transition-colors",
                theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              )}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className={cn(
                "p-1.5 rounded transition-colors",
                theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              )}
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className={cn(
                "p-1.5 rounded transition-colors",
                theme === 'dark' ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              )}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setChartType('circle')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all border",
              chartType === 'circle' 
                ? "bg-orange-500 text-black border-orange-500 font-bold" 
                : theme === 'dark' ? "bg-white/5 text-white/40 border-white/10 hover:bg-white/10" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 shadow-sm"
            )}
          >
            Circle
          </button>
          <button 
            onClick={() => setChartType('north-indian')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all border",
              chartType === 'north-indian' 
                ? "bg-orange-500 text-black border-orange-500 font-bold" 
                : theme === 'dark' ? "bg-white/5 text-white/40 border-white/10 hover:bg-white/10" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 shadow-sm"
            )}
          >
            North Indian
          </button>
        </div>
        
        {/* Analysis Panel */}
        <AnimatePresence mode="wait">
          {(selectedPlanet || selectedZodiac !== null) && (
            <motion.div 
              key={selectedPlanet ? `planet-${selectedPlanet}` : `zodiac-${selectedZodiac}`}
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className={cn(
                "hidden lg:block absolute top-24 right-4 z-30 w-56 backdrop-blur-xl border rounded-2xl p-5 shadow-2xl",
                theme === 'dark' ? "bg-black/80 border-white/10" : "bg-surface-card/90 border-border-gold"
              )}
            >
              {selectedPlanet ? (
                /* Planet Analysis */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-orange-500" />
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-ink-primary")}>
                        {selectedPlanet}
                      </h4>
                    </div>
                    <button onClick={() => setSelectedPlanet(null)} className={theme === 'dark' ? "text-white/20 hover:text-white/60" : "text-ink-faint hover:text-ink-muted"}>×</button>
                  </div>

                  <div className="space-y-4">
                    {/* Nakshatra info */}
                    {(() => {
                      const planetObj = positions.find(p => p.name === selectedPlanet);
                      if (!planetObj) return null;
                      const nakData = NAKSHATRA_DATA[planetObj.nakshatra as keyof typeof NAKSHATRA_DATA];
                      return (
                        <div className={cn("p-2.5 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-surface-muted border-border-gold")}>
                          <div className={cn("text-[9px] uppercase tracking-widest font-bold mb-1.5", theme === 'dark' ? "text-jyotish-gold/50" : "text-jyotish-gold/80")}>
                            Nakshatra
                          </div>
                          <div className={cn("text-xs font-bold", theme === 'dark' ? "text-jyotish-gold" : "text-jyotish-gold")}>
                            {planetObj.nakshatra}
                            <span className={cn("ml-1.5 text-[10px] font-normal", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                              Pada {planetObj.pada}
                            </span>
                          </div>
                          {nakData && (
                            <>
                              <div className={cn("text-[10px] mt-1", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>
                                Lord: <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-ink-secondary")}>{nakData.lord}</span>
                                {" · "}Deity: <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-ink-secondary")}>{nakData.deity}</span>
                              </div>
                              <p className={cn("text-[9px] italic mt-1 leading-relaxed", theme === 'dark' ? "text-white/30" : "text-ink-faint")}>
                                {nakData.characteristics}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {(() => {
                      const planetObj = positions.find(p => p.name === selectedPlanet);
                      if (!planetObj || !planetObj.dignity) return null;
                      const interpretation = getDignityInterpretation(planetObj.name, planetObj.dignity, planetObj.rashi);
                      if (!interpretation) return null;
                      
                      return (
                        <div className={cn("p-2.5 rounded-xl border flex flex-col gap-2", 
                          interpretation.type === 'positive' ? "bg-emerald-500/5 border-emerald-500/20" : 
                          interpretation.type === 'negative' ? "bg-rose-500/5 border-rose-500/20" : 
                          "bg-white/5 border-white/10")}>
                          <div className="flex items-center gap-1.5">
                            <Sparkles className={cn("w-3 h-3", 
                              interpretation.type === 'positive' ? "text-emerald-500" : 
                              interpretation.type === 'negative' ? "text-rose-500" : 
                              "text-jyotish-gold")} />
                            <span className={cn("text-[10px] font-bold uppercase tracking-tight",
                              interpretation.type === 'positive' ? "text-emerald-400" : 
                              interpretation.type === 'negative' ? "text-rose-400" : 
                              "text-jyotish-gold")}>
                              {planetObj.dignity}
                            </span>
                          </div>
                          <p className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/60" : "text-ink-muted")}>
                            {interpretation.description}
                          </p>
                        </div>
                      );
                    })()}

                    {selectedPlanetDrishti && (
                      <>
                        {selectedPlanetDrishti.aspects.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[9px] uppercase tracking-widest text-orange-500/70 font-bold">Aspecting</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(selectedPlanetDrishti.aspects)).map(name => (
                                <div key={name} className={cn("px-2 py-0.5 rounded-full text-[9px] font-medium border", theme === 'dark' ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600")}>
                                  {name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPlanetDrishti.aspectedBy.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[9px] uppercase tracking-widest text-blue-500/70 font-bold">Aspected By</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(selectedPlanetDrishti.aspectedBy)).map(name => (
                                <div key={name} className={cn("px-2 py-0.5 rounded-full text-[9px] font-medium border", theme === 'dark' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600")}>
                                  {name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : selectedZodiac !== null ? (
                /* House Analysis */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-jyotish-gold" />
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-ink-primary")}>
                        {RASHIS[selectedZodiac]}
                      </h4>
                    </div>
                    <button onClick={() => setSelectedZodiac(null)} className={theme === 'dark' ? "text-white/20 hover:text-white/60" : "text-ink-faint hover:text-ink-muted"}>×</button>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const ascendant = positions.find(p => p.name === "Ascendant");
                      const ascRashiIdx = ascendant ? RASHIS.indexOf(ascendant.rashi) : 0;
                      const houseNum = ((selectedZodiac - ascRashiIdx + 12) % 12) + 1;
                      const rashiName = RASHIS[selectedZodiac];
                      const lord = getRashiLord(rashiName);
                      const planetsInSign = positions.filter(p => p.rashi === rashiName && p.name !== "Ascendant");
                      const houseInfo = HOUSE_DATA[houseNum];
                      
                      return (
                        <>
                          <div className={cn("p-2.5 rounded-xl border space-y-2", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-surface-muted border-border-gold")}>
                            <div className="flex items-center justify-between">
                              <span className={cn("text-[9px] uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>House</span>
                              <span className="text-[13px] font-bold text-jyotish-gold">{getOrdinal(houseNum)} House</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={cn("text-[9px] uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>Sign Lord</span>
                              <span className={cn("text-[13px] font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>{lord}</span>
                            </div>
                          </div>

                          {houseInfo && (
                            <div className="space-y-2.5 pt-1">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-widest text-jyotish-gold/60 font-bold">House Quality</span>
                                <p className={cn("text-[10px] leading-relaxed italic", theme === 'dark' ? "text-white/70" : "text-ink-secondary")}>{houseInfo.quality}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-widest text-emerald-500/60 font-bold">Growth Focus</span>
                                <p className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/60" : "text-ink-muted")}>{houseInfo.workOn}</p>
                              </div>
                            </div>
                          )}

                          <div className={cn("space-y-2.5 pt-1 border-t", theme === 'dark' ? "border-white/5" : "border-border-gold")}>
                            <div className={cn("text-[9px] uppercase tracking-widest font-bold", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>Occupants & Impacts</div>
                            {planetsInSign.length > 0 ? (
                              <div className="flex flex-col gap-2.5">
                                {planetsInSign.map(p => (
                                  <div key={p.name} className={cn("space-y-1.5 p-2 rounded-lg border", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-surface-muted border-border-gold")}>
                                    <div className="flex items-center justify-between">
                                      <span className={cn("text-[10px] font-bold", theme === 'dark' ? "text-white/90" : "text-ink-primary")}>{p.name}</span>
                                      <span className={cn("text-[9px] font-mono", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>{p.degree}°{p.minute}'</span>
                                    </div>
                                    <p className={cn("text-[9px] leading-tight italic border-l-2 border-jyotish-gold/30 pl-2", theme === 'dark' ? "text-white/50" : "text-ink-muted")}>
                                      {getPlanetInHouseInterpretation(p.name, houseNum)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={cn("text-[10px] italic", theme === 'dark' ? "text-white/20" : "text-ink-faint")}>No planets currently in {rashiName}</div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={containerRef}
          className={cn(
            "relative mx-auto flex items-center justify-center transition-all duration-500 aspect-square",
            chartType === 'north-indian'
              // Largest square that fits the expanded stage (width or stage height).
              ? "w-[min(100%,100vw)] max-h-full h-auto lg:max-w-[700px]"
              : "w-full max-w-[400px] lg:max-w-[700px]",
            chartType === 'circle' 
              ? cn("overflow-hidden rounded-full border transition-colors duration-500", theme === 'dark' ? "border-white/5 bg-black/20" : "border-slate-200 bg-white/40 shadow-inner")
              : "overflow-visible"
          )}
        >
          {chartType === 'circle' ? (
            <motion.div 
              className="relative w-full h-full cursor-grab active:cursor-grabbing"
              drag
              dragConstraints={containerRef}
              dragElastic={0.1}
              dragMomentum={false}
              animate={{ 
                scale: zoom,
                x: pan.x,
                y: pan.y
              }}
              onDragEnd={(_, info) => {
                setPan(prev => ({
                  x: prev.x + info.offset.x,
                  y: prev.y + info.offset.y
                }));
              }}
            >
              <CircularSkyChart
                positions={positions}
                mapOffset={mapOffset}
                selectedPlanet={selectedPlanet}
                onSelectPlanet={setSelectedPlanet}
                hoveredPlanetName={hoveredPlanetName}
                onHoverPlanet={setHoveredPlanetName}
                selectedZodiac={selectedZodiac}
                onSelectZodiac={setSelectedZodiac}
                selectedPlanetDrishti={selectedPlanetDrishti}
                comparisonPositions={comparisonPositions}
                isBirthMode={isBirthMode}
                viewMode={viewMode}
                showDrishti
              />
            </motion.div>
          ) : (
            <NorthIndianChart 
              positions={positions}
              comparisonPositions={comparisonPositions}
              viewMode={viewMode}
              isBirthMode={isBirthMode}
              selectedPlanet={selectedPlanet}
              setSelectedPlanet={setSelectedPlanet}
              selectedZodiac={selectedZodiac}
              setSelectedZodiac={setSelectedZodiac}
              hoveredPlanetName={hoveredPlanetName}
              setHoveredPlanetName={setHoveredPlanetName}
              hoveredHouse={hoveredHouse}
              setHoveredHouse={setHoveredHouse}
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
              className="w-full h-full max-w-full mx-auto"
            />
          )}
        </div>

        {/* Legend - Desktop Only */}
        <div className="hidden lg:flex absolute bottom-4 lg:bottom-8 left-4 lg:left-8 flex-col gap-2">
          <div className={cn("flex items-center gap-2 text-caption uppercase tracking-wide", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
            <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-blue-500" /> Earth ({location ? "Topocentric" : "Geocentric"} Center)
          </div>
          <div className={cn("flex items-center gap-2 text-caption uppercase tracking-wide", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
            <div className={cn("w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full border", theme === 'dark' ? "border-white/20" : "border-slate-300")} /> Ecliptic Path (Sidereal)
          </div>
        </div>
      </div>

      {/* Mobile Legend Bar — circle chart only (NI kundali is self-explanatory; saves vertical space) */}
      {chartType === 'circle' && (
      <div className={cn(
        "lg:hidden min-h-[28px] py-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 border-t border-b flex-shrink-0 transition-colors duration-500",
        theme === 'dark' ? "bg-black/35 border-white/5" : "bg-surface-muted border-border-gold"
      )}>
        <div className={cn("flex items-center gap-1.5 text-caption uppercase tracking-wide font-semibold", theme === 'dark' ? "text-white/45" : "text-ink-muted")}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Earth ({location ? "Topocentric" : "Geocentric"})
        </div>
        <div className={cn("flex items-center gap-1.5 text-caption uppercase tracking-wide font-semibold", theme === 'dark' ? "text-white/45" : "text-ink-muted")}>
          <div className={cn("w-1.5 h-1.5 rounded-full border", theme === 'dark' ? "border-white/20" : "border-slate-300")} />
          Ecliptic (Sidereal)
        </div>
      </div>
      )}

      {/* Mobile Birth Details Modal */}
      <AnimatePresence>
        {viewMode === 'natal' && !birthTime && (
          <div className="lg:hidden fixed inset-0 flex items-center justify-center p-4 z-40 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "p-5 rounded-3xl border w-full max-w-sm shadow-2xl",
                theme === 'dark' ? "bg-[#1a0b2e]/95 border-jyotish-gold/20 text-white" : "bg-white border-slate-200 text-slate-800"
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-jyotish-gold animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-widest font-mono">Enter Birth Details</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <DateTimePicker
                    label="Date & time of birth"
                    placeholder="Select birth moment"
                    value={birthTime}
                    onChange={setBirthTime}
                    theme={theme}
                    maxDate={new Date()}
                    showNowButton={false}
                  />
                </div>
                <div className="space-y-1">
                  <label className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>City of birth</label>
                  <input 
                    type="text" 
                    placeholder="City, Country"
                    className={cn(
                      "w-full bg-transparent border rounded-lg p-2.5 text-xs transition-colors",
                      theme === 'dark' ? "border-white/10 text-white focus:border-jyotish-gold/50" : "border-slate-200 text-slate-800 focus:border-jyotish-gold/50"
                    )}
                    value={birthCity}
                    onChange={(e) => setBirthCity(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setViewMode('transit')}
                    className={cn(
                      "flex-1 font-bold py-2.5 rounded-lg text-xs transition-all border",
                      theme === 'dark' ? "border-white/10 text-white/60 hover:text-white" : "border-slate-200 text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      setIsSavingBirth(true);
                      await saveBirthDetails();
                      setIsSavingBirth(false);
                    }}
                    disabled={!birthTime || !birthCity || !birthLocation || isSavingBirth}
                    className="flex-1 bg-jyotish-gold hover:bg-celestial-gold text-black font-bold py-2.5 rounded-lg text-xs transition-all shadow-lg shadow-jyotish-gold/20 disabled:opacity-50"
                  >
                    {isSavingBirth ? "Calculating..." : (!birthLocation && birthCity.length >= 3 ? "Locating..." : "Create Chart")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Analysis Bottom Sheet */}
      <AnimatePresence>
        {(selectedPlanet || selectedZodiac !== null) && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedPlanet(null);
                setSelectedZodiac(null);
                setIsSheetExpanded(false);
              }}
              className="lg:hidden fixed inset-0 bg-black z-40 pointer-events-auto"
            />
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, height: isSheetExpanded ? "88vh" : "55vh" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              className={cn(
                "lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t p-5 overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-2xl transition-colors duration-500 pointer-events-auto",
                theme === 'dark' ? "bg-mystic-purple/95 border-jyotish-gold/25 text-white" : "bg-white/95 border-slate-200 text-slate-800"
              )}
            >
              {/* Knob — tap to expand/collapse */}
              <button
                onClick={() => setIsSheetExpanded(e => !e)}
                className="flex flex-col items-center w-full mb-4 gap-1 py-1"
                aria-label={isSheetExpanded ? "Collapse details" : "Expand details"}
              >
                <div className={cn("w-12 h-1 rounded-full transition-colors", theme === 'dark' ? "bg-white/20" : "bg-slate-300")} />
                <span className={cn("text-[8px] uppercase tracking-widest font-mono font-bold transition-colors", theme === 'dark' ? "text-white/20" : "text-slate-300")}>
                  {isSheetExpanded ? "▼ collapse" : "▲ expand"}
                </span>
              </button>

              {selectedPlanet ? (
                /* Planet details formatted beautifully */
                (() => {
                  const planetObj = positions.find(p => p.name === selectedPlanet);
                  if (!planetObj) return null;
                  const nakData = NAKSHATRA_DATA[planetObj.nakshatra as keyof typeof NAKSHATRA_DATA];
                  const dignityInterp = planetObj.dignity ? getDignityInterpretation(planetObj.name, planetObj.dignity, planetObj.rashi) : null;
                  return (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-md"
                            style={{ backgroundColor: planetObj.color, color: '#000' }}
                          >
                            {planetObj.symbol}
                          </div>
                          <div>
                            <h3 className={cn("text-base font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>
                              {planetObj.name}
                            </h3>
                            <p className={cn("text-xs font-mono uppercase tracking-widest font-bold", theme === 'dark' ? "text-jyotish-gold/70" : "text-jyotish-gold")}>
                              {planetObj.rashi} {planetObj.house ? `· House ${planetObj.house}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedPlanet(null); setIsSheetExpanded(false); }}
                          className={cn("w-7 h-7 rounded-full flex items-center justify-center border text-sm font-bold transition-all", theme === 'dark' ? "border-white/10 text-white/40 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                        >
                          ×
                        </button>
                      </div>

                      {/* Data Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Cell 1: Position */}
                        <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-surface-muted border-border-gold")}>
                          <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Position</div>
                          <div className={cn("text-xs font-mono font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>{planetObj.degree}°{planetObj.minute}'</div>
                          <div className={cn("text-[9px] font-bold font-mono mt-0.5", theme === 'dark' ? "text-jyotish-gold/60" : "text-orange-500/80")}>{planetObj.rashi}</div>
                        </div>

                        {/* Cell 2: Nakshatra */}
                        <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-surface-muted border-border-gold")}>
                          <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Nakshatra</div>
                          <div className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-jyotish-gold" : "text-jyotish-gold")}>{planetObj.nakshatra}</div>
                          <div className={cn("text-[9px] mt-0.5 font-bold font-mono", theme === 'dark' ? "text-white/40" : "text-ink-muted")}>Pada {planetObj.pada}</div>
                        </div>

                        {/* Cell 3: Dignity */}
                        {planetObj.dignity && (
                          <div className={cn("p-3 rounded-xl border col-span-2", 
                            dignityInterp?.type === 'positive' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                            dignityInterp?.type === 'negative' ? "bg-rose-500/5 border-rose-500/20 text-rose-400" :
                            theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-surface-muted border-border-gold"
                          )}>
                            <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Dignity</div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              {planetObj.dignity}
                            </div>
                            {dignityInterp && (
                              <p className={cn("text-[10px] mt-1 leading-relaxed", theme === 'dark' ? "text-white/60" : "text-ink-muted")}>
                                {dignityInterp.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Nakshatra Lord / Deity */}
                      {nakData && (
                        <div className={cn("p-3.5 rounded-xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50/50 border-slate-100")}>
                          <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1.5", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Nakshatra Energy</div>
                          <div className={cn("text-[10px] font-bold grid grid-cols-2 gap-1 mb-2", theme === 'dark' ? "text-white/80" : "text-ink-secondary")}>
                            <div>Lord: <span className="text-jyotish-gold">{nakData.lord}</span></div>
                            <div>Deity: <span className="text-jyotish-gold">{nakData.deity}</span></div>
                          </div>
                          <p className={cn("text-[10px] italic leading-relaxed", theme === 'dark' ? "text-white/50" : "text-ink-muted")}>
                            {nakData.characteristics}
                          </p>
                        </div>
                      )}

                      {/* Combust / Retrograde indicators if active */}
                      {(planetObj.isRetrograde || planetObj.isCombust) && (
                        <div className="flex gap-2">
                          {planetObj.isRetrograde && (
                            <div className={cn("flex-1 p-2 rounded-lg border text-center font-bold text-xs uppercase tracking-widest bg-orange-500/10 border-orange-500/30 text-orange-400")}>
                              ℞ Retrograde
                            </div>
                          )}
                          {planetObj.isCombust && (
                            <div className={cn("flex-1 p-2 rounded-lg border text-center font-bold text-xs uppercase tracking-widest bg-red-500/10 border-red-500/30 text-red-400 flex items-center justify-center gap-1.5")}>
                              <Flame className="w-3.5 h-3.5 fill-red-500" /> Combust
                            </div>
                          )}
                        </div>
                      )}

                      {/* Aspects (Drishti) */}
                      {selectedPlanetDrishti && (
                        <div className="space-y-3 pt-2.5 border-t border-white/10">
                          {selectedPlanetDrishti.aspects.length > 0 && (
                            <div className="space-y-1.5">
                              <div className={cn("text-[8px] uppercase tracking-widest font-bold font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Aspects (Casts on)</div>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(new Set(selectedPlanetDrishti.aspects)).map(name => (
                                  <div key={name} className={cn("px-2 py-0.5 rounded text-[10px] font-bold border font-mono", theme === 'dark' ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600")}>
                                    {name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedPlanetDrishti.aspectedBy.length > 0 && (
                            <div className="space-y-1.5">
                              <div className={cn("text-[8px] uppercase tracking-widest font-bold font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Aspected By</div>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(new Set(selectedPlanetDrishti.aspectedBy)).map(name => (
                                  <div key={name} className={cn("px-2 py-0.5 rounded text-[10px] font-bold border font-mono", theme === 'dark' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600")}>
                                    {name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : selectedZodiac !== null ? (
                /* Zodiac details */
                (() => {
                  const ascendant = positions.find(p => p.name === "Ascendant");
                  const ascRashiIdx = ascendant ? RASHIS.indexOf(ascendant.rashi) : 0;
                  const houseNum = ((selectedZodiac - ascRashiIdx + 12) % 12) + 1;
                  const rashiName = RASHIS[selectedZodiac];
                  const lord = getRashiLord(rashiName);
                  const planetsInSign = positions.filter(p => p.rashi === rashiName && p.name !== "Ascendant");
                  const houseInfo = HOUSE_DATA[houseNum];
                  
                  return (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold border",
                            theme === 'dark' ? "bg-jyotish-gold/10 border-jyotish-gold/30 text-jyotish-gold" : "bg-orange-50 border-orange-200 text-orange-600"
                          )}>
                            <Home className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className={cn("text-base font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>
                              {rashiName}
                            </h3>
                            <p className={cn("text-xs font-mono uppercase tracking-widest font-bold", theme === 'dark' ? "text-jyotish-gold/70" : "text-jyotish-gold")}>
                              {getOrdinal(houseNum)} House · Lord: {lord}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedZodiac(null); setIsSheetExpanded(false); }}
                          className={cn("w-7 h-7 rounded-full flex items-center justify-center border text-sm font-bold transition-all", theme === 'dark' ? "border-white/10 text-white/40 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
                        >
                          ×
                        </button>
                      </div>

                      {/* House Info grid */}
                      {houseInfo && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-surface-muted border-border-gold")}>
                            <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-jyotish-gold/50" : "text-jyotish-gold/80")}>
                              House Quality
                            </div>
                            <p className={cn("text-xs leading-relaxed italic", theme === 'dark' ? "text-white/70" : "text-ink-secondary")}>
                              {houseInfo.quality}
                            </p>
                          </div>

                          <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-surface-muted border-border-gold")}>
                            <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-emerald-500/60" : "text-emerald-600")}>
                              Growth Focus
                            </div>
                            <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/60" : "text-ink-secondary")}>
                              {houseInfo.workOn}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Occupants & Impacts list */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className={cn("text-[8px] uppercase tracking-widest font-bold font-mono mb-2", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>
                          Occupants & Impacts
                        </div>
                        {planetsInSign.length > 0 ? (
                          <div className="space-y-2.5">
                            {planetsInSign.map(p => (
                              <div key={p.name} className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50/50 border-slate-100")}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-ink-primary")}>{p.name}</span>
                                  <span className={cn("text-[10px] font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>{p.degree}°{p.minute}'</span>
                                </div>
                                <p className={cn("text-xs italic leading-relaxed border-l-2 pl-2.5", theme === 'dark' ? "border-jyotish-gold/30 text-white/50" : "border-orange-300 text-slate-500")}>
                                  {getPlanetInHouseInterpretation(p.name, houseNum)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={cn("text-xs italic", theme === 'dark' ? "text-white/20" : "text-slate-400/80")}>
                            No planets currently in {rashiName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
