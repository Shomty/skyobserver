import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Sparkles, Loader2, RefreshCw, CircleDot,
  ChevronDown, ChevronUp, Users, Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { differenceInYears } from 'date-fns';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import {
  PlanetPosition,
  calculateSudarshanaChakra,
  calculateSudarshanaActiveHouse,
  SudarshanaChakraResult,
  calculatePositions,
  RASHIS,
} from '../vedic-utils';
import { fetchPlanetPositions } from '../services/positionsService';
import { ensureReport } from '../services/aiReportService';
import {
  generateSudarshanaChakraInterpretation,
  normalizeCachedSudarshanaInterpretation,
  SudarshanaChakraInterpretations,
} from '../services/geminiService';
import type { User } from 'firebase/auth';
import type { ChildProfile } from './ProfilesPage';

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

const CX = 320, CY = 320;

const AI_SECTIONS: { key: keyof SudarshanaChakraInterpretations; label: string; color: string }[] = [
  { key: 'threefoldCore',              label: 'I. Threefold Core',              color: '#D4AF37' },
  { key: 'careerActionAxis',           label: 'II. Career & Action',            color: '#F97316' },
  { key: 'relationshipsPeaceOfMind',   label: 'III. Relationships & Mind',      color: '#60A5FA' },
  { key: 'activeSudarshanaYear',       label: 'IV. Active Year',                color: '#10B981' },
  { key: 'remedialGrowthGuidance',     label: 'V. Remedial Guidance',           color: '#F59E0B' },
];

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

function formatPlanetList(planets: PlanetPosition[]): string {
  if (planets.length === 0) return '—';
  return planets.map(p => {
    const glyph = PLANET_GLYPHS[p.name] || p.name.slice(0, 2);
    const extras = [p.dignity, p.isRetrograde ? 'Rx' : null].filter(Boolean).join(' ');
    return extras ? `${glyph} ${extras}` : glyph;
  }).join(' ');
}

// ─── Wheel Component ───────────────────────────────────────────────────────────

interface WheelProps {
  chakra: SudarshanaChakraResult;
  layerVisible: Record<LayerKey, boolean>;
  hoveredHouse: number | null;
  onHoverHouse: (h: number | null) => void;
  convergenceHouses: Set<number>;
  activeHouse: number;
}

const SudarshanaWheel: React.FC<WheelProps> = ({
  chakra,
  layerVisible,
  hoveredHouse,
  onHoverHouse,
  convergenceHouses,
  activeHouse,
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
      </defs>

      <circle cx={CX} cy={CY} r={316} fill="url(#sc-bgGrad)" />
      <circle cx={CX} cy={CY} r={316} fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="1" />

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
              const isActive = activeHouse === h;

              const fillOpacity = isActive
                ? isHovered ? 0.5 : 0.35
                : hasPlanets
                  ? isHovered ? 0.42 : isConvergence ? 0.28 : 0.16
                  : isHovered ? 0.1 : 0.04;

              return (
                <g
                  key={h}
                  onMouseEnter={() => onHoverHouse(h)}
                  onMouseLeave={() => onHoverHouse(null)}
                  style={{ cursor: 'default' }}
                >
                  <path
                    d={sectorPath(CX, CY, ring.r1, ring.r2, startDeg, endDeg)}
                    fill={isActive ? '#D4AF37' : ring.stroke}
                    fillOpacity={fillOpacity}
                    stroke={isActive ? '#D4AF37' : ring.stroke}
                    strokeOpacity={isHovered ? 0.7 : hasPlanets ? 0.3 : 0.12}
                    strokeWidth={isActive ? 2 : isHovered ? 1.5 : 0.8}
                    strokeLinejoin="round"
                  />

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

                  {planets.map((planet, pi) => {
                    const ringH = ring.r2 - ring.r1;
                    const midR = (ring.r1 + ring.r2) / 2;
                    const fontSize = ringH > 80 ? 16 : ringH > 60 ? 14 : 12;
                    const total = planets.length;
                    const rPos = total === 1 ? midR : ring.r1 + (ringH / (total + 1)) * (pi + 1);
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

      {[80, 165, 248, 305].map(r => (
        <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      ))}

      {Array.from({ length: 12 }, (_, i) => {
        const angleDeg = i * 30 - 90;
        const p1 = polar(CX, CY, 80, angleDeg);
        const p2 = polar(CX, CY, 305, angleDeg);
        return (
          <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        );
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1;
        const midDeg = i * 30 - 90 + 15;
        const pos = polar(CX, CY, 313, midDeg);
        const isHovered = hoveredHouse === h;
        const isConvergence = convergenceHouses.has(h);
        const isActive = activeHouse === h;
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
              isActive ? 'rgba(212,175,55,1)' :
              isConvergence ? 'rgba(212,175,55,0.9)' :
              isHovered ? 'rgba(255,255,255,0.8)' :
              'rgba(255,255,255,0.28)'
            }
            fontWeight={isActive || isConvergence ? 'bold' : 'normal'}
          >
            {h}
          </text>
        );
      })}

      <circle cx={CX} cy={CY} r={80} fill="url(#sc-centerGrad)" />
      <circle cx={CX} cy={CY} r={80} fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="1.5" />
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
      <circle cx={CX} cy={CY} r={320} fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth="3" />
    </svg>
  );
};

// ─── Data Validation Table ─────────────────────────────────────────────────────

const PlanetsInHousesTable: React.FC<{
  chakra: SudarshanaChakraResult;
  activeHouse: number;
  isDark: boolean;
}> = ({ chakra, activeHouse, isDark }) => (
  <div className={cn(
    'rounded-xl border overflow-hidden',
    isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white'
  )}>
    <div className={cn(
      'px-3 py-2 border-b flex items-center justify-between',
      isDark ? 'border-white/5' : 'border-slate-100'
    )}>
      <p className={cn('text-[10px] font-mono uppercase tracking-widest font-bold', isDark ? 'text-jyotish-gold/70' : 'text-jyotish-gold')}>
        Planets in Houses — Data Validation
      </p>
      <div className="flex gap-3 text-[9px] font-mono">
        <span style={{ color: '#F97316' }}>Lagna: {chakra.lagnaChakra.referenceSign}</span>
        <span style={{ color: '#60A5FA' }}>Chandra: {chakra.chandraChakra.referenceSign}</span>
        <span style={{ color: '#F59E0B' }}>Surya: {chakra.suryaChakra.referenceSign}</span>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className={cn('border-b', isDark ? 'border-white/5 text-white/40' : 'border-slate-100 text-slate-500')}>
            <th className="px-2 py-1.5 text-left font-mono w-10">H</th>
            <th className="px-2 py-1.5 text-left font-mono">Sign</th>
            <th className="px-2 py-1.5 text-left" style={{ color: '#F97316' }}>Lagna</th>
            <th className="px-2 py-1.5 text-left" style={{ color: '#60A5FA' }}>Chandra</th>
            <th className="px-2 py-1.5 text-left" style={{ color: '#F59E0B' }}>Surya</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }, (_, i) => {
            const h = i + 1;
            const sign = RASHIS[(chakra.lagnaChakra.referenceSignIndex + h - 1) % 12];
            const isActive = h === activeHouse;
            return (
              <tr
                key={h}
                className={cn(
                  'border-b transition-colors',
                  isDark ? 'border-white/[0.03]' : 'border-slate-50',
                  isActive && (isDark ? 'bg-jyotish-gold/10' : 'bg-orange-50')
                )}
              >
                <td className={cn('px-2 py-1 font-mono font-bold', isActive && 'text-jyotish-gold')}>{h}</td>
                <td className={cn('px-2 py-1 font-mono', isDark ? 'text-white/50' : 'text-slate-500')}>{sign.slice(0, 3)}</td>
                <td className="px-2 py-1">{formatPlanetList(chakra.lagnaChakra.houses[h]?.planets ?? [])}</td>
                <td className="px-2 py-1">{formatPlanetList(chakra.chandraChakra.houses[h]?.planets ?? [])}</td>
                <td className="px-2 py-1">{formatPlanetList(chakra.suryaChakra.houses[h]?.planets ?? [])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

interface SudarshanaChakraPageProps {
  birthPositions: PlanetPosition[];
  birthTime: Date | null;
  birthFingerprint: string | null;
  user: User;
  userProfile: any;
  childProfiles: ChildProfile[];
  onClose: () => void;
}

const SudarshanaChakraPage: React.FC<SudarshanaChakraPageProps> = ({
  birthPositions,
  birthTime,
  birthFingerprint,
  user,
  userProfile,
  childProfiles,
  onClose,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [subjectProfileId, setSubjectProfileId] = React.useState<string | null>(null);
  const [profileSelectorOpen, setProfileSelectorOpen] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [subjectPositions, setSubjectPositions] = React.useState<PlanetPosition[] | null>(null);
  const profileSelectorRef = useRef<HTMLDivElement>(null);

  const [layerVisible, setLayerVisible] = React.useState<Record<LayerKey, boolean>>({
    lagnaChakra: true,
    chandraChakra: true,
    suryaChakra: true,
  });
  const [hoveredHouse, setHoveredHouse] = React.useState<number | null>(null);
  const [aiData, setAiData] = React.useState<SudarshanaChakraInterpretations | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [isReportCached, setIsReportCached] = React.useState(false);
  const [cacheWriteFailed, setCacheWriteFailed] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<string | null>('threefoldCore');
  const reportRequestIdRef = useRef(0);

  const activeChildProfile = subjectProfileId
    ? childProfiles.find(p => p.id === subjectProfileId) ?? null
    : null;

  // Close profile selector on outside click
  useEffect(() => {
    if (!profileSelectorOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileSelectorRef.current && !profileSelectorRef.current.contains(e.target as Node)) {
        setProfileSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileSelectorOpen]);

  // Load positions for child profile
  useEffect(() => {
    if (!subjectProfileId) {
      setSubjectPositions(null);
      return;
    }
    const profile = childProfiles.find(p => p.id === subjectProfileId);
    if (!profile) return;

    let cancelled = false;
    setIsLoadingProfile(true);
    const birthTimeObj = new Date(profile.birthTime);
    const { lat, lon } = profile;

    fetchPlanetPositions(birthTimeObj, lat, lon)
      .catch(() => calculatePositions(birthTimeObj, lat, lon))
      .then(pos => {
        if (!cancelled) {
          setSubjectPositions(pos);
          setIsLoadingProfile(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoadingProfile(false);
      });

    return () => { cancelled = true; };
  }, [subjectProfileId, childProfiles]);

  const resolvedPositions = subjectProfileId ? subjectPositions : birthPositions;
  const resolvedBirthTime = activeChildProfile
    ? new Date(activeChildProfile.birthTime)
    : birthTime;

  const subjectFingerprint = useMemo(() => {
    if (activeChildProfile) {
      return `${activeChildProfile.birthTime}_${activeChildProfile.lat.toFixed(3)}_${activeChildProfile.lon.toFixed(3)}`;
    }
    return birthFingerprint;
  }, [activeChildProfile, birthFingerprint]);

  const cacheDocId = subjectProfileId
    ? `sudarshana-chakra-${subjectProfileId}`
    : 'sudarshana-chakra';

  const currentAge = useMemo(() => {
    if (!resolvedBirthTime) return 0;
    return Math.max(0, differenceInYears(new Date(), resolvedBirthTime));
  }, [resolvedBirthTime]);

  const activeHouse = useMemo(() => calculateSudarshanaActiveHouse(currentAge), [currentAge]);

  const chakra = useMemo<SudarshanaChakraResult | null>(() => {
    if (!resolvedPositions) return null;
    try { return calculateSudarshanaChakra(resolvedPositions); }
    catch { return null; }
  }, [resolvedPositions]);

  const convergenceHouses = useMemo<Set<number>>(() => {
    const set = new Set<number>();
    if (!chakra) return set;
    for (let h = 1; h <= 12; h++) {
      const count = LAYER_CONFIG.filter(l => (chakra[l.key].houses[h]?.planets?.length ?? 0) > 0).length;
      if (count >= 2) set.add(h);
    }
    return set;
  }, [chakra]);

  const isChartLoading = subjectProfileId != null && (isLoadingProfile || !subjectPositions);

  // Clear displayed report when subject / birth fingerprint changes
  useEffect(() => {
    setAiData(null);
    setAiError(null);
    setIsReportCached(false);
    setCacheWriteFailed(false);
  }, [subjectFingerprint, cacheDocId]);

  const ensureSudarshanaReport = useCallback(async (options?: { force?: boolean }) => {
    if (!chakra || !user?.uid || !subjectFingerprint || !resolvedPositions) return;

    const requestId = ++reportRequestIdRef.current;
    const isCurrent = () => requestId === reportRequestIdRef.current;

    setIsAiLoading(true);
    setAiError(null);
    setIsReportCached(false);
    setCacheWriteFailed(false);

    try {
      const profile = {
        firstName: activeChildProfile?.name ?? userProfile?.firstName ?? userProfile?.displayName,
        gender: userProfile?.gender,
      };

      const { data, fromCache, saved } = await ensureReport<SudarshanaChakraInterpretations>({
        uid: user.uid,
        docId: cacheDocId,
        type: 'sudarshana-chakra',
        fingerprint: subjectFingerprint,
        force: options?.force,
        normalize: normalizeCachedSudarshanaInterpretation,
        generate: () => generateSudarshanaChakraInterpretation(
          chakra,
          profile,
          { currentAge, activeHouse, birthPositions: resolvedPositions }
        ),
      });

      if (!isCurrent()) return;

      setAiData(data);
      setIsReportCached(fromCache || saved);
      setCacheWriteFailed(!fromCache && !saved);
    } catch (err: any) {
      if (!isCurrent()) return;
      setAiError(err?.message || 'Failed to generate interpretation');
    } finally {
      if (isCurrent()) setIsAiLoading(false);
    }
  }, [
    chakra, user?.uid, subjectFingerprint, resolvedPositions, activeChildProfile,
    userProfile, currentAge, activeHouse, cacheDocId,
  ]);

  // Load from cache or generate once; only hits Gemini when cache miss or birth data changed
  useEffect(() => {
    if (!chakra || !user?.uid || !subjectFingerprint || isChartLoading) return;
    ensureSudarshanaReport();
  }, [chakra, user?.uid, subjectFingerprint, cacheDocId, isChartLoading, ensureSudarshanaReport]);

  const toggleLayer = (key: LayerKey) =>
    setLayerVisible(prev => ({ ...prev, [key]: !prev[key] }));

  const subjectName = activeChildProfile?.name ?? userProfile?.displayName ?? userProfile?.name ?? 'Your Chart';

  return (
    <div className={cn(
      'flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden font-sans selection:bg-jyotish-gold/30 transition-colors duration-500',
      isDark ? 'bg-[#050505] text-white' : 'bg-[#f0f0f0] text-slate-900'
    )}>
      {/* Header */}
      <div className={cn(
        'flex-shrink-0 z-40 px-4 py-3 lg:px-6 flex items-center gap-3 border-b backdrop-blur-xl',
        isDark ? 'border-jyotish-gold/10 bg-black/60' : 'border-slate-200 bg-white/80'
      )}>
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
        <div className="min-w-0">
          <h1 className={cn('text-base font-bold leading-none truncate', isDark ? 'text-white' : 'text-slate-900')}>
            Sudarshana Chakra
          </h1>
          <p className="text-[10px] uppercase tracking-widest font-mono text-jyotish-gold/60 mt-0.5">Three-Layer Life Wheel</p>
        </div>

        {childProfiles.length > 0 && (
          <div className="relative ml-auto" ref={profileSelectorRef}>
            <button
              onClick={() => setProfileSelectorOpen(s => !s)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] uppercase tracking-widest font-bold transition-all',
                isDark
                  ? 'bg-white/5 border-white/10 text-jyotish-gold hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
              aria-label="Switch analysis subject"
            >
              {isLoadingProfile ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Users className="w-3 h-3" />
              )}
              <span className="hidden sm:inline max-w-[120px] truncate">{subjectName}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', profileSelectorOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {profileSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    'absolute top-full mt-2 right-0 z-50 min-w-[180px] rounded-2xl border shadow-xl overflow-hidden',
                    isDark ? 'bg-[#0f0f1a] border-jyotish-gold/20' : 'bg-white border-slate-200 shadow-lg'
                  )}
                >
                  <div className={cn('px-3 py-2 text-[9px] uppercase tracking-widest font-mono border-b', isDark ? 'text-white/30 border-white/5' : 'text-slate-400 border-slate-100')}>
                    Analyze whose chart?
                  </div>
                  <button
                    onClick={() => { setSubjectProfileId(null); setProfileSelectorOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors text-left',
                      isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50',
                      !subjectProfileId ? 'text-jyotish-gold' : (isDark ? 'text-white/70' : 'text-slate-600')
                    )}
                  >
                    {!subjectProfileId ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate font-semibold">{userProfile?.displayName || userProfile?.name || 'Your Chart'}</span>
                    <span className={cn('text-[9px] ml-auto shrink-0', isDark ? 'text-white/30' : 'text-slate-400')}>You</span>
                  </button>
                  {childProfiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => { setSubjectProfileId(profile.id); setProfileSelectorOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors text-left',
                        isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50',
                        subjectProfileId === profile.id ? 'text-jyotish-gold' : (isDark ? 'text-white/70' : 'text-slate-600')
                      )}
                    >
                      {subjectProfileId === profile.id ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate font-semibold">{profile.name}</span>
                      <span className={cn('text-[9px] ml-auto shrink-0 truncate max-w-[60px]', isDark ? 'text-white/30' : 'text-slate-400')}>{profile.city}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 50/50 Split Body */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left — Chart */}
        <div className={cn(
          'lg:w-1/2 lg:flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r lg:overflow-y-auto',
          isDark ? 'border-white/5' : 'border-slate-200'
        )}>
          <div className="lg:flex-1 flex flex-col items-center justify-center p-4">
            {isChartLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-jyotish-gold animate-spin" />
                <p className={cn('text-sm', isDark ? 'text-white/40' : 'text-slate-500')}>Loading chart…</p>
              </div>
            ) : chakra ? (
              <div className="w-[min(85vw,280px)] lg:w-full lg:max-w-[min(92vw,480px)] aspect-square shrink-0 mx-auto">
                <SudarshanaWheel
                  chakra={chakra}
                  layerVisible={layerVisible}
                  hoveredHouse={hoveredHouse}
                  onHoverHouse={setHoveredHouse}
                  convergenceHouses={convergenceHouses}
                  activeHouse={activeHouse}
                />
              </div>
            ) : (
              <p className={cn('text-sm', isDark ? 'text-white/30' : 'text-slate-400')}>Requires birth chart data</p>
            )}
          </div>

          {chakra && (
            <>
              <div className={cn('mx-4 mb-3 rounded-xl border', isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-white')}>
                <div className="flex items-center justify-center gap-6 h-10 px-4">
                  {hoveredHouse ? (
                    <>
                      <span className="text-xs font-mono text-jyotish-gold font-bold">H{hoveredHouse}</span>
                      {LAYER_CONFIG.map(l => (
                        <div key={l.key} className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase" style={{ color: l.stroke }}>{l.label}</span>
                          <span className="text-sm">
                            {(chakra[l.key].houses[hoveredHouse]?.planets ?? []).length === 0
                              ? <span className="text-white/20 text-[10px]">—</span>
                              : (chakra[l.key].houses[hoveredHouse]?.planets ?? []).map(p => (
                                  <span key={p.name} style={{ color: PLANET_COLORS[p.name] || '#9CA3AF' }}>
                                    {PLANET_GLYPHS[p.name] || p.name.slice(0, 2)}
                                  </span>
                                ))}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Hover a house sector</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 px-4 mb-4 justify-center flex-wrap">
                {LAYER_CONFIG.map(l => {
                  const on = layerVisible[l.key];
                  return (
                    <button
                      key={l.key}
                      onClick={() => toggleLayer(l.key)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95',
                        on ? (isDark ? 'bg-white/5 border-white/20' : 'bg-white border-slate-200') : 'bg-transparent border-white/5 opacity-35'
                      )}
                      style={{ color: on ? l.stroke : '#666' }}
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.stroke, opacity: on ? 1 : 0.3 }} />
                      {l.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 mb-4 px-4 text-[9px] font-mono uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-jyotish-gold/50">
                  <span className="w-2 h-2 rounded-full bg-jyotish-gold/70 inline-block" /> Convergence
                </span>
                <span className="flex items-center gap-1.5 text-jyotish-gold">
                  <span className="w-2 h-2 rounded-sm bg-jyotish-gold/40 inline-block border border-jyotish-gold" /> Active H{activeHouse}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right — Data & AI */}
        <div className="lg:w-1/2 lg:flex-1 min-h-0 lg:overflow-y-auto p-4 space-y-4 pb-8">
          {chakra && (
            <>
              {/* Active year badge */}
              <div className={cn(
                'flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border',
                isDark ? 'bg-jyotish-gold/5 border-jyotish-gold/20' : 'bg-orange-50 border-orange-200'
              )}>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-jyotish-gold/60">Sudarshana Dasha</p>
                  <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    Age {currentAge} · Active House {activeHouse}
                  </p>
                </div>
                <div className={cn('text-[10px] font-mono', isDark ? 'text-white/40' : 'text-slate-500')}>
                  Lagna: {formatPlanetList(chakra.lagnaChakra.houses[activeHouse]?.planets ?? [])} ·
                  Chandra: {formatPlanetList(chakra.chandraChakra.houses[activeHouse]?.planets ?? [])} ·
                  Surya: {formatPlanetList(chakra.suryaChakra.houses[activeHouse]?.planets ?? [])}
                </div>
              </div>

              <PlanetsInHousesTable chakra={chakra} activeHouse={activeHouse} isDark={isDark} />
            </>
          )}

          {/* AI Panel */}
          <div className={cn(
            'rounded-2xl border overflow-hidden',
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
                  <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>Jyotish Gem Reading</p>
                  <p className="text-[10px] uppercase tracking-widest font-mono text-jyotish-gold/60 mt-0.5">Parashari Sudarshana Analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isReportCached && aiData && !isAiLoading && (
                  <span className={cn(
                    'text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-lg border',
                    isDark ? 'text-jyotish-gold/60 border-jyotish-gold/20 bg-jyotish-gold/5' : 'text-jyotish-gold border-orange-200 bg-orange-50'
                  )}>
                    Saved
                  </span>
                )}
                {cacheWriteFailed && aiData && !isAiLoading && (
                  <span
                    title="The reading could not be written to your account, so it will be regenerated on the next load. Check the browser console for details."
                    className={cn(
                      'text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-lg border',
                      isDark ? 'text-amber-400/70 border-amber-400/20 bg-amber-400/5' : 'text-amber-700 border-amber-200 bg-amber-50'
                    )}
                  >
                    Not saved
                  </span>
                )}
                {aiError && !isAiLoading && (
                  <button
                    onClick={() => ensureSudarshanaReport({ force: true })}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95',
                      'bg-jyotish-gold/20 text-jyotish-gold hover:bg-jyotish-gold/30 border border-jyotish-gold/20'
                    )}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
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

              {aiError && !isAiLoading && (
                <div className={cn(
                  'p-3 rounded-xl border text-xs mb-3',
                  isDark ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                )}>
                  {aiError}
                </div>
              )}

              {!aiData && !isAiLoading && !aiError && (
                <div className="py-8 text-center">
                  <CircleDot className="w-10 h-10 mx-auto mb-3 opacity-10" />
                  <p className={cn('text-sm', isDark ? 'text-white/30' : 'text-slate-400')}>
                    Preparing Sudarshana reading for {subjectName}…
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
      </div>
    </div>
  );
};

export default SudarshanaChakraPage;
