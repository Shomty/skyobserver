import React from 'react';
import { PlanetPosition, RASHIS, isConjunct, calculateDrishti, Drishti } from '../vedic-utils';
import { cn, getOrdinal } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';

interface NorthIndianChartProps {
  positions: PlanetPosition[];
  comparisonPositions?: PlanetPosition[] | null;
  viewMode?: 'transit' | 'natal';
  isBirthMode?: boolean;
  selectedPlanet?: string | null;
  setSelectedPlanet?: (name: string | null) => void;
  selectedZodiac?: number | null;
  setSelectedZodiac?: (idx: number | null) => void;
  hoveredPlanetName?: string | null;
  setHoveredPlanetName?: (name: string | null) => void;
  hoveredHouse?: number | null;
  setHoveredHouse?: (house: number | null) => void;
  className?: string;
  showHover?: boolean;
  zoom?: number;
  setZoom?: React.Dispatch<React.SetStateAction<number>>;
  pan?: { x: number; y: number };
  setPan?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

const NorthIndianChart: React.FC<NorthIndianChartProps> = ({ 
  positions, 
  comparisonPositions, 
  viewMode = 'natal',
  isBirthMode = true, 
  selectedPlanet = null, 
  setSelectedPlanet = () => {},
  selectedZodiac = null,
  setSelectedZodiac = () => {},
  hoveredPlanetName = null,
  setHoveredPlanetName = () => {},
  hoveredHouse = null,
  setHoveredHouse = () => {},
  className,
  showHover = true,
  zoom = 1,
  setZoom = () => {},
  pan = { x: 0, y: 0 },
  setPan = () => {},
}) => {
  const { theme } = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedPlanetDrishti = React.useMemo(() => {
    if (!selectedPlanet) return null;
    return calculateDrishti(selectedPlanet, positions);
  }, [selectedPlanet, positions]);

  // Find the Ascendant to determine the starting Rashi for the 1st House
  // We use the primary positions' ascendant as the base for the houses
  const activeAscendant = positions.find(p => p.name === "Ascendant");
  
  if (!activeAscendant) return <div className={cn("italic", theme === 'dark' ? "text-white/20" : "text-slate-400")}>Calculating chart...</div>;

  const startRashiIdx = RASHIS.indexOf(activeAscendant.rashi);

  // Helper to get Rashi index for a house (1-indexed)
  const getRashiForHouse = (houseNum: number) => {
    return (startRashiIdx + houseNum - 1) % 12;
  };

  // Helper to get House number for a Rashi index
  const getHouseForRashi = (rashiIdx: number) => {
    return ((rashiIdx - startRashiIdx + 12) % 12) + 1;
  };

  // Group planets by house and sort by degree
  const planetsInHouses: Record<number, PlanetPosition[]> = {};
  const comparisonPlanetsInHouses: Record<number, PlanetPosition[]> = {};

  positions.forEach(p => {
    const house = getHouseForRashi(RASHIS.indexOf(p.rashi));
    if (!planetsInHouses[house]) planetsInHouses[house] = [];
    planetsInHouses[house].push(p);
  });

  // Sort by degree within the rashi
  Object.values(planetsInHouses).forEach(list => {
    list.sort((a, b) => (a.degree * 60 + a.minute) - (b.degree * 60 + b.minute));
  });

  if (isBirthMode && comparisonPositions) {
    comparisonPositions.forEach(p => {
      const house = getHouseForRashi(RASHIS.indexOf(p.rashi));
      if (!comparisonPlanetsInHouses[house]) comparisonPlanetsInHouses[house] = [];
      comparisonPlanetsInHouses[house].push(p);
    });
    
    Object.values(comparisonPlanetsInHouses).forEach(list => {
      list.sort((a, b) => (a.degree * 60 + a.minute) - (b.degree * 60 + b.minute));
    });
  }

  // Determine if a planet should be highlighted based on Rashi of hovered planet
  const hoveredPlanetData = [...positions, ...(comparisonPositions || [])].find(p => p.name === hoveredPlanetName);
  const hoveredRashi = hoveredPlanetData?.rashi;

  // House coordinates for a 400x400 SVG
  // 1st House: Center top diamond
  // 2nd House: Top left triangle
  // 3rd House: Left top triangle
  // 4th House: Left center diamond
  // 5th House: Left bottom triangle
  // 6th House: Bottom left triangle
  // 7th House: Bottom center diamond
  // 8th House: Bottom right triangle
  // 9th House: Right bottom triangle
  // 10th House: Right center diamond
  // 11th House: Right top triangle
  // 12th House: Top right triangle

  const houses = [
    { id: 1, path: "M 200 0 L 100 100 L 200 200 L 300 100 Z", labelPos: { x: 200, y: 110 }, planetsPos: { x: 200, y: 60 } },
    { id: 2, path: "M 0 0 L 200 0 L 100 100 Z", labelPos: { x: 100, y: 30 }, planetsPos: { x: 100, y: 60 } },
    { id: 3, path: "M 0 0 L 100 100 L 0 200 Z", labelPos: { x: 30, y: 100 }, planetsPos: { x: 60, y: 100 } },
    { id: 4, path: "M 100 100 L 0 200 L 100 300 L 200 200 Z", labelPos: { x: 110, y: 200 }, planetsPos: { x: 60, y: 200 } },
    { id: 5, path: "M 0 200 L 100 300 L 0 400 Z", labelPos: { x: 30, y: 300 }, planetsPos: { x: 60, y: 300 } },
    { id: 6, path: "M 0 400 L 200 400 L 100 300 Z", labelPos: { x: 100, y: 370 }, planetsPos: { x: 100, y: 340 } },
    { id: 7, path: "M 100 300 L 200 400 L 300 300 L 200 200 Z", labelPos: { x: 200, y: 290 }, planetsPos: { x: 200, y: 340 } },
    { id: 8, path: "M 200 400 L 400 400 L 300 300 Z", labelPos: { x: 300, y: 370 }, planetsPos: { x: 300, y: 340 } },
    { id: 9, path: "M 300 300 L 400 400 L 400 200 Z", labelPos: { x: 370, y: 300 }, planetsPos: { x: 340, y: 300 } },
    { id: 10, path: "M 200 200 L 300 300 L 400 200 L 300 100 Z", labelPos: { x: 290, y: 200 }, planetsPos: { x: 340, y: 200 } },
    { id: 11, path: "M 300 100 L 400 200 L 400 0 Z", labelPos: { x: 370, y: 100 }, planetsPos: { x: 340, y: 100 } },
    { id: 12, path: "M 200 0 L 400 0 L 300 100 Z", labelPos: { x: 300, y: 30 }, planetsPos: { x: 300, y: 60 } },
  ];

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full aspect-square p-4 rounded-3xl border shadow-2xl overflow-hidden transition-colors duration-500",
        theme === 'dark' ? "bg-black/20 border-white/5" : "bg-white border-slate-200",
        className
      )}
    >
      <motion.div 
        className="w-full h-full cursor-grab active:cursor-grabbing"
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
        <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Markers for Drishti Lines */}
        <defs>
          <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
          </marker>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Grid Lines */}
        <path 
          d="M 0 0 L 400 400 M 400 0 L 0 400 M 200 0 L 0 200 L 200 400 L 400 200 Z" 
          fill="none" 
          stroke={theme === 'dark' ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"} 
          strokeWidth="0.5" 
        />
        
        {houses.map((house) => {
          const rashiIdx = getRashiForHouse(house.id);
          const rashiNum = rashiIdx + 1;
          const rashiName = RASHIS[rashiIdx];
          const currentPlanets = planetsInHouses[house.id] || [];
          const comparisonPlanets = comparisonPlanetsInHouses[house.id] || [];
          const isSelected = selectedZodiac === rashiIdx;
          const isHouseHighlighted = isSelected || hoveredHouse === house.id || (hoveredRashi === rashiName);

          return (
            <g key={house.id}>
              {/* House Boundary */}
              <path 
                d={house.path} 
                onMouseEnter={() => setHoveredHouse(house.id)}
                onMouseLeave={() => setHoveredHouse(null)}
                onClick={() => setSelectedZodiac(isSelected ? null : rashiIdx)}
                className={cn(
                  "fill-transparent transition-all duration-500 cursor-pointer",
                  theme === 'dark' ? "stroke-white/5" : "stroke-slate-200",
                  isHouseHighlighted 
                    ? theme === 'dark' ? "fill-white/10 stroke-orange-500/40 stroke-[1.5]" : "fill-orange-500/5 stroke-orange-500/40 stroke-[1.5]" 
                    : theme === 'dark' ? "hover:fill-white/5" : "hover:fill-slate-50",
                  isSelected && "fill-orange-500/10 stroke-orange-500 stroke-[2]"
                )}
              />
              
              {/* Rashi Number */}
              <text 
                x={house.labelPos.x} 
                y={house.labelPos.y} 
                textAnchor="middle" 
                className={cn(
                  "transition-all font-mono font-bold tracking-tighter",
                  isHouseHighlighted 
                    ? "fill-orange-500 text-[14px]" 
                    : theme === 'dark' ? "fill-orange-500/40 text-[12px]" : "fill-orange-500/60 text-[12px]"
                )}
              >
                {rashiNum}
              </text>

              {/* Planets Container */}
              <foreignObject 
                x={house.planetsPos.x - 45} 
                y={house.planetsPos.y - 25} 
                width="90" 
                height="50"
              >
                <div className="w-full h-full flex flex-wrap items-center justify-center gap-1 overflow-visible">
                  {/* Current Planets */}
                  {currentPlanets.map((p, idx) => {
                    const isPlanetHighlighted = hoveredPlanetName === p.name || hoveredHouse === house.id;
                    const isAsc = p.name === "Ascendant";
                    const label = viewMode === 'transit' ? 'T' : 'N';
                    
                    return (
                      <button
                        key={`${p.name}-${idx}`}
                        onClick={() => setSelectedPlanet(selectedPlanet === p.name ? null : p.name)}
                        onMouseEnter={() => setHoveredPlanetName(p.name)}
                        onMouseLeave={() => setHoveredPlanetName(null)}
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all duration-300 relative",
                          (selectedPlanet === p.name || isPlanetHighlighted) 
                            ? theme === 'dark' ? "scale-110 ring-1 ring-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "scale-110 ring-1 ring-slate-900 z-10 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                            : selectedPlanetDrishti?.aspects.includes(p.name)
                              ? "scale-110 ring-1 ring-orange-500 z-10 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                              : selectedPlanetDrishti?.aspectedBy.includes(p.name)
                                ? "scale-110 ring-1 ring-blue-500 z-10 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                                : "hover:scale-105 opacity-90 hover:opacity-100",
                          isAsc && (theme === 'dark' ? "ring-1 ring-white/50" : "ring-1 ring-slate-900/50")
                        )}
                        style={{ backgroundColor: p.color, color: '#000' }}
                        title={`${p.name} (${label}) at ${p.degree}°${p.minute}'${selectedPlanetDrishti?.aspects.includes(p.name) ? ` (Aspected by ${selectedPlanet})` : ''}${selectedPlanetDrishti?.aspectedBy.includes(p.name) ? ` (Aspecting ${selectedPlanet})` : ''}`}
                      >
                        {isAsc ? 'As' : p.symbol}
                        {p.isRetrograde && (
                          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center text-[6px] text-orange-500 border border-orange-500/20 font-bold">
                            R
                          </span>
                        )}
                        {p.isCombust && (
                          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center text-[6px] text-red-500 border border-red-500/20">
                            <Flame className="w-2 h-2 fill-red-500" />
                          </span>
                        )}
                        {isBirthMode && isAsc && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center text-[6px] text-white border border-white/20">
                            {label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  
                  {/* Comparison Planets */}
                  {isBirthMode && comparisonPlanets.map((p, idx) => {
                    const isPlanetHighlighted = hoveredPlanetName === p.name || hoveredHouse === house.id;
                    const isAsc = p.name === "Ascendant";
                    const label = viewMode === 'transit' ? 'N' : 'T';

                    return (
                      <button
                        key={`comp-${p.name}-${idx}`}
                        onClick={() => setSelectedPlanet(selectedPlanet === p.name ? null : p.name)}
                        onMouseEnter={() => setHoveredPlanetName(p.name)}
                        onMouseLeave={() => setHoveredPlanetName(null)}
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all duration-300 relative",
                          (selectedPlanet === p.name || isPlanetHighlighted) 
                            ? theme === 'dark' ? "scale-110 ring-1 ring-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "scale-110 ring-1 ring-slate-900 z-10 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                            : selectedPlanetDrishti?.aspects.includes(p.name)
                              ? "scale-110 ring-1 ring-orange-500 z-10 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                              : selectedPlanetDrishti?.aspectedBy.includes(p.name)
                                ? "scale-110 ring-1 ring-blue-500 z-10 shadow-[0_0_10_rgba(59,130,246,0.4)]"
                                : "hover:scale-105 opacity-80 hover:opacity-100",
                          isAsc && "border-dashed"
                        )}
                        style={{ 
                          backgroundColor: 'transparent', 
                          borderColor: p.color, 
                          color: p.color 
                        }}
                        title={`${p.name} (${label}) at ${p.degree}°${p.minute}'${selectedPlanetDrishti?.aspects.includes(p.name) ? ` (Aspected by ${selectedPlanet})` : ''}${selectedPlanetDrishti?.aspectedBy.includes(p.name) ? ` (Aspecting ${selectedPlanet})` : ''}`}
                      >
                        {isAsc ? 'As' : p.symbol}
                        {p.isRetrograde && (
                          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center text-[6px] text-orange-500 border border-orange-500/20 font-bold">
                            R
                          </span>
                        )}
                        {p.isCombust && (
                          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center text-[6px] text-red-500 border border-red-500/20">
                            <Flame className="w-2 h-2 fill-red-500" />
                          </span>
                        )}
                        {isAsc && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center text-[6px] text-white border border-white/20">
                            {label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Drishti Lines */}
        {(() => {
          const renderAspects = (pName: string, drishti: Drishti, type: 'selected' | 'hovered' | 'nodes') => {
            const planetData = [...positions, ...(comparisonPositions || [])].find(p => p.name === pName);
            if (!planetData) return null;
            
            const sourceHouseIdx = getHouseForRashi(RASHIS.indexOf(planetData.rashi));
            const sourceHouse = houses[sourceHouseIdx - 1];
            const sourcePos = sourceHouse.planetsPos;

            const isPrimary = type !== 'nodes';
            const baseOpacity = type === 'selected' ? 1 : type === 'hovered' ? 0.7 : 0.4;
            const strokeScale = type === 'selected' ? 1 : 0.7;

            return (
              <g key={`drishti-${pName}-${type}`} className="pointer-events-none">
                {/* House Highlights */}
                {drishti.aspectedHouses.map((ah, idx) => {
                  const targetHouse = houses[ah.house - 1];
                  const targetPos = targetHouse.planetsPos;
                  return (
                    <g key={`house-inf-${pName}-${idx}`}>
                      <motion.line 
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.15 * baseOpacity }}
                        whileHover={{ opacity: 0.5 }}
                        transition={{ duration: 1 }}
                        x1={sourcePos.x} y1={sourcePos.y}
                        x2={targetPos.x} y2={targetPos.y}
                        stroke={planetData.color}
                        strokeWidth={0.8 * strokeScale}
                        strokeDasharray="2 4"
                        className="pointer-events-auto cursor-help"
                      >
                        <title>{`${pName} influences House ${ah.house} (${getOrdinal(ah.relativeHouse)} aspect)`}</title>
                      </motion.line>
                      <motion.circle 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 }}
                        cx={targetPos.x} cy={targetPos.y} r={3.5 * strokeScale}
                        fill={planetData.color}
                        fillOpacity={0.08 * baseOpacity}
                        className="pointer-events-none"
                      />
                    </g>
                  );
                })}

                {/* Planet-to-Planet Aspects */}
                {drishti.aspectDetails.map((detail, idx) => {
                  const targetPlanet = positions.find(p => p.name === detail.targetName);
                  if (!targetPlanet) return null;
                  const targetHouseIdx = getHouseForRashi(RASHIS.indexOf(targetPlanet.rashi));
                  const targetPos = houses[targetHouseIdx - 1].planetsPos;
                  const isFull = [3, 4, 7, 8, 9, 10].includes(detail.house); // Simplified check for "Bold" lines

                  return (
                    <g key={`aspect-out-${pName}-${idx}`}>
                      <motion.line 
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: (isFull ? 0.4 : 0.25) * baseOpacity }}
                        whileHover={{ opacity: 0.8, strokeWidth: 1.5 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        x1={sourcePos.x} y1={sourcePos.y}
                        x2={targetPos.x} y2={targetPos.y}
                        stroke={type === 'nodes' ? planetData.color : "#f97316"}
                        strokeWidth={(isFull ? 1.2 : 0.8) * strokeScale}
                        strokeDasharray={isFull ? "none" : "4 4"}
                        markerEnd="url(#arrow-orange)"
                        className="pointer-events-auto cursor-help"
                      >
                        <title>{`${pName} casts ${getOrdinal(detail.house)} aspect on ${detail.targetName}`}</title>
                      </motion.line>
                    </g>
                  );
                })}

                {/* Relational Aspects (Only for Selected/Hovered) */}
                {type === 'selected' && drishti.aspectedByDetails.map((detail, idx) => {
                  const srcP = positions.find(p => p.name === detail.sourceName);
                  if (!srcP) return null;
                  const sHouseIdx = getHouseForRashi(RASHIS.indexOf(srcP.rashi));
                  const sPos = houses[sHouseIdx - 1].planetsPos;

                  return (
                    <g key={`aspect-in-${pName}-${idx}`}>
                      <motion.line 
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.3 * baseOpacity }}
                        whileHover={{ opacity: 0.6, strokeWidth: 1.2 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        x1={sPos.x} y1={sPos.y}
                        x2={sourcePos.x} y2={sourcePos.y}
                        stroke="#3b82f6"
                        strokeWidth={0.8 * strokeScale}
                        strokeDasharray="3 4"
                        markerEnd="url(#arrow-blue)"
                        className="pointer-events-auto cursor-help"
                      >
                        <title>{`${detail.sourceName} casts ${getOrdinal(detail.house)} aspect on ${pName}`}</title>
                      </motion.line>
                    </g>
                  );
                })}
              </g>
            );
          };

          const outputs = [];
          if (selectedPlanet && selectedPlanetDrishti) {
            outputs.push(renderAspects(selectedPlanet, selectedPlanetDrishti, 'selected'));
          }

          return outputs;
        })()}
      </svg>
    </motion.div>

      {/* Legend */}
      <div className="absolute bottom-2 left-4 flex gap-4">
        <div className={cn("flex items-center gap-1.5 text-[8px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
          <div className="w-2 h-2 rounded bg-orange-500/20 border border-orange-500/40" /> Transit
        </div>
        {isBirthMode && (
          <div className={cn("flex items-center gap-1.5 text-[8px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
            <div className="w-2 h-2 rounded-full border border-orange-500/40" /> Natal
          </div>
        )}
      </div>
    </div>
  );
};

export default NorthIndianChart;
