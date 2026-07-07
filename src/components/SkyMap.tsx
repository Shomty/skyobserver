import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ZoomIn, ZoomOut, RotateCcw, Eye, Home, Shield } from 'lucide-react';
import { cn, getOrdinal } from '../lib/utils';
import NorthIndianChart from './NorthIndianChart';
import { PlanetPosition, RASHIS, calculateDrishti, Drishti, getDignityInterpretation, getRashiLord, HOUSE_DATA, getPlanetInHouseInterpretation, NAKSHATRA_DATA } from '../vedic-utils';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function useContinuousAngle(targetAngle: number) {
  const prevTargetRef = useRef(targetAngle);
  const continuousAngleRef = useRef(targetAngle);

  if (targetAngle !== prevTargetRef.current) {
    let diff = targetAngle - prevTargetRef.current;
    // Handle 360 degree wrapping
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    continuousAngleRef.current += diff;
    prevTargetRef.current = targetAngle;
  }

  return continuousAngleRef.current;
}

const getPlanetRingStyles = (theme: 'light' | 'dark') => ({
  "Ascendant": { radius: 80, color: theme === 'dark' ? "#10B981" : "#059669", borderStyle: "solid", opacity: 0.3 },
  "Ketu": { radius: 74, color: theme === 'dark' ? "#A9A9A9" : "#64748b", borderStyle: "dashed", opacity: 0.2 },
  "Rahu": { radius: 68, color: theme === 'dark' ? "#8A2BE2" : "#7c3aed", borderStyle: "dashed", opacity: 0.2 },
  "Saturn": { radius: 62, color: theme === 'dark' ? "#708090" : "#475569", borderStyle: "dotted", opacity: 0.3 },
  "Jupiter": { radius: 56, color: theme === 'dark' ? "#DAA520" : "#b45309", borderStyle: "solid", opacity: 0.2 },
  "Mars": { radius: 50, color: theme === 'dark' ? "#FF4500" : "#dc2626", borderStyle: "solid", opacity: 0.2 },
  "Sun": { radius: 44, color: theme === 'dark' ? "#FFD700" : "#d97706", borderStyle: "solid", opacity: 0.3 },
  "Venus": { radius: 38, color: theme === 'dark' ? "#FF69B4" : "#db2777", borderStyle: "solid", opacity: 0.2 },
  "Mercury": { radius: 32, color: theme === 'dark' ? "#00CED1" : "#0891b2", borderStyle: "dotted", opacity: 0.3 },
  "Moon": { radius: 26, color: theme === 'dark' ? "#F0F8FF" : "#2563eb", borderStyle: "dashed", opacity: 0.2 },
  "Bhrigu Bindu": { radius: 20, color: "#FF6B6B", borderStyle: "dotted", opacity: 0.4 },
});

interface ZodiacLabelProps {
  index: number;
  mapOffset: number;
  selectedZodiac: number | null;
  setSelectedZodiac: (idx: number | null) => void;
  isAspected?: boolean;
  aspectColor?: string;
}

const ZodiacLabel: React.FC<ZodiacLabelProps> = React.memo(({ index, mapOffset, selectedZodiac, setSelectedZodiac, isAspected, aspectColor }) => {
  const { theme } = useTheme();
  const targetAngle = index * 30 + mapOffset + 15; // Center the label in the 30° segment
  const angle = useContinuousAngle(targetAngle);
  const isSelected = selectedZodiac === index;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
    >
      {/* Clickable segment - centered around the label */}
      <div
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-auto cursor-pointer transition-all duration-500",
          isSelected
            ? "bg-orange-500/10 shadow-[inset_0_0_40px_rgba(249,115,22,0.1)]"
            : isAspected
              ? "bg-orange-500/[0.03] shadow-[inset_0_0_20px_rgba(249,115,22,0.02)]"
              : theme === 'dark' ? "hover:bg-white/[0.03]" : "hover:bg-slate-900/[0.03]"
        )}
        style={{
          clipPath: 'polygon(50% 50%, 36.6% 0%, 63.4% 0%)',
          backgroundColor: isAspected ? `${aspectColor}08` : undefined
        }}
        onClick={() => setSelectedZodiac(isSelected ? null : index)}
      />

      {/* Boundary lines */}
      <div className={cn("absolute top-0 left-1/2 w-px h-full -translate-x-1/2", theme === 'dark' ? "bg-white/5" : "bg-slate-900/5")} style={{ transform: 'rotate(-15deg)' }} />
      <div className={cn("absolute top-0 left-1/2 w-px h-full -translate-x-1/2", theme === 'dark' ? "bg-white/5" : "bg-slate-900/5")} style={{ transform: 'rotate(15deg)' }} />

      <div
        className={cn(
          "absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 text-[8px] lg:text-[10px] font-mono uppercase tracking-widest transition-all duration-300",
          isSelected
            ? "text-orange-500 font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
            : isAspected
              ? "text-orange-500/80 font-bold scale-105"
              : theme === 'dark' ? "text-white/20" : "text-slate-400"
        )}
        style={{
          color: isAspected ? `${aspectColor}CC` : undefined,
          transform: `rotate(${-angle}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {["ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "SCO", "SAG", "CAP", "AQU", "PIS"][index]}
      </div>
    </div>
  );
})

const NAKSHATRA_ABBREVS = [
  "ASW", "BHA", "KRI", "ROH", "MRI", "ARD", "PUN", "PUS", "ASL",
  "MAG", "PPH", "UPH", "HAS", "CHI", "SWT", "VIS", "ANU", "JYE",
  "MUL", "PAS", "UAS", "SHR", "DHA", "SAT", "PBH", "UBH", "REV",
];

const NAKSHATRA_SIZE = 360 / 27;

interface NakshatraLabelProps {
  index: number;
  mapOffset: number;
}

const NakshatraLabel: React.FC<NakshatraLabelProps> = React.memo(({ index, mapOffset }) => {
  const { theme } = useTheme();
  const targetAngle = index * NAKSHATRA_SIZE + mapOffset + NAKSHATRA_SIZE / 2;
  const angle = useContinuousAngle(targetAngle);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
    >
      {/* Boundary tick at outer edge */}
      <div
        className={cn("absolute top-0 left-1/2 h-[8%] w-px -translate-x-1/2", theme === 'dark' ? "bg-white/25" : "bg-slate-900/20")}
        style={{ transform: `translateX(-50%) rotate(${-NAKSHATRA_SIZE / 2}deg)` }}
      />

      {/* Abbreviated nakshatra name */}
      <div
        className={cn(
          "absolute top-[1.5%] lg:top-[2.5%] left-1/2 -translate-x-1/2 text-[6px] lg:text-[9px] font-mono uppercase tracking-widest",
          theme === 'dark' ? "text-white/40" : "text-slate-500"
        )}
        style={{
          transform: `rotate(${-angle}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {NAKSHATRA_ABBREVS[index]}
      </div>
    </div>
  );
})


interface PlanetMarkerProps {
  p: PlanetPosition;
  mapOffset: number;
  selectedPlanet: string | null;
  setSelectedPlanet: (name: string | null) => void;
  hoveredPlanetName: string | null;
  setHoveredPlanetName: (name: string | null) => void;
  selectedZodiac: number | null;
  isInner?: boolean;
  isComparison?: boolean;
  isConjunct?: boolean;
  isAspectingSelected?: boolean;
  isAspectedBySelected?: boolean;
}

const PlanetMarker: React.FC<PlanetMarkerProps> = React.memo(({ p, mapOffset, selectedPlanet, setSelectedPlanet, hoveredPlanetName, setHoveredPlanetName, selectedZodiac, isInner, isComparison, isConjunct, isAspectingSelected, isAspectedBySelected }) => {
  const { theme } = useTheme();
  const targetAngle = p.siderealLongitude + mapOffset;
  const angle = useContinuousAngle(targetAngle);
  const ringStyles = React.useMemo(() => getPlanetRingStyles(theme), [theme]);
  const radius = (ringStyles[p.name]?.radius || 100) * (isInner ? 0.8 : 1);
  const isInSelectedZodiac = selectedZodiac !== null && p.rashi === RASHIS[selectedZodiac];
  const isHovered = hoveredPlanetName === p.name;

  return (
    <div
      className="absolute inset-0 pointer-events-none group"
      style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: `${50 - radius / 2}%` }}
      >
        <div
          className="relative flex flex-col items-center"
          style={{ transform: `rotate(${-angle}deg)`, transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        >
          {isConjunct && !isComparison && (
            <motion.div
              className="absolute inset-0 rounded-full bg-orange-500/30 blur-md"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 pointer-events-auto cursor-pointer",
              p.symbol.length > 1 ? "text-[10px]" : "text-sm",
              theme === 'dark' ? "shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "shadow-[0_0_15px_rgba(0,0,0,0.1)]",
              isComparison
                ? theme === 'dark' ? "border-2 border-dashed border-white/30 bg-black/40" : "border-2 border-dashed border-slate-900/30 bg-white/40"
                : theme === 'dark' ? "bg-black/60" : "bg-white/80",
              selectedPlanet === p.name
                ? theme === 'dark' ? "scale-125 ring-2 ring-white z-50 shadow-[0_0_30px_rgba(255,255,255,0.4)]" : "scale-125 ring-2 ring-slate-900 z-50 shadow-[0_0_30px_rgba(0,0,0,0.2)]"
                : isHovered
                  ? theme === 'dark' ? "scale-125 ring-2 ring-white z-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "scale-125 ring-2 ring-slate-900 z-50 shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                  : isAspectedBySelected
                    ? "scale-110 ring-1 ring-orange-500/60 z-40 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                    : isAspectingSelected
                      ? "scale-110 ring-1 ring-blue-500/60 z-40 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                      : isInSelectedZodiac ? "scale-110 ring-1 ring-orange-500/40 z-40 shadow-[0_0_15px_rgba(249,115,22,0.3)]" :
                      isConjunct ? "ring-1 ring-orange-500 z-40" : "group-hover:scale-110 hover:z-40"
            )}
            style={{
              backgroundColor: isComparison ? 'transparent' : p.color,
              color: isComparison ? p.color : '#000',
              borderColor: isComparison ? p.color : undefined,
              boxShadow: isInSelectedZodiac ? `0 0 25px ${p.color}, 0 0 10px rgba(249,115,22,0.3)` : undefined,
              opacity: isComparison ? 0.7 : 1
            }}
            onClick={() => setSelectedPlanet(selectedPlanet === p.name ? null : p.name)}
            onMouseEnter={() => setHoveredPlanetName(p.name)}
            onMouseLeave={() => setHoveredPlanetName(null)}
          >
            {p.symbol}
            {p.isRetrograde && (
              <div className={cn("absolute -bottom-1 -left-1 w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-orange-500 border border-orange-500/30 font-bold", theme === 'dark' ? "bg-black" : "bg-white")}>
                R
              </div>
            )}
            {p.isCombust && (
              <div className={cn("absolute -top-1 -left-1 w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-red-500 border border-red-500/30", theme === 'dark' ? "bg-black" : "bg-white")}>
                <Flame className="w-2 h-2 fill-red-500" />
              </div>
            )}
            {isComparison && <div className={cn("absolute -top-1 -right-1 w-2 h-2 rounded-full border", theme === 'dark' ? "bg-white/40 border-black" : "bg-slate-900/40 border-white")} />}
          </div>
        </div>
      </div>
    </div>
  );
})

interface SkyMapProps {
  chartType: 'circle' | 'north-indian';
  setChartType: (type: 'circle' | 'north-indian') => void;
  activeTab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana' | 'admin';
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
  activeTab,
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
  const [isSavingBirth, setIsSavingBirth] = React.useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = React.useState(false);

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

  const ringStyles = React.useMemo(() => getPlanetRingStyles(theme), [theme]);

  return (
    <div className={cn(
      "lg:col-span-7 flex flex-col relative border-b lg:border-r lg:border-b-0 min-h-0 overflow-hidden transition-colors duration-500",
      theme === 'dark' ? "border-white/5 bg-black/40" : "border-slate-200 bg-white/40",
      activeTab === 'stats' ? "hidden lg:flex" : "flex"
    )}>
      {/* Mobile Controls Bar */}
      <div className={cn(
        "lg:hidden flex items-center justify-between px-4 py-2.5 border-b transition-colors duration-500 z-20",
        theme === 'dark' ? "bg-mystic-purple/80 border-white/5" : "bg-white/80 border-slate-200"
      )}>
        {/* Chart type tabs */}
        <div className={cn(
          "flex items-center p-0.5 rounded-lg border",
          theme === 'dark' ? "bg-black/25 border-white/10" : "bg-slate-100 border-slate-200"
        )}>
          <button 
            onClick={() => setChartType('circle')}
            className={cn(
              "px-3 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest font-mono transition-all",
              chartType === 'circle' 
                ? "bg-jyotish-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.25)]" 
                : theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Circle
          </button>
          <button 
            onClick={() => setChartType('north-indian')}
            className={cn(
              "px-3 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest font-mono transition-all",
              chartType === 'north-indian' 
                ? "bg-jyotish-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.25)]" 
                : theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            N.Indian
          </button>
        </div>

        {/* Separator & Zoom controls */}
        <div className="flex items-center gap-1.5">
          <div className={cn("w-px h-5 mx-1", theme === 'dark' ? "bg-white/10" : "bg-slate-200")} />
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
          </div>
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
            <div className="backdrop-blur-md border rounded-xl p-2 flex items-center justify-between pointer-events-auto bg-black/80 border-white/10 min-h-[44px]">
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
                        <span className="font-semibold text-sm text-white leading-none truncate">{planet.name}</span>
                        <span className="text-[9px] uppercase tracking-widest font-mono text-white/40 mt-0.5">
                          {planet.rashi}{planet.house ? ` · House ${planet.house}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="font-mono text-xs text-white">{planet.degree}°{planet.minute}'</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {planet.dignity && (
                          <span className={cn(
                            "text-[8px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded",
                            planet.dignity === 'Exalted' ? "bg-green-500/20 text-green-400" :
                            planet.dignity === 'Debilitated' ? "bg-red-500/20 text-red-400" :
                            planet.dignity === 'Own Sign' ? "bg-blue-500/20 text-blue-400" :
                            "bg-white/10 text-white/60"
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
                      <span className="text-[9px] uppercase tracking-widest font-mono text-white/40">{getOrdinal(hoveredHouse)} House</span>
                      <span className="font-semibold text-sm text-white">{houseRashi}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] uppercase tracking-widest font-mono text-white/40">Lord</span>
                      <span className="text-orange-400 font-semibold text-sm">{houseLord}</span>
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
                    <div className="w-7 h-7 rounded-lg border border-white/10 flex-shrink-0" />
                    <span className="text-[10px] uppercase tracking-widest font-mono text-white/25">
                      Tap a planet or house to inspect
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })()}

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative min-h-0">
        {/* View Mode Controls - Desktop Only */}
        <div className="hidden lg:flex absolute top-4 lg:top-8 left-4 lg:left-8 z-20 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Chart Mode</div>
            <div className={cn(
              "flex p-1 rounded-xl border backdrop-blur-md transition-colors duration-500",
              theme === 'dark' ? "bg-black/40 border-white/10" : "bg-white/60 border-slate-200"
            )}>
              <button 
                onClick={() => setViewMode('transit')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                  viewMode === 'transit' 
                    ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                    : theme === 'dark' ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Transit
              </button>
              <button 
                onClick={() => setViewMode('natal')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                  viewMode === 'natal' 
                    ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                    : theme === 'dark' ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Natal
              </button>
            </div>
          </div>
          
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
                  <h3 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>Enter Birth Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Time of birth</label>
                    <input 
                      type="datetime-local" 
                      className={cn(
                        "w-full bg-transparent border rounded-lg p-2 text-xs transition-colors",
                        theme === 'dark' ? "border-white/10 text-white focus:border-orange-500/50 [color-scheme:dark]" : "border-slate-200 text-slate-800 focus:border-orange-500/50"
                      )}
                      value={birthTime ? new Date(birthTime.getTime() - birthTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setBirthTime(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>City of birth</label>
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
                theme === 'dark' ? "bg-black/80 border-white/10" : "bg-white/90 border-slate-200"
              )}
            >
              {selectedPlanet ? (
                /* Planet Analysis */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-orange-500" />
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        {selectedPlanet}
                      </h4>
                    </div>
                    <button onClick={() => setSelectedPlanet(null)} className="text-white/20 hover:text-white/60">×</button>
                  </div>

                  <div className="space-y-4">
                    {/* Nakshatra info */}
                    {(() => {
                      const planetObj = positions.find(p => p.name === selectedPlanet);
                      if (!planetObj) return null;
                      const nakData = NAKSHATRA_DATA[planetObj.nakshatra as keyof typeof NAKSHATRA_DATA];
                      return (
                        <div className={cn("p-2.5 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200")}>
                          <div className={cn("text-[9px] uppercase tracking-widest font-bold mb-1.5", theme === 'dark' ? "text-jyotish-gold/50" : "text-orange-400")}>
                            Nakshatra
                          </div>
                          <div className={cn("text-xs font-bold", theme === 'dark' ? "text-jyotish-gold" : "text-orange-600")}>
                            {planetObj.nakshatra}
                            <span className={cn("ml-1.5 text-[10px] font-normal", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                              Pada {planetObj.pada}
                            </span>
                          </div>
                          {nakData && (
                            <>
                              <div className={cn("text-[10px] mt-1", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                                Lord: <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{nakData.lord}</span>
                                {" · "}Deity: <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{nakData.deity}</span>
                              </div>
                              <p className={cn("text-[9px] italic mt-1 leading-relaxed", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
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
                          <p className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
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
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        {RASHIS[selectedZodiac]}
                      </h4>
                    </div>
                    <button onClick={() => setSelectedZodiac(null)} className="text-white/20 hover:text-white/60">×</button>
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
                          <div className={cn("p-2.5 rounded-xl border bg-white/5 border-white/10 space-y-2")}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-widest text-white/40">House</span>
                              <span className="text-[11px] font-bold text-jyotish-gold">{getOrdinal(houseNum)} House</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-widest text-white/40">Sign Lord</span>
                              <span className="text-[11px] font-bold text-white">{lord}</span>
                            </div>
                          </div>

                          {houseInfo && (
                            <div className="space-y-2.5 pt-1">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-widest text-jyotish-gold/60 font-bold">House Quality</span>
                                <p className="text-[10px] leading-relaxed text-white/70 italic">{houseInfo.quality}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-widest text-emerald-500/60 font-bold">Growth Focus</span>
                                <p className="text-[10px] leading-relaxed text-white/60">{houseInfo.workOn}</p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2.5 pt-1 border-t border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Occupants & Impacts</div>
                            {planetsInSign.length > 0 ? (
                              <div className="flex flex-col gap-2.5">
                                {planetsInSign.map(p => (
                                  <div key={p.name} className="space-y-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-white/90">{p.name}</span>
                                      <span className="text-[9px] font-mono text-white/40">{p.degree}°{p.minute}'</span>
                                    </div>
                                    <p className="text-[9px] leading-tight text-white/50 italic border-l-2 border-jyotish-gold/30 pl-2">
                                      {getPlanetInHouseInterpretation(p.name, houseNum)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-white/20 italic">No planets currently in {rashiName}</div>
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
            "relative w-full max-w-[400px] lg:max-w-[700px] aspect-square flex items-center justify-center transition-all duration-500",
            chartType === 'circle' 
              ? cn("overflow-hidden rounded-full border transition-colors duration-500", theme === 'dark' ? "border-white/5 bg-black/20" : "border-slate-200 bg-white/40 shadow-inner") 
              : "overflow-visible",
            activeTab === 'sky' && chartType === 'north-indian' ? "hidden lg:flex" : "flex",
            activeTab === 'chart' && chartType === 'circle' ? "hidden lg:flex" : "flex"
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
              {/* Planetary Rings */}
              {Object.entries(ringStyles).map(([name, style]) => {
                const isSelected = selectedPlanet === name;
                return (
                  <div 
                    key={`ring-${name}`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-500"
                    style={{ 
                      width: `${style.radius}%`, 
                      height: `${style.radius}%`,
                      borderWidth: name === "Ascendant" ? '2px' : '1px',
                      borderStyle: style.borderStyle,
                      borderColor: style.color,
                      opacity: isSelected ? 0.8 : style.opacity,
                      boxShadow: isSelected ? `0 0 20px ${style.color}40 inset, 0 0 20px ${style.color}40` : 'none',
                      zIndex: isSelected ? 10 : 0
                    }}
                  />
                );
              })}
              
              {/* Central Earth */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20" />
                <div className="absolute w-32 h-32 border border-blue-500/20 rounded-full hidden" />
              </div>

              {/* Drishti Lines for Circle Chart */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100">
                {(() => {
                  const styles = ringStyles;
                  const outputs: React.ReactNode[] = [];

                  // Helper to render aspects for a specific planet
                  const renderAspects = (pName: string, drishti: Drishti, isMain: boolean) => {
                    const planetData = positions.find(p => p.name === pName);
                    if (!planetData) return null;

                    const sourceRadius = styles[planetData.name as keyof typeof styles]?.radius || 100;
                    const sourceAngle = (planetData.siderealLongitude + mapOffset - 90) * (Math.PI / 180);
                    const x1 = 50 + (sourceRadius / 2) * Math.cos(sourceAngle);
                    const y1 = 50 + (sourceRadius / 2) * Math.sin(sourceAngle);

                    const checkFull = (name: string, house: number) => {
                      if (house === 7) return true;
                      if (name === 'Mars' && [4, 8].includes(house)) return true;
                      if (['Jupiter', 'Rahu', 'Ketu'].includes(name) && [5, 9].includes(house)) return true;
                      if (name === 'Saturn' && [3, 10].includes(house)) return true;
                      return false;
                    };

                    const baseOpacityMod = isMain ? 1 : 0.5;

                    // Outgoing Planet Aspects
                    const pLines = (drishti.aspectDetails || []).map((detail, pidx) => {
                      const targetPlanet = positions.find(p => p.name === detail.targetName);
                      if (!targetPlanet) return null;
                      const targetRadius = styles[targetPlanet.name as keyof typeof styles]?.radius || 100;
                      const targetAngle = (targetPlanet.siderealLongitude + mapOffset - 90) * (Math.PI / 180);
                      const x2 = 50 + (targetRadius / 2) * Math.cos(targetAngle);
                      const y2 = 50 + (targetRadius / 2) * Math.sin(targetAngle);
                      const isFull = checkFull(pName, detail.house);

                      return (
                        <motion.line 
                          key={`${pName}-out-p-${detail.targetName}-${detail.house}`}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: (isFull ? 0.7 : 0.35) * baseOpacityMod }}
                          whileHover={{ opacity: 0.9, strokeWidth: 1.2 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={planetData.color}
                          strokeWidth={(isFull ? 0.5 : 0.25) * (isMain ? 1 : 0.8)}
                          strokeDasharray={isFull ? "none" : "3 1.5"}
                          strokeLinecap="round"
                          className="cursor-help pointer-events-auto"
                        >
                          <title>{`${pName} casts ${getOrdinal(detail.house)} aspect on ${detail.targetName}`}</title>
                        </motion.line>
                      );
                    });

                    // Incoming Aspects (Only for Selected Planet)
                    const iLines = isMain ? (drishti.aspectedByDetails || []).map((detail, iidx) => {
                      const srcP = positions.find(p => p.name === detail.sourceName);
                      if (!srcP) return null;
                      const sRadius = styles[srcP.name as keyof typeof styles]?.radius || 100;
                      const sAngle = (srcP.siderealLongitude + mapOffset - 90) * (Math.PI / 180);
                      const sx = 50 + (sRadius / 2) * Math.cos(sAngle);
                      const sy = 50 + (sRadius / 2) * Math.sin(sAngle);
                      const isFull = checkFull(detail.sourceName, detail.house);

                      return (
                        <motion.line 
                          key={`${pName}-in-p-${detail.sourceName}-${detail.house}`}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: (isFull ? 0.5 : 0.2) }}
                          whileHover={{ opacity: 0.9, strokeWidth: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          x1={sx} y1={sy} x2={x1} y2={y1}
                          stroke={srcP.color}
                          strokeWidth={isFull ? 0.4 : 0.2}
                          strokeDasharray="2 2"
                          strokeLinecap="round"
                          className="cursor-help pointer-events-auto"
                        >
                          <title>{`${detail.sourceName} casts ${getOrdinal(detail.house)} aspect on ${pName}`}</title>
                        </motion.line>
                      );
                    }) : [];

                    // Rashi Aspects
                    const rLines = (drishti.aspectedRashiDetails || []).map((detail, ridx) => {
                      const rIdx = RASHIS.indexOf(detail.rashi);
                      const tAngle = (rIdx * 30 + 15 + mapOffset - 90) * (Math.PI / 180);
                      const tRadius = 90;
                      const rx2 = 50 + (tRadius / 2) * Math.cos(tAngle);
                      const ry2 = 50 + (tRadius / 2) * Math.sin(tAngle);
                      const isFull = checkFull(pName, detail.house);

                      return (
                        <g key={`${pName}-rashi-${detail.rashi}-${detail.house}`}>
                          <motion.line 
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: (isFull ? 0.4 : 0.2) * baseOpacityMod }}
                            whileHover={{ opacity: 0.9, strokeWidth: 0.8 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            x1={x1} y1={y1} x2={rx2} y2={ry2}
                            stroke={planetData.color}
                            strokeWidth={(isFull ? 0.35 : 0.2) * (isMain ? 1 : 0.7)}
                            strokeDasharray={isFull ? "none" : "3 3"}
                            strokeLinecap="round"
                            className="cursor-help pointer-events-auto"
                          >
                            <title>{`${pName} casts ${getOrdinal(detail.house)} aspect on House (${detail.rashi})`}</title>
                          </motion.line>
                          <motion.circle 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: (isFull ? 0.5 : 0.25) * baseOpacityMod }}
                            transition={{ delay: 0.6, duration: 0.4 }}
                            cx={rx2} cy={ry2} r={isFull ? 0.9 : 0.6}
                            fill={planetData.color}
                            className="pointer-events-none"
                          />
                        </g>
                      );
                    });

                    return [...pLines, ...iLines, ...rLines];
                  };

                  if (selectedPlanet && selectedPlanetDrishti) {
                    outputs.push(...(renderAspects(selectedPlanet, selectedPlanetDrishti, true) || [] as any));
                  }

                  return outputs;
                })()}
              </svg>

              {/* Horizon Line */}
              <div className={cn("absolute top-1/2 left-4 right-4 h-px -translate-y-1/2 pointer-events-none z-10", theme === 'dark' ? "bg-white/20" : "bg-slate-900/20")} />
              <div className={cn("absolute top-1/2 left-0 -translate-y-1/2 -translate-x-full pr-2 text-[10px] font-mono uppercase tracking-widest z-10", theme === 'dark' ? "text-white/60" : "text-slate-500")}>East (Lagna)</div>
              <div className={cn("absolute top-1/2 right-0 -translate-y-1/2 translate-x-full pl-2 text-[10px] font-mono uppercase tracking-widest z-10", theme === 'dark' ? "text-white/60" : "text-slate-500")}>West</div>

              {/* Nakshatra Ring Band Separator */}
              <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[87%] h-[87%] rounded-full border pointer-events-none", theme === 'dark' ? "border-white/10" : "border-slate-900/10")} />

              {/* Nakshatra Ring */}
              {Array.from({ length: 27 }).map((_, i) => (
                <NakshatraLabel key={`nak-${i}`} index={i} mapOffset={mapOffset} />
              ))}

              {/* Zodiac Labels */}
              {Array.from({ length: 12 }).map((_, i) => {
                const rashiName = RASHIS[i];
                const aspectDetail = selectedPlanetDrishti?.aspectedRashiDetails?.find(d => d.rashi === rashiName);
                const selectedPlanetData = positions.find(p => p.name === selectedPlanet);
                
                return (
                  <ZodiacLabel 
                    key={i} 
                    index={i} 
                    mapOffset={mapOffset} 
                    selectedZodiac={selectedZodiac}
                    setSelectedZodiac={setSelectedZodiac}
                    isAspected={!!aspectDetail}
                    aspectColor={selectedPlanetData?.color}
                  />
                );
              })}

              {/* Planets on Map */}
              {positions.map((p, idx) => {
                const compPlanet = isBirthMode && comparisonPositions ? comparisonPositions.find(np => np.name === p.name) : null;
                let isConjunct = false;
                if (compPlanet) {
                  let diff = Math.abs(p.siderealLongitude - compPlanet.siderealLongitude);
                  if (diff > 180) diff = 360 - diff;
                  isConjunct = diff < 5;
                }

                return (
                  <PlanetMarker 
                    key={`${p.name}-${idx}`} 
                    p={p} 
                    mapOffset={mapOffset} 
                    selectedPlanet={selectedPlanet} 
                    setSelectedPlanet={setSelectedPlanet} 
                    hoveredPlanetName={hoveredPlanetName}
                    setHoveredPlanetName={setHoveredPlanetName}
                    selectedZodiac={selectedZodiac}
                    isConjunct={isConjunct}
                    isInner={viewMode === 'natal'}
                    isComparison={false}
                    isAspectedBySelected={selectedPlanetDrishti?.aspects.includes(p.name)}
                    isAspectingSelected={selectedPlanetDrishti?.aspectedBy.includes(p.name)}
                  />
                );
              })}

              {/* Comparison Chart Markers */}
              {isBirthMode && (viewMode !== 'natal') && comparisonPositions && comparisonPositions.map((p, idx) => (
                <PlanetMarker 
                  key={`comp-${p.name}-${idx}`} 
                  p={p} 
                  mapOffset={mapOffset} 
                  selectedPlanet={selectedPlanet} 
                  setSelectedPlanet={setSelectedPlanet} 
                  hoveredPlanetName={hoveredPlanetName}
                  setHoveredPlanetName={setHoveredPlanetName}
                  selectedZodiac={selectedZodiac}
                  isInner={viewMode === 'transit'}
                  isComparison={true}
                  isAspectedBySelected={selectedPlanetDrishti?.aspects.includes(p.name)}
                  isAspectingSelected={selectedPlanetDrishti?.aspectedBy.includes(p.name)}
                />
              ))}
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
            />
          )}
        </div>

        {/* Legend - Desktop Only */}
        <div className="hidden lg:flex absolute bottom-4 lg:bottom-8 left-4 lg:left-8 flex-col gap-2">
          <div className={cn("flex items-center gap-2 text-[8px] lg:text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
            <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-blue-500" /> Earth ({location ? "Topocentric" : "Geocentric"} Center)
          </div>
          <div className={cn("flex items-center gap-2 text-[8px] lg:text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
            <div className={cn("w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full border", theme === 'dark' ? "border-white/20" : "border-slate-300")} /> Ecliptic Path (Sidereal)
          </div>
        </div>
      </div>

      {/* Mobile Legend Bar */}
      <div className={cn(
        "lg:hidden min-h-[28px] py-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 border-t border-b flex-shrink-0 transition-colors duration-500",
        theme === 'dark' ? "bg-black/35 border-white/5" : "bg-slate-50 border-slate-200"
      )}>
        <div className={cn("flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-mono font-bold", theme === 'dark' ? "text-white/45" : "text-slate-500")}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Earth ({location ? "Topocentric" : "Geocentric"})
        </div>
        <div className={cn("flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-mono font-bold", theme === 'dark' ? "text-white/45" : "text-slate-500")}>
          <div className={cn("w-1.5 h-1.5 rounded-full border", theme === 'dark' ? "border-white/20" : "border-slate-300")} />
          Ecliptic (Sidereal)
        </div>
      </div>

      {/* Mobile Hint - show when nothing is selected */}
      {!selectedPlanet && selectedZodiac === null && (
        <div className={cn(
          "lg:hidden mx-4 mt-3 p-2.5 rounded-xl border flex items-center gap-2.5 text-[10px] font-mono font-bold tracking-wider transition-colors duration-500",
          theme === 'dark' ? "bg-black/40 border-white/5 text-white/40" : "bg-white border-slate-200 text-slate-400"
        )}>
          <div className={cn("w-2 h-2 rounded-sm", theme === 'dark' ? "bg-white/5 border border-white/10" : "bg-slate-100 border border-slate-200")} />
          TAP A PLANET OR ZODIAC SIGN TO INSPECT
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
                  <label className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Time of birth</label>
                  <input 
                    type="datetime-local" 
                    className={cn(
                      "w-full bg-transparent border rounded-lg p-2.5 text-xs transition-colors",
                      theme === 'dark' ? "border-white/10 text-white focus:border-jyotish-gold/50 [color-scheme:dark]" : "border-slate-200 text-slate-800 focus:border-jyotish-gold/50"
                    )}
                    value={birthTime ? new Date(birthTime.getTime() - birthTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setBirthTime(e.target.value ? new Date(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={cn("text-[9px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>City of birth</label>
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
                            <h3 className={cn("text-base font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                              {planetObj.name}
                            </h3>
                            <p className={cn("text-xs font-mono uppercase tracking-widest font-bold", theme === 'dark' ? "text-jyotish-gold/70" : "text-orange-500")}>
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
                        <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200")}>
                          <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Position</div>
                          <div className={cn("text-xs font-mono font-bold", theme === 'dark' ? "text-white" : "text-slate-800")}>{planetObj.degree}°{planetObj.minute}'</div>
                          <div className={cn("text-[9px] font-bold font-mono mt-0.5", theme === 'dark' ? "text-jyotish-gold/60" : "text-orange-500/80")}>{planetObj.rashi}</div>
                        </div>

                        {/* Cell 2: Nakshatra */}
                        <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200")}>
                          <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Nakshatra</div>
                          <div className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-jyotish-gold" : "text-orange-600")}>{planetObj.nakshatra}</div>
                          <div className={cn("text-[9px] mt-0.5 font-bold font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Pada {planetObj.pada}</div>
                        </div>

                        {/* Cell 3: Dignity */}
                        {planetObj.dignity && (
                          <div className={cn("p-3 rounded-xl border col-span-2", 
                            dignityInterp?.type === 'positive' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                            dignityInterp?.type === 'negative' ? "bg-rose-500/5 border-rose-500/20 text-rose-400" :
                            theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200"
                          )}>
                            <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Dignity</div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              {planetObj.dignity}
                            </div>
                            {dignityInterp && (
                              <p className={cn("text-[10px] mt-1 leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                                {dignityInterp.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Nakshatra Lord / Deity */}
                      {nakData && (
                        <div className={cn("p-3.5 rounded-xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50/50 border-slate-100")}>
                          <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1.5", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Nakshatra Energy</div>
                          <div className={cn("text-[10px] font-bold grid grid-cols-2 gap-1 mb-2", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
                            <div>Lord: <span className="text-jyotish-gold">{nakData.lord}</span></div>
                            <div>Deity: <span className="text-jyotish-gold">{nakData.deity}</span></div>
                          </div>
                          <p className={cn("text-[10px] italic leading-relaxed", theme === 'dark' ? "text-white/50" : "text-slate-500")}>
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
                              <div className={cn("text-[8px] uppercase tracking-widest font-bold font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Aspects (Casts on)</div>
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
                              <div className={cn("text-[8px] uppercase tracking-widest font-bold font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Aspected By</div>
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
                            <h3 className={cn("text-base font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                              {rashiName}
                            </h3>
                            <p className={cn("text-xs font-mono uppercase tracking-widest font-bold", theme === 'dark' ? "text-jyotish-gold/70" : "text-orange-500")}>
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
                          <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200")}>
                            <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-jyotish-gold/50" : "text-orange-400")}>
                              House Quality
                            </div>
                            <p className={cn("text-xs leading-relaxed italic", theme === 'dark' ? "text-white/70" : "text-slate-600")}>
                              {houseInfo.quality}
                            </p>
                          </div>

                          <div className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200")}>
                            <div className={cn("text-[8px] uppercase tracking-widest font-mono font-bold mb-1", theme === 'dark' ? "text-emerald-500/60" : "text-emerald-600")}>
                              Growth Focus
                            </div>
                            <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
                              {houseInfo.workOn}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Occupants & Impacts list */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className={cn("text-[8px] uppercase tracking-widest font-bold font-mono mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                          Occupants & Impacts
                        </div>
                        {planetsInSign.length > 0 ? (
                          <div className="space-y-2.5">
                            {planetsInSign.map(p => (
                              <div key={p.name} className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50/50 border-slate-100")}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-slate-800")}>{p.name}</span>
                                  <span className={cn("text-[10px] font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{p.degree}°{p.minute}'</span>
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
