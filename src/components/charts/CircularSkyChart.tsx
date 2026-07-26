import React, { useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { cn, getOrdinal } from '../../lib/utils';
import {
  PlanetPosition,
  RASHIS,
  calculateDrishti,
  type Drishti,
} from '../../vedic-utils';
import { useTheme } from '../../context/ThemeContext';

function useContinuousAngle(targetAngle: number) {
  const prevTargetRef = useRef(targetAngle);
  const continuousAngleRef = useRef(targetAngle);

  if (targetAngle !== prevTargetRef.current) {
    let diff = targetAngle - prevTargetRef.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    continuousAngleRef.current += diff;
    prevTargetRef.current = targetAngle;
  }

  return continuousAngleRef.current;
}

export const getPlanetRingStyles = (theme: 'light' | 'dark') => ({
  Ascendant: { radius: 80, color: theme === 'dark' ? '#10B981' : '#059669', borderStyle: 'solid' as const, opacity: 0.3 },
  Ketu: { radius: 74, color: theme === 'dark' ? '#A9A9A9' : '#64748b', borderStyle: 'dashed' as const, opacity: 0.2 },
  Rahu: { radius: 68, color: theme === 'dark' ? '#8A2BE2' : '#7c3aed', borderStyle: 'dashed' as const, opacity: 0.2 },
  Saturn: { radius: 62, color: theme === 'dark' ? '#708090' : '#475569', borderStyle: 'dotted' as const, opacity: 0.3 },
  Jupiter: { radius: 56, color: theme === 'dark' ? '#DAA520' : '#b45309', borderStyle: 'solid' as const, opacity: 0.2 },
  Mars: { radius: 50, color: theme === 'dark' ? '#FF4500' : '#dc2626', borderStyle: 'solid' as const, opacity: 0.2 },
  Sun: { radius: 44, color: theme === 'dark' ? '#FFD700' : '#d97706', borderStyle: 'solid' as const, opacity: 0.3 },
  Venus: { radius: 38, color: theme === 'dark' ? '#FF69B4' : '#db2777', borderStyle: 'solid' as const, opacity: 0.2 },
  Mercury: { radius: 32, color: theme === 'dark' ? '#00CED1' : '#0891b2', borderStyle: 'dotted' as const, opacity: 0.3 },
  Moon: { radius: 26, color: theme === 'dark' ? '#F0F8FF' : '#2563eb', borderStyle: 'dashed' as const, opacity: 0.2 },
  'Bhrigu Bindu': { radius: 20, color: '#FF6B6B', borderStyle: 'dotted' as const, opacity: 0.4 },
});

const NAKSHATRA_ABBREVS = [
  'ASW', 'BHA', 'KRI', 'ROH', 'MRI', 'ARD', 'PUN', 'PUS', 'ASL',
  'MAG', 'PPH', 'UPH', 'HAS', 'CHI', 'SWT', 'VIS', 'ANU', 'JYE',
  'MUL', 'PAS', 'UAS', 'SHR', 'DHA', 'SAT', 'PBH', 'UBH', 'REV',
];

const NAKSHATRA_SIZE = 360 / 27;

interface ZodiacLabelProps {
  index: number;
  mapOffset: number;
  selectedZodiac: number | null;
  setSelectedZodiac: (idx: number | null) => void;
  isAspected?: boolean;
  aspectColor?: string;
  interactive: boolean;
}

const ZodiacLabel: React.FC<ZodiacLabelProps> = React.memo(({
  index, mapOffset, selectedZodiac, setSelectedZodiac, isAspected, aspectColor, interactive,
}) => {
  const { theme } = useTheme();
  const targetAngle = index * 30 + mapOffset + 15;
  const angle = useContinuousAngle(targetAngle);
  const isSelected = selectedZodiac === index;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
    >
      <div
        className={cn(
          'absolute top-0 left-1/2 -translate-x-1/2 w-full h-full transition-all duration-500',
          interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none',
          isSelected
            ? 'bg-orange-500/10 shadow-[inset_0_0_40px_rgba(249,115,22,0.1)]'
            : isAspected
              ? 'bg-orange-500/[0.03] shadow-[inset_0_0_20px_rgba(249,115,22,0.02)]'
              : theme === 'dark' ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-900/[0.03]',
        )}
        style={{
          clipPath: 'polygon(50% 50%, 36.6% 0%, 63.4% 0%)',
          backgroundColor: isAspected ? `${aspectColor}08` : undefined,
        }}
        onClick={interactive ? () => setSelectedZodiac(isSelected ? null : index) : undefined}
      />
      <div className={cn('absolute top-0 left-1/2 w-px h-full -translate-x-1/2', theme === 'dark' ? 'bg-white/5' : 'bg-slate-900/5')} style={{ transform: 'rotate(-15deg)' }} />
      <div className={cn('absolute top-0 left-1/2 w-px h-full -translate-x-1/2', theme === 'dark' ? 'bg-white/5' : 'bg-slate-900/5')} style={{ transform: 'rotate(15deg)' }} />
      <div
        className={cn(
          'absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 text-[8px] lg:text-[10px] font-mono uppercase tracking-widest transition-all duration-300',
          isSelected
            ? 'text-orange-500 font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]'
            : isAspected
              ? 'text-orange-500/80 font-bold scale-105'
              : theme === 'dark' ? 'text-white/20' : 'text-slate-400',
        )}
        style={{
          color: isAspected ? `${aspectColor}CC` : undefined,
          transform: `rotate(${-angle}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {['ARI', 'TAU', 'GEM', 'CAN', 'LEO', 'VIR', 'LIB', 'SCO', 'SAG', 'CAP', 'AQU', 'PIS'][index]}
      </div>
    </div>
  );
});

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
      <div
        className={cn('absolute top-0 left-1/2 h-[8%] w-px -translate-x-1/2', theme === 'dark' ? 'bg-white/25' : 'bg-slate-900/20')}
        style={{ transform: `translateX(-50%) rotate(${-NAKSHATRA_SIZE / 2}deg)` }}
      />
      <div
        className={cn(
          'absolute top-[1.5%] lg:top-[2.5%] left-1/2 -translate-x-1/2 text-[6px] lg:text-[9px] font-mono uppercase tracking-widest',
          theme === 'dark' ? 'text-white/40' : 'text-slate-500',
        )}
        style={{
          transform: `rotate(${-angle}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {NAKSHATRA_ABBREVS[index]}
      </div>
    </div>
  );
});

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
  interactive: boolean;
  compact?: boolean;
}

const PlanetMarker: React.FC<PlanetMarkerProps> = React.memo(({
  p, mapOffset, selectedPlanet, setSelectedPlanet, hoveredPlanetName, setHoveredPlanetName,
  selectedZodiac, isInner, isComparison, isConjunct, isAspectingSelected, isAspectedBySelected,
  interactive, compact,
}) => {
  const { theme } = useTheme();
  const targetAngle = p.siderealLongitude + mapOffset;
  const angle = useContinuousAngle(targetAngle);
  const ringStyles = useMemo(() => getPlanetRingStyles(theme), [theme]);
  const radius = (ringStyles[p.name as keyof typeof ringStyles]?.radius || 100) * (isInner ? 0.8 : 1);
  const isInSelectedZodiac = selectedZodiac !== null && p.rashi === RASHIS[selectedZodiac];
  const isHovered = hoveredPlanetName === p.name;
  const sizeClass = compact ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-sm';

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
              `${sizeClass} rounded-full flex items-center justify-center font-bold transition-all duration-300`,
              p.symbol.length > 1 ? 'text-[10px]' : 'text-sm',
              interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none',
              theme === 'dark' ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'shadow-[0_0_15px_rgba(0,0,0,0.1)]',
              isComparison
                ? theme === 'dark' ? 'border-2 border-dashed border-white/30 bg-black/40' : 'border-2 border-dashed border-slate-900/30 bg-white/40'
                : theme === 'dark' ? 'bg-black/60' : 'bg-white/80',
              selectedPlanet === p.name
                ? theme === 'dark' ? 'scale-125 ring-2 ring-white z-50 shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'scale-125 ring-2 ring-slate-900 z-50 shadow-[0_0_30px_rgba(0,0,0,0.2)]'
                : isHovered
                  ? theme === 'dark' ? 'scale-125 ring-2 ring-white z-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'scale-125 ring-2 ring-slate-900 z-50 shadow-[0_0_20px_rgba(0,0,0,0.15)]'
                  : isAspectedBySelected
                    ? 'scale-110 ring-1 ring-orange-500/60 z-40 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                    : isAspectingSelected
                      ? 'scale-110 ring-1 ring-blue-500/60 z-40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : isInSelectedZodiac ? 'scale-110 ring-1 ring-orange-500/40 z-40 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                        : isConjunct ? 'ring-1 ring-orange-500 z-40' : interactive ? 'group-hover:scale-110 hover:z-40' : '',
            )}
            style={{
              backgroundColor: isComparison ? 'transparent' : p.color,
              color: isComparison ? p.color : '#000',
              borderColor: isComparison ? p.color : undefined,
              boxShadow: isInSelectedZodiac ? `0 0 25px ${p.color}, 0 0 10px rgba(249,115,22,0.3)` : undefined,
              opacity: isComparison ? 0.7 : 1,
            }}
            onClick={interactive ? () => setSelectedPlanet(selectedPlanet === p.name ? null : p.name) : undefined}
            onMouseEnter={interactive ? () => setHoveredPlanetName(p.name) : undefined}
            onMouseLeave={interactive ? () => setHoveredPlanetName(null) : undefined}
          >
            {p.symbol}
            {p.isRetrograde && (
              <div className={cn('absolute -bottom-1 -left-1 w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-orange-500 border border-orange-500/30 font-bold', theme === 'dark' ? 'bg-black' : 'bg-white')}>
                R
              </div>
            )}
            {p.isCombust && (
              <div className={cn('absolute -top-1 -left-1 w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-red-500 border border-red-500/30', theme === 'dark' ? 'bg-black' : 'bg-white')}>
                <Flame className="w-2 h-2 fill-red-500" />
              </div>
            )}
            {isComparison && <div className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full border', theme === 'dark' ? 'bg-white/40 border-black' : 'bg-slate-900/40 border-white')} />}
          </div>
        </div>
      </div>
    </div>
  );
});

export interface CircularSkyChartProps {
  positions: PlanetPosition[];
  mapOffset: number;
  selectedPlanet?: string | null;
  onSelectPlanet?: (name: string | null) => void;
  hoveredPlanetName?: string | null;
  onHoverPlanet?: (name: string | null) => void;
  selectedZodiac?: number | null;
  onSelectZodiac?: (idx: number | null) => void;
  selectedPlanetDrishti?: Drishti | null;
  comparisonPositions?: PlanetPosition[] | null;
  isBirthMode?: boolean;
  viewMode?: 'transit' | 'natal';
  showDrishti?: boolean;
  showHorizonLabels?: boolean;
  className?: string;
  interactive?: boolean;
  compact?: boolean;
}

export const CircularSkyChart: React.FC<CircularSkyChartProps> = ({
  positions,
  mapOffset,
  selectedPlanet = null,
  onSelectPlanet = () => {},
  hoveredPlanetName = null,
  onHoverPlanet = () => {},
  selectedZodiac = null,
  onSelectZodiac = () => {},
  selectedPlanetDrishti = null,
  comparisonPositions = null,
  isBirthMode = false,
  viewMode = 'transit',
  showDrishti = false,
  showHorizonLabels = true,
  className,
  interactive = true,
  compact = false,
}) => {
  const { theme } = useTheme();
  const ringStyles = useMemo(() => getPlanetRingStyles(theme), [theme]);

  const drishti = selectedPlanetDrishti ?? (showDrishti && selectedPlanet
    ? calculateDrishti(selectedPlanet, positions)
    : null);

  return (
    <div className={cn('relative w-full h-full', className)}>
      {Object.entries(ringStyles).map(([name, style]) => {
        const isSelected = selectedPlanet === name;
        return (
          <div
            key={`ring-${name}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-500"
            style={{
              width: `${style.radius}%`,
              height: `${style.radius}%`,
              borderWidth: name === 'Ascendant' ? '2px' : '1px',
              borderStyle: style.borderStyle,
              borderColor: style.color,
              opacity: isSelected ? 0.8 : style.opacity,
              boxShadow: isSelected ? `0 0 20px ${style.color}40 inset, 0 0 20px ${style.color}40` : 'none',
              zIndex: isSelected ? 10 : 0,
            }}
          />
        );
      })}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20" />
      </div>

      {showDrishti && drishti && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100">
          {(() => {
            const styles = ringStyles;
            const outputs: React.ReactNode[] = [];

            const renderAspects = (pName: string, aspectDrishti: Drishti, isMain: boolean) => {
              const planetData = positions.find((p) => p.name === pName);
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

              const pLines = (aspectDrishti.aspectDetails || []).map((detail) => {
                const targetPlanet = positions.find((p) => p.name === detail.targetName);
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
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={planetData.color}
                    strokeWidth={(isFull ? 0.5 : 0.25) * (isMain ? 1 : 0.8)}
                    strokeDasharray={isFull ? 'none' : '3 1.5'}
                    strokeLinecap="round"
                  />
                );
              });

              const iLines = isMain ? (aspectDrishti.aspectedByDetails || []).map((detail) => {
                const srcP = positions.find((p) => p.name === detail.sourceName);
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
                    animate={{ pathLength: 1, opacity: isFull ? 0.5 : 0.2 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    x1={sx} y1={sy} x2={x1} y2={y1}
                    stroke={srcP.color}
                    strokeWidth={isFull ? 0.4 : 0.2}
                    strokeDasharray="2 2"
                    strokeLinecap="round"
                  />
                );
              }) : [];

              const rLines = (aspectDrishti.aspectedRashiDetails || []).map((detail) => {
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
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      x1={x1} y1={y1} x2={rx2} y2={ry2}
                      stroke={planetData.color}
                      strokeWidth={(isFull ? 0.35 : 0.2) * (isMain ? 1 : 0.7)}
                      strokeDasharray={isFull ? 'none' : '3 3'}
                      strokeLinecap="round"
                    />
                    <motion.circle
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: (isFull ? 0.5 : 0.25) * baseOpacityMod }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                      cx={rx2} cy={ry2} r={isFull ? 0.9 : 0.6}
                      fill={planetData.color}
                    />
                  </g>
                );
              });

              return [...pLines, ...iLines, ...rLines];
            };

            if (selectedPlanet && drishti) {
              outputs.push(...(renderAspects(selectedPlanet, drishti, true) || []));
            }

            return outputs;
          })()}
        </svg>
      )}

      {showHorizonLabels && (
        <>
          <div className={cn('absolute top-1/2 left-4 right-4 h-px -translate-y-1/2 pointer-events-none z-10', theme === 'dark' ? 'bg-white/20' : 'bg-slate-900/20')} />
          <div className={cn('absolute top-1/2 left-0 -translate-y-1/2 -translate-x-full pr-2 text-[10px] font-mono uppercase tracking-widest z-10', theme === 'dark' ? 'text-white/60' : 'text-slate-500')}>East (Lagna)</div>
          <div className={cn('absolute top-1/2 right-0 -translate-y-1/2 translate-x-full pl-2 text-[10px] font-mono uppercase tracking-widest z-10', theme === 'dark' ? 'text-white/60' : 'text-slate-500')}>West</div>
        </>
      )}

      <div className={cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[87%] h-[87%] rounded-full border pointer-events-none', theme === 'dark' ? 'border-white/10' : 'border-slate-900/10')} />

      {Array.from({ length: 27 }).map((_, i) => (
        <NakshatraLabel key={`nak-${i}`} index={i} mapOffset={mapOffset} />
      ))}

      {Array.from({ length: 12 }).map((_, i) => {
        const rashiName = RASHIS[i];
        const aspectDetail = drishti?.aspectedRashiDetails?.find((d) => d.rashi === rashiName);
        const selectedPlanetData = positions.find((p) => p.name === selectedPlanet);

        return (
          <ZodiacLabel
            key={i}
            index={i}
            mapOffset={mapOffset}
            selectedZodiac={selectedZodiac}
            setSelectedZodiac={onSelectZodiac}
            isAspected={!!aspectDetail}
            aspectColor={selectedPlanetData?.color}
            interactive={interactive}
          />
        );
      })}

      {positions.map((p, idx) => {
        const compPlanet = isBirthMode && comparisonPositions ? comparisonPositions.find((np) => np.name === p.name) : null;
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
            setSelectedPlanet={onSelectPlanet}
            hoveredPlanetName={hoveredPlanetName}
            setHoveredPlanetName={onHoverPlanet}
            selectedZodiac={selectedZodiac}
            isConjunct={isConjunct}
            isInner={viewMode === 'natal'}
            isComparison={false}
            isAspectedBySelected={drishti?.aspects.includes(p.name)}
            isAspectingSelected={drishti?.aspectedBy.includes(p.name)}
            interactive={interactive}
            compact={compact}
          />
        );
      })}

      {isBirthMode && viewMode !== 'natal' && comparisonPositions?.map((p, idx) => (
        <PlanetMarker
          key={`comp-${p.name}-${idx}`}
          p={p}
          mapOffset={mapOffset}
          selectedPlanet={selectedPlanet}
          setSelectedPlanet={onSelectPlanet}
          hoveredPlanetName={hoveredPlanetName}
          setHoveredPlanetName={onHoverPlanet}
          selectedZodiac={selectedZodiac}
          isInner={viewMode === 'transit'}
          isComparison
          isAspectedBySelected={drishti?.aspects.includes(p.name)}
          isAspectingSelected={drishti?.aspectedBy.includes(p.name)}
          interactive={interactive}
          compact={compact}
        />
      ))}
    </div>
  );
};

export default CircularSkyChart;
