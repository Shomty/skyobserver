import React, { useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, Sparkles, Loader2, RefreshCw, CircleDot, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import {
  PlanetPosition,
  calculateSudarshanaChakra,
  SudarshanaChakraResult,
  SudarshanaLayer,
} from '../vedic-utils';
import { getPerAccountReport, savePerAccountReport } from '../services/aiReportService';
import {
  generateSudarshanaChakraInterpretation,
  SudarshanaChakraInterpretations,
} from '../services/geminiService';
import type { User } from 'firebase/auth';

// ─── Constants ─────────────────────────────────────────────────────────────────

type LayerKey = 'lagnaChakra' | 'chandraChakra' | 'suryaChakra';

const LAYER_CONFIG = [
  { key: 'lagnaChakra' as LayerKey,   label: 'Lagna',   subtitle: 'Body · Self',    stroke: '#F97316', r1: 80,  r2: 165 },
  { key: 'chandraChakra' as LayerKey, label: 'Chandra', subtitle: 'Mind · Emotions', stroke: '#60A5FA', r1: 165, r2: 248 },
  { key: 'suryaChakra' as LayerKey,   label: 'Surya',   subtitle: 'Soul · Power',    stroke: '#F59E0B', r1: 248, r2: 305 },
] as const;

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#F97316', Moon: '#60A5FA', Mars: '#EF4444', Mercury: '#10B981',
  Jupiter: '#F59E0B', Venus: '#EC4899', Saturn: '#8B5CF6', Rahu: '#7C3AED', Ketu: '#9CA3AF',
};

const CACHE_DOC_ID = 'sudarshana-chakra';
const CX = 320, CY = 320;

// ─── SVG Helpers ───────────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number) {
  const p1 = polar(cx, cy, r1, startDeg);
  const p2 = polar(cx, cy, r2, startDeg);
  const p3 = polar(cx, cy, r2, endDeg);
  const p4 = polar(cx, cy, r1, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `A ${r2} ${r2} 0 ${large} 1 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    `A ${r1} ${r1} 0 ${large} 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// ─── Wheel Component ───────────────────────────────────────────────────────────

interface WheelProps {
  chakra: SudarshanaChakraResult;
  layerVisible: Record<LayerKey, boolean>;
  hoveredHouse: number | null;
  onHoverHouse: (h: number | null) => void;
  convergenceHouses: Set<number>;
}

const SudarshanaWheel: React.FC<WheelProps> = ({
  chakra,
  layerVisible,
  hoveredHouse,
  onHoverHouse,
  convergenceHouses,
}) => {
  return (
    <svg viewBox="0 0 640 640" className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="sc-centerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1c1430" />
          <stop offset="100%" stopColor="#0a0814" />
        </radialGradient>
        <radialGradient id="sc-bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0e0b1a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#030208" stopOpacity="0.95" />
        </radialGradient>
        <filter id="sc-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sc-softglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer background disc */}
      <circle cx={CX} cy={CY} r={316} fill="url(#sc-bgGrad)" />
      <circle cx={CX} cy={CY} r={316} fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="1" />

      {/* Three rings */}
      {LAYER_CONFIG.map((ring) => {
        const layer = chakra[ring.key];
        const visible = layerVisible[ring.key];
        return (
          <g key={ring.key} style={{ opacity: visible ? 1 : 0.1, transition: 'opacity 0.35s ease' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const h = i + 1;
              const startDeg = i * 30 - 90;
              const endDeg = startDeg + 30;
              const midDeg = startDeg + 15;
              const planets = layer.houses[h]?.planets ?? [];
              const hasPlanets = planets.length > 0;
              const isHovered = hoveredHouse === h;
              const isConvergence = convergenceHouses.has(h);

              const fillOpacity = hasPlanets
                ? isHovered ? 0.42 : isConvergence ? 0.28 : 0.16
                : isHovered ? 0.1 : 0.04;

              const strokeOpacity = isHovered ? 0.7 : hasPlanets ? 0.3 : 0.12;
              const strokeWidth = isHovered ? 1.5 : 0.8;

              // Planet placement within the ring
              const ringH = ring.r2 - ring.r1;
              const midR = (ring.r1 + ring.r2) / 2;
              const fontSize = ringH > 80 ? 16 : ringH > 60 ? 14 : 12;

              return (
                <g
                  key={h}
                  onMouseEnter={() => onHoverHouse(h)}
                  onMouseLeave={() => onHoverHouse(null)}
                  style={{ cursor: 'default' }}
                >
                  {/* Sector fill */}
                  <path
                    d={sectorPath(CX, CY, ring.r1, ring.r2, startDeg, endDeg)}
                    fill={ring.stroke}
                    fillOpacity={fillOpacity}
                    stroke={ring.stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                  />

                  {/* Convergence glow ring */}
                  {isConvergence && hasPlanets && (
                    <path
                      d={sectorPath(CX, CY, ring.r1 + 2, ring.r2 - 2, startDeg, endDeg)}
                      fill="none"
                      stroke={ring.stroke}
                      strokeOpacity={0.55}
                      strokeWidth="2"
                      filter="url(#sc-glow)"
                    />
                  )}

                  {/* Planet glyphs */}
                  {planets.map((planet, pi) => {
                    const total = planets.length;
                    let rPos: number;
                    if (total === 1) {
                      rPos = midR;
                    } else {
                      const step = ringH / (total + 1);
                      rPos = ring.r1 + step * (pi + 1);
                    }
                    const pos = polar(CX, CY, rPos, midDeg);
                    return (
                      <text
                        key={planet.name}
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={fontSize}
                        fill={PLANET_COLORS[planet.name] || '#9CA3AF'}
                        style={{ pointerEvents: 'none', userSelect: 'none', fontWeight: 'bold' }}
                        filter={isConvergence ? 'url(#sc-glow)' : undefined}
                      >
                        {PLANET_GLYPHS[planet.name] || planet.name.slice(0, 2)}
                      </text>
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Ring separator circles */}
      {[80, 165, 248, 305].map(r => (
        <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      ))}

      {/* Radial dividers (12 spokes) */}
      {Array.from({ length: 12 }, (_, i) => {
        const angleDeg = i * 30 - 90;
        const p1 = polar(CX, CY, 80, angleDeg);
        const p2 = polar(CX, CY, 305, angleDeg);
        return (
          <line
            key={i}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* House number labels (outer rim) */}
      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1;
        const midDeg = i * 30 - 90 + 15;
        const pos = polar(CX, CY, 313, midDeg);
        const isHovered = hoveredHouse === h;
        const isConvergence = convergenceHouses.has(h);
        return (
          <text
            key={h}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fontFamily="monospace"
            fill={
              isConvergence ? 'rgba(212,175,55,0.9)' :
              isHovered ? 'rgba(255,255,255,0.8)' :
              'rgba(255,255,255,0.28)'
            }
            fontWeight={isConvergence ? 'bold' : 'normal'}
          >
            {h}
          </text>
        );
      })}

      {/* Center circle */}
      <circle cx={CX} cy={CY} r={80} fill="url(#sc-centerGrad)" />
      <circle cx={CX} cy={CY} r={80} fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="1.5" />

      {/* Center: reference sign labels */}
      <text x={CX} y={CY - 32} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="rgba(212,175,55,0.55)" fontFamily="monospace" letterSpacing="1">SUDARSHANA</text>
      <text x={CX} y={CY - 14} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#F97316" fontWeight="bold">
        {chakra.lagnaChakra.referenceSign.slice(0, 3).toUpperCase()}
      </text>
      <text x={CX} y={CY + 4} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#60A5FA" fontWeight="bold">
        {chakra.chandraChakra.referenceSign.slice(0, 3).toUpperCase()}
      </text>
      <text x={CX} y={CY + 22} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#F59E0B" fontWeight="bold">
        {chakra.suryaChakra.referenceSign.slice(0, 3).toUpperCase()}
      </text>
      <text x={CX} y={CY + 42} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="rgba(212,175,55,0.35)" fontFamily="monospace">✦</text>

      {/* Outer decorative ring */}
      <circle cx={CX} cy={CY} r={320} fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth="3" />
    </svg>
  );
};

// ─── Hover Info Panel ─────────────────────────────────────────────────────────

const HoverPanel: React.FC<{
  house: number | null;
  chakra: SudarshanaChakraResult;
}> = ({ house, chakra }) => {
  if (!house) return (
    <div className="h-12 flex items-center justify-center">
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Hover a house sector</p>
    </div>
  );

  const rows = LAYER_CONFIG.map(l => ({
    label: l.label,
    color: l.stroke,
    planets: chakra[l.key].houses[house]?.planets ?? [],
  }));

  return (
    <motion.div
      key={house}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-center gap-6 h-12 px-4"
    >
      <span className="text-xs font-mono text-jyotish-gold font-bold">H{house}</span>
      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wide" style={{ color: row.color }}>{row.label}</span>
          <span className="text-sm">
            {row.planets.length === 0
              ? <span className="text-white/20 text-[10px]">—</span>
              : row.planets.map(p => (
                  <span key={p.name} style={{ color: PLANET_COLORS[p.name] || '#9CA3AF' }}>
                    {PLANET_GLYPHS[p.name] || p.name.slice(0, 2)}
                  </span>
                ))}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

// ─── AI Sections ──────────────────────────────────────────────────────────────

const AI_SECTIONS: { key: keyof SudarshanaChakraInterpretations; label: string; color: string }[] = [
  { key: 'overview',             label: 'Overview',              color: '#D4AF37' },
  { key: 'lagnaChakra',          label: 'Lagna Chakra',          color: '#F97316' },
  { key: 'chandraChakra',        label: 'Chandra Chakra',        color: '#60A5FA' },
  { key: 'suryaChakra',          label: 'Surya Chakra',          color: '#F59E0B' },
  { key: 'crossLayerHighlights', label: 'Cross-Layer Highlights', color: '#10B981' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

interface SudarshanaChakraPageProps {
  birthPositions: PlanetPosition[];
  user: User;
  userProfile: any;
  birthFingerprint: string | null;
  onClose: () => void;
}

const SudarshanaChakraPage: React.FC<SudarshanaChakraPageProps> = ({
  birthPositions,
  user,
  userProfile,
  birthFingerprint,
  onClose,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [layerVisible, setLayerVisible] = React.useState<Record<LayerKey, boolean>>({
    lagnaChakra: true,
    chandraChakra: true,
    suryaChakra: true,
  });
  const [hoveredHouse, setHoveredHouse] = React.useState<number | null>(null);

  const [aiData, setAiData] = React.useState<SudarshanaChakraInterpretations | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiOutdated, setAiOutdated] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<string | null>('overview');

  // ── Calculation ──────────────────────────────────────────────────────────────
  const chakra = useMemo<SudarshanaChakraResult | null>(() => {
    try { return calculateSudarshanaChakra(birthPositions); }
    catch { return null; }
  }, [birthPositions]);

  const convergenceHouses = useMemo<Set<number>>(() => {
    const set = new Set<number>();
    if (!chakra) return set;
    for (let h = 1; h <= 12; h++) {
      const count = LAYER_CONFIG.filter(l => (chakra[l.key].houses[h]?.planets?.length ?? 0) > 0).length;
      if (count >= 2) set.add(h);
    }
    return set;
  }, [chakra]);

  // ── AI Cache ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setAiData(null); setAiError(null); setAiOutdated(false);
    if (!user?.uid || !birthFingerprint) return;
    (async () => {
      const cached = await getPerAccountReport(user.uid, CACHE_DOC_ID);
      if (!cached) return;
      if (cached.fingerprint === birthFingerprint) {
        setAiData(cached.data as SudarshanaChakraInterpretations);
      } else {
        setAiOutdated(true);
      }
    })();
  }, [birthFingerprint, user?.uid]);

  const handleGenerateAI = useCallback(async () => {
    if (!chakra || !user?.uid || !birthFingerprint) return;
    setIsAiLoading(true); setAiError(null); setAiOutdated(false);
    try {
      const profile = { firstName: userProfile?.firstName, gender: userProfile?.gender };
      const result = await generateSudarshanaChakraInterpretation(chakra, profile);
      setAiData(result);
      await savePerAccountReport(user.uid, CACHE_DOC_ID, result, birthFingerprint);
    } catch (err: any) {
      setAiError(err?.message || 'Failed to generate interpretation');
    } finally {
      setIsAiLoading(false);
    }
  }, [chakra, user?.uid, birthFingerprint, userProfile]);

  const toggleLayer = (key: LayerKey) =>
    setLayerVisible(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={cn(
      'min-h-screen font-sans selection:bg-jyotish-gold/30 transition-colors duration-500',
      isDark ? 'bg-[#050505] text-white' : 'bg-[#f0f0f0] text-slate-900'
    )}>

      {/* Header */}
      <div className={cn(
        'sticky top-0 z-40 px-4 py-3 lg:px-6 flex items-center justify-between border-b backdrop-blur-xl',
        isDark ? 'border-jyotish-gold/10 bg-black/60' : 'border-slate-200 bg-white/80'
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90',
              isDark ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={cn('w-px h-6', isDark ? 'bg-white/10' : 'bg-slate-200')} />
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-jyotish-gold/10' : 'bg-orange-50')}>
            <CircleDot className="w-5 h-5 text-jyotish-gold" />
          </div>
          <div>
            <h1 className={cn('text-base font-bold leading-none', isDark ? 'text-white' : 'text-slate-900')}>Sudarshana Chakra</h1>
            <p className="text-[10px] uppercase tracking-widest font-mono text-jyotish-gold/60 mt-0.5">Three-Layer Life Wheel</p>
          </div>
        </div>
      </div>

      {/* ── Big Wheel ── */}
      <div className="flex items-center justify-center py-6 px-4">
        <div
          className="mx-auto"
          style={{ width: 'min(92vw, calc(100vh - 220px))', aspectRatio: '1 / 1' }}
        >
          {chakra ? (
            <SudarshanaWheel
              chakra={chakra}
              layerVisible={layerVisible}
              hoveredHouse={hoveredHouse}
              onHoverHouse={setHoveredHouse}
              convergenceHouses={convergenceHouses}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-white/30">Requires birth chart data</p>
            </div>
          )}
        </div>
      </div>

      {/* Hover info */}
      {chakra && (
        <div className={cn(
          'border-t border-b mx-4 rounded-xl mb-4 transition-colors',
          isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white'
        )}>
          <HoverPanel house={hoveredHouse} chakra={chakra} />
        </div>
      )}

      {/* Convergence legend dot */}
      <div className="flex items-center justify-center gap-2 mb-4 px-4">
        <span className="w-2 h-2 rounded-full bg-jyotish-gold/70 inline-block" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-jyotish-gold/50">Convergence — same house active in 2+ layers</span>
      </div>

      {/* Layer Pills */}
      <div className="flex gap-2 px-4 mb-6 justify-center flex-wrap">
        {LAYER_CONFIG.map(l => {
          const on = layerVisible[l.key];
          return (
            <button
              key={l.key}
              onClick={() => toggleLayer(l.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wide transition-all active:scale-95',
                on
                  ? 'bg-white/5 border-white/20'
                  : 'bg-transparent border-white/5 opacity-35'
              )}
              style={{ color: on ? l.stroke : '#666' }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                style={{ background: l.stroke, opacity: on ? 1 : 0.3 }}
              />
              {l.label}
              <span className="text-[9px] font-normal tracking-normal opacity-60 hidden sm:inline">{l.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* AI Panel */}
      <div className={cn(
        'mx-4 mb-24 rounded-2xl border overflow-hidden',
        isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-100 shadow-sm'
      )}>
        <div className={cn(
          'px-4 py-4 flex items-center justify-between border-b',
          isDark ? 'border-white/5' : 'border-slate-100'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-jyotish-gold/10' : 'bg-orange-50')}>
              <Sparkles className="w-4 h-4 text-jyotish-gold" />
            </div>
            <div>
              <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>AI Interpretation</p>
              <p className="text-[10px] uppercase tracking-widest font-mono text-jyotish-gold/60 mt-0.5">Three-Layer Reading by Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiData && !isAiLoading && (
              <button
                onClick={handleGenerateAI}
                className={cn('w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95', isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')}
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            {!aiData && !isAiLoading && (
              <button
                onClick={handleGenerateAI}
                disabled={!user || !birthFingerprint}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all active:scale-95',
                  'bg-jyotish-gold/20 text-jyotish-gold hover:bg-jyotish-gold/30 border border-jyotish-gold/20',
                  (!user || !birthFingerprint) && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {isAiLoading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="w-5 h-5 text-jyotish-gold animate-spin" />
              <p className={cn('text-sm', isDark ? 'text-white/40' : 'text-slate-500')}>Reading your cosmic layers…</p>
            </div>
          )}

          {aiOutdated && !isAiLoading && !aiData && (
            <div className={cn(
              'flex items-center justify-between p-3 rounded-xl border mb-3 text-xs',
              isDark ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            )}>
              <span>Interpretation outdated — birth details changed</span>
              <button onClick={handleGenerateAI} className="font-bold underline">Regenerate</button>
            </div>
          )}

          {aiError && !isAiLoading && (
            <div className={cn(
              'p-3 rounded-xl border text-xs mb-3',
              isDark ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            )}>
              {aiError}
            </div>
          )}

          {!aiData && !isAiLoading && !aiOutdated && (
            <div className="py-8 text-center">
              <CircleDot className="w-10 h-10 mx-auto mb-3 opacity-10" />
              <p className={cn('text-sm', isDark ? 'text-white/30' : 'text-slate-400')}>
                Generate your personalised three-layer Sudarshana reading
              </p>
            </div>
          )}

          {aiData && !isAiLoading && (
            <div className="space-y-2">
              {AI_SECTIONS.map(sec => {
                const content = aiData[sec.key];
                const isOpen = expandedSection === sec.key;
                return (
                  <div key={sec.key} className={cn('rounded-xl border overflow-hidden', isDark ? 'border-white/[0.06]' : 'border-slate-100')}>
                    <button
                      onClick={() => setExpandedSection(isOpen ? null : sec.key)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                        isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                      )}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: sec.color }}>{sec.label}</span>
                      {isOpen
                        ? <ChevronUp className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                        : <ChevronDown className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className={cn(
                            'px-4 pb-4 text-sm leading-relaxed prose prose-sm max-w-none',
                            isDark ? 'prose-invert text-white/70' : 'text-slate-700'
                          )}>
                            <ReactMarkdown>{content}</ReactMarkdown>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SudarshanaChakraPage;
