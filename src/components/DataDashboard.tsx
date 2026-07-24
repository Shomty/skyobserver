import React from 'react';
import { format, addDays, isWithinInterval, differenceInDays } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Type } from "@google/genai";
import { 
  Clock, Play, Pause, Rewind, FastForward, User as UserIcon, Save, MapPin, 
  LayoutGrid, Sparkles, Activity, Zap, CalendarDays, Sun, Grid, Layers,
  Info, Moon, CircleDot, ChevronRight, ChevronDown, ChevronUp, 
  CheckCircle2, Flame, List, Eye, Edit, BarChart3, Brain, Briefcase, HeartPulse, Compass, Loader2, Trash2, Shield, Crown, BookOpen, RefreshCw, History, ArrowRightLeft, Timer, Star, Check, Users, RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getOrdinal } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { Label, StatTile, TabGroup, type TabGroupItem } from './ui';
import { DASHBOARD_TABS } from '../lib/dashboardTabs';
import AIAssistant from './AIAssistant';
import { DateRangePicker } from './DateRangePicker';
import { db, updateDoc, doc } from '../firebase';
import { getCachedReport, saveAIReport, getPerAccountReport, savePerAccountReport } from '../services/aiReportService';
import { callGeminiProxy, getErrorMessage, withRetry } from '../lib/api-utils';
import { APIErrorMessage } from './APIErrorMessage';
import DivisionalCharts from './DivisionalCharts';
import { 
  PlanetPosition, TransitEvent, TransitPrediction, NatalComparisonResult, 
  PanchangData, findMuhurtaWindows, EventCategory, MuhurtaWindow, 
  Ashtakavarga, getTarabala, TarabalaResult, calculateDashaLevels, 
  getDeeptadiAwastha, getShayanadiAwastha, DashaPeriod, detectYogas, isConjunct,
  getDashaWarning, SpecialPointsResultV2, BhriguBinduResult, getDignityInterpretation,
  NAKSHATRA_DATA
} from '../vedic-utils';

// Fallback strings that indicate a failed AI call — never serve or save these as cached values
const AI_FALLBACK_STRINGS = new Set([
  "The cosmic resonance is currently shifting beyond precise description.",
  "Cosmic alignment unclear at this moment.",
  "Insight unavailable at the moment.",
  "Celestial connection returned no data",
]);
const isValidAiResponse = (value: any): boolean =>
  typeof value === 'string' && value.trim().length > 80 && !AI_FALLBACK_STRINGS.has(value.trim());

interface DataDashboardProps {
  activeTab: 'overview' | 'yogas' | 'transits' | 'natal' | 'upcoming' | 'panchang' | 'ashtakavarga' | 'muhurta' | 'dashas' | 'impacts' | 'blueprint' | 'rectify' | 'vargas';
  setActiveTab: (tab: 'overview' | 'yogas' | 'transits' | 'natal' | 'upcoming' | 'panchang' | 'ashtakavarga' | 'muhurta' | 'dashas' | 'impacts' | 'blueprint' | 'rectify' | 'vargas') => void;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  currentTime: Date;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  adjustTime: (days: number) => void;
  user: any;
  userProfile: any;
  setUserProfile: any;
  birthTime: Date | null;
  setBirthTime: (date: Date | null) => void;
  birthCity: string;
  setBirthCity: (city: string) => void;
  saveBirthDetails: () => void;
  isBirthMode: boolean;
  setIsBirthMode: (mode: boolean) => void;
  editingChartId: string | null;
  setEditingChartId: (id: string | null) => void;
  positions: PlanetPosition[];
  comparisonPositions: PlanetPosition[] | null;
  selectedZodiac: number | null;
  setSelectedZodiac: (zodiac: number | null) => void;
  selectedPlanet: string | null;
  setSelectedPlanet: (name: string | null) => void;
  activePlanet: PlanetPosition | undefined;
  activePlanetDrishti: any;
  isConjunctWithNatal: boolean;
  natalPlanet: PlanetPosition | undefined;
  yogas: any[];
  transits: TransitEvent[];
  upcomingTransits: TransitPrediction[] | null;
  natalComparisons: NatalComparisonResult[];
  panchang: PanchangData | null;
  birthPanchang: PanchangData | null;
  sunTimes: any;
  ashtakavarga: any;
  viewMode: 'transit' | 'natal';
  handleAutoSelectNatal: () => void;
  switchToTransitMode: () => void;
  interpretTransit: (transit: TransitEvent) => void;
  interpretPrediction: (prediction: TransitPrediction) => void;
  isYogasExpanded: boolean;
  setIsYogasExpanded: (expanded: boolean) => void;
  isTransitsExpanded: boolean;
  setIsTransitsExpanded: (expanded: boolean) => void;
  isUpcomingTransitsExpanded: boolean;
  setIsUpcomingTransitsExpanded: (expanded: boolean) => void;
  setMainTab: (tab: 'sky' | 'stats' | 'chart' | 'profile' | 'archives' | 'report' | 'profiles') => void;
  location: { lat: number; lon: number } | null;
  birthPositions: PlanetPosition[] | null;
  rectifyTime: Date | null;
  setRectifyTime: (date: Date | null) => void;
  isRectifying: boolean;
  setIsRectifying: (is: boolean) => void;
  rectifiedPositions: PlanetPosition[] | null;
  birthSpecialPoints: SpecialPointsResultV2 | null;
  natalAshtakavarga: Ashtakavarga | null;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  birthFingerprint: string | null;
  // Child profiles
  childProfiles?: import('../pages/ProfilesPage').ChildProfile[];
  activeChildProfileId?: string | null;
  onLoadChildProfile?: (id: string) => Promise<void>;
  onClearChildProfile?: () => Promise<void>;
  onNavigateToProfiles?: () => void;
}

const PLANET_GLYPHS: Record<string, string> = {
  "Sun": "☉",
  "Moon": "☽",
  "Mars": "♂",
  "Mercury": "☿",
  "Jupiter": "♃",
  "Venus": "♀",
  "Saturn": "♄",
  "Rahu": "☊",
  "Ketu": "☋",
  "Ascendant": "ASC",
  "Lagna": "ASC"
};

const PlanetGlyph: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const glyph = PLANET_GLYPHS[name] || "";
  if (glyph === "ASC") return <span className={cn("text-[10px] font-mono font-bold opacity-50", className)}>{glyph}</span>;
  return <span className={cn("text-lg leading-none", className)}>{glyph}</span>;
};

const BhriguBinduAnalysis: React.FC<{ 
  bhriguBindu: BhriguBinduResult; 
  currentPositions: PlanetPosition[]; 
}> = ({ bhriguBindu, currentPositions }) => {
  const { theme } = useTheme();
  const RASHIS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  const bbRashi = RASHIS[bhriguBindu.signNumber - 1];
  
  // Find transiting planets aspecting or conjuncting BB
  const transits = currentPositions.filter(p => {
    if (p.name === "Bhrigu Bindu" || p.name === "Ascendant") return false;
    
    // Conjunction (within 5 degrees)
    const diffLong = Math.abs(p.siderealLongitude - bhriguBindu.absoluteLongitude);
    const directHit = diffLong < 5 || diffLong > 355;
    if (directHit) return true;
    
    // Major aspects (7th, 5th/9th for Jupiter/Nodes, 3rd/10th for Saturn, 4th/8th for Mars)
    const diff = (p.siderealLongitude - bhriguBindu.absoluteLongitude + 360) % 360;
    const houseDiff = Math.floor(diff / 30) + 1;
    
    if (houseDiff === 7) return true; // Opposition
    
    if (["Jupiter", "Rahu", "Ketu"].includes(p.name) && (houseDiff === 5 || houseDiff === 9)) return true;
    if (p.name === "Saturn" && (houseDiff === 3 || houseDiff === 10)) return true;
    if (p.name === "Mars" && (houseDiff === 4 || houseDiff === 8)) return true;
    
    return false;
  });

  const getInterpretation = (p: PlanetPosition) => {
    const diffLong = Math.abs(p.siderealLongitude - bhriguBindu.absoluteLongitude);
    const isConjunct = diffLong < 5 || diffLong > 355;
    
    if (p.name === "Jupiter") return isConjunct ? "Major expansion of destiny. Divine grace is supercharging your path." : "Graceful alignment. Opportunities for spiritual and material growth are manifesting.";
    if (p.name === "Saturn") return isConjunct ? "Karmic culmination. High responsibility and structural shifts in your destiny." : "Foundational testing. Discipline is required to reach your higher calling.";
    if (p.name === "Rahu") return isConjunct ? "Destiny trigger! Sudden, intense shifts. Be wary of illusions while chasing your soul's craving." : "Psychic activation. Unconventional paths are opening up.";
    if (p.name === "Ketu") return isConjunct ? "Soul release. Letting go of old karmic debts to clear the path forward." : "Intuitive clearing. Internal shifts are preparing you for a new cycle.";
    if (p.name === "Sun") return "Ego-destiny alignment. Clarity on your purpose and recognition of your path.";
    if (p.name === "Mars") return "Dynamic drive. Ambition and energy to execute your soul's mission.";
    if (p.name === "Venus") return "Graceful manifestation. Sweetness and harmony in your karmic journey.";
    if (p.name === "Mercury") return "Intellectual clarity. Important communications or ideas regarding your life path.";
    return "Subtle energy shift affecting your destiny point.";
  };

  return (
    <div className={cn("p-6 rounded-3xl border relative overflow-hidden transition-all", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <CircleDot className="w-16 h-16" />
      </div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-500/10 text-orange-500 shadow-lg shadow-orange-500/5")}>
          <CircleDot className="w-6 h-6" />
        </div>
        <div>
          <h3 className={cn("text-lg font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Bhrigu Bindu (Destiny Point)</h3>
          <p className={cn("text-[10px] uppercase tracking-widest font-mono text-jyotish-gold/60 mt-0.5")}>The mathematical intersection of Rahu & Moon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8 relative z-10">
        <div className={cn("p-5 rounded-2xl border flex flex-col justify-between", theme === 'dark' ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200")}>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono opacity-40 mb-4 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Calculation Details
            </div>
            <div className="space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 flex items-center gap-1.5"><PlanetGlyph name="Moon" className="text-sm scale-75 opacity-70" /> Natal Moon</span>
                <span className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>{(bhriguBindu.moonLongitude % 360).toFixed(2)}°</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 flex items-center gap-1.5"><PlanetGlyph name="Rahu" className="text-sm scale-75 opacity-70" /> Natal Rahu</span>
                <span className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>{(bhriguBindu.rahuLongitude % 360).toFixed(2)}°</span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="flex justify-between items-center text-[13px] font-bold">
                <span className="text-jyotish-gold">Midpoint (Long Arc)</span>
                <span className="text-jyotish-gold">{bhriguBindu.degree.toFixed(2)}° {bbRashi}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("p-5 rounded-2xl border", theme === 'dark' ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200")}>
          <div className="text-[10px] uppercase tracking-widest font-mono opacity-40 mb-3 flex items-center gap-1.5">
            <Brain className="w-3 h-3" /> Soul Interpretation
          </div>
          <p className={cn("text-[11px] leading-relaxed italic font-serif", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
            "Bhrigu Bindu marks the specific zodiacal degree where your emotional self (Moon) perfectly balances with your soul's karmic evolution (Rahu). Transits over this point essentially act as 'destiny switches'—opening doors to events that feel fated or profoundly purposeful."
          </p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="text-[10px] uppercase tracking-widest font-mono opacity-40 flex items-center gap-2 px-1">
          <Activity className="w-3 h-3" />
          Active Destiny Impacts (Current Sky)
        </div>
        
        {transits.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {transits.map((p, i) => (
              <div key={i} className={cn("p-4 rounded-2xl border flex items-start gap-4 transition-all hover:bg-white/[0.03] group", theme === 'dark' ? "border-white/5 bg-white/[0.01]" : "border-slate-100 bg-white shadow-sm")}>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", theme === 'dark' ? "bg-white/5 text-white" : "bg-slate-50 text-slate-800")}>
                   <PlanetGlyph name={p.name} className="text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={cn("text-sm font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                      {p.name} Influence
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-mono opacity-40">
                      <span className="animate-pulse text-jyotish-gold">●</span> TRANSIT
                    </div>
                  </div>
                  <p className={cn("text-[11px] leading-relaxed", theme === 'dark' ? "text-white/70" : "text-slate-600")}>
                    {getInterpretation(p)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn("text-center py-10 rounded-3xl border-2 border-dashed opacity-30 flex flex-col items-center gap-3", theme === 'dark' ? "border-white/10" : "border-slate-200")}>
            <Sparkles className="w-5 h-5 opacity-50" />
            <p className="text-xs italic font-medium px-10">No major planetary transits are directly triggering your Destiny Point currently. The universe is allowing space for internal integration.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NatalDignityAnalysis: React.FC<{ 
  positions: PlanetPosition[]; 
}> = ({ positions }) => {
  const { theme } = useTheme();
  const filteredPositions = positions.filter(p => !["Ascendant", "TrueNode", "Bhrigu Bindu"].includes(p.name));

  return (
    <div className={cn("p-6 rounded-3xl border relative overflow-hidden transition-all", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/5")}>
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className={cn("text-lg font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Birth Dignity Analysis</h3>
          <p className={cn("text-[10px] uppercase tracking-widest font-mono text-emerald-500/60 mt-0.5")}>Planetary Strength & Comfort in Rashi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPositions.map((p, i) => {
          const interp = getDignityInterpretation(p.name, p.dignity || "", p.rashi);
          const hasSignificantDignity = !!interp;
          
          return (
            <div 
              key={i} 
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col gap-2",
                theme === 'dark' ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200",
                hasSignificantDignity && interp.type === 'positive' && "ring-1 ring-emerald-500/30 bg-emerald-500/5",
                hasSignificantDignity && interp.type === 'negative' && "ring-1 ring-rose-500/30 bg-rose-500/5"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-white/5", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
                    <PlanetGlyph name={p.name} className="text-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-xs font-bold font-serif", theme === 'dark' ? "text-white" : "text-slate-900")}>{p.name}</span>
                    <span className={cn("text-[9px] uppercase tracking-tighter opacity-50 font-mono")}>{p.rashi}</span>
                  </div>
                </div>
                <div className="text-right">
                  {p.dignity ? (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                      p.dignity === 'Exalted' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      p.dignity === 'Debilitated' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                      p.dignity === 'Own Sign' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-white/5 text-white/40 border-white/10"
                    )}>
                      {p.dignity}
                    </span>
                  ) : (
                    <span className="text-[9px] opacity-20 font-mono uppercase">Neutral</span>
                  )}
                </div>
              </div>

              {hasSignificantDignity && (
                <p className={cn("text-[10px] leading-relaxed italic mt-1", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                  {interp.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DataDashboardInner: React.FC<DataDashboardProps> = (props) => {
  const { theme } = useTheme();
  const {
    activeTab, setActiveTab, isLive, setIsLive, currentTime, handleDateChange, adjustTime,
    user, userProfile, setUserProfile, birthTime, setBirthTime, birthCity, setBirthCity, saveBirthDetails,
    isBirthMode, setIsBirthMode, editingChartId, setEditingChartId, positions, comparisonPositions, selectedZodiac, setSelectedZodiac,
    selectedPlanet, setSelectedPlanet, activePlanet, activePlanetDrishti, isConjunctWithNatal, natalPlanet,
    yogas, transits, upcomingTransits, natalComparisons, panchang, birthPanchang, sunTimes, ashtakavarga, viewMode, handleAutoSelectNatal, switchToTransitMode,
    interpretTransit, interpretPrediction, isYogasExpanded, setIsYogasExpanded, isTransitsExpanded, setIsTransitsExpanded,
    isUpcomingTransitsExpanded, setIsUpcomingTransitsExpanded, setMainTab, location, birthPositions, 
    rectifyTime, setRectifyTime, isRectifying, setIsRectifying, rectifiedPositions,
    birthSpecialPoints, natalAshtakavarga,
    dateRange, setDateRange, birthFingerprint,
    childProfiles, activeChildProfileId, onLoadChildProfile, onClearChildProfile, onNavigateToProfiles
  } = props;

  const RASHIS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  const [selectedBavPlanet, setSelectedBavPlanet] = React.useState<string>("Sun");
  const [ashtakavargaMode, setAshtakavargaMode] = React.useState<'transit' | 'natal'>('transit');
  const [muhurtaEventType, setMuhurtaEventType] = React.useState<EventCategory>('GENERAL');
  const [muhurtaDays, setMuhurtaDays] = React.useState<number>(30);
  const [isMuhurtaCalculating, setIsMuhurtaCalculating] = React.useState(false);

  const currentDashas = React.useMemo(() => {
    if (!birthTime || !birthPositions) return null;
    const moon = birthPositions.find(p => p.name === 'Moon');
    if (!moon) return null;
    return calculateDashaLevels(birthTime, moon.siderealLongitude, currentTime);
  }, [birthTime, birthPositions, currentTime]);

  const currentTarabala = React.useMemo(() => {
    if (!birthPositions || !panchang) return null;
    const birthMoon = birthPositions.find(p => p.name === "Moon");
    if (!birthMoon) return null;
    return getTarabala(birthMoon.nakshatra, panchang.nakshatra.name);
  }, [birthPositions, panchang]);

  const natalYogas = React.useMemo(() => {
    if (!birthPositions) return [];
    return detectYogas(birthPositions);
  }, [birthPositions]);

  const [aiInsights, setAiInsights] = React.useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [lastAiFetchTime, setLastAiFetchTime] = React.useState<number>(0);

  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [yogaInterpretations, setYogaInterpretations] = React.useState<Record<string, string>>({});
  const [isYogaAiLoading, setIsYogaAiLoading] = React.useState<string | null>(null);
  const [muhurtaInterpretations, setMuhurtaInterpretations] = React.useState<Record<string, string>>({});
  const [isMuhurtaAiLoading, setIsMuhurtaAiLoading] = React.useState<string | null>(null);
  const [transitImpactInsight, setTransitImpactInsight] = React.useState<string | null>(null);
  const [isTransitAiLoading, setIsTransitAiLoading] = React.useState(false);
  const [dashboardError, setDashboardError] = React.useState<{ error: any; title: string; retry?: () => void } | null>(null);

  // Soul Profile state
  const [soulProfile, setSoulProfile] = React.useState<{ gifts: string; challenges: string; shadowWork: string; spirituality: string; career: string; love: string; health: string } | null>(null);
  const [isSoulProfileLoading, setIsSoulProfileLoading] = React.useState(false);
  const [soulProfileError, setSoulProfileError] = React.useState<string | null>(null);

  // Auto-load Soul Profile from cache when profile or birth details change
  React.useEffect(() => {
    if (!user || !birthFingerprint) return;
    let cancelled = false;
    const docId = `soul_profile_${activeChildProfileId || 'self'}`;
    setSoulProfile(null);
    setSoulProfileError(null);
    getPerAccountReport(user.uid, docId).then(cached => {
      if (cancelled) return;
      if (cached && cached.fingerprint === birthFingerprint && cached.data?.gifts) {
        setSoulProfile(cached.data);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.uid, activeChildProfileId, birthFingerprint]);
  const [showAllYogas, setShowAllYogas] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!showProfileDropdown) return;
    const handler = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfileDropdown]);

  const generateTransitImpactInsight = async () => {
    if (isTransitAiLoading || !birthPositions || !positions || !user) return;

    // Check Cache
    const dateStr = currentTime.toDateString();
    const fp = birthFingerprint || 'nob';
    const cacheKey = `transit-impact-${user.uid}-${dateStr}-${fp}`;

    try {
      const cached = await getCachedReport(user.uid, 'transit-impact', cacheKey);
      if (cached && isValidAiResponse(cached)) {
        setTransitImpactInsight(cached);
        return;
      }
    } catch (e) {
      console.warn("Transit Impact cache fetch failed", e);
    }

    setIsTransitAiLoading(true);
    setDashboardError(null);
    try {
      const prompt = `As a master Jyotish astrologer, provide a personalized insight into how the current planetary transits are impacting the user's natal birth chart.
      
      User's Natal Positions: ${birthPositions.map(p => `${p.name} in ${p.rashi} at ${p.degree}°${p.minute}'`).join(', ')}.
      Current Transit Positions: ${positions.map(p => `${p.name} in ${p.rashi} at ${p.degree}°${p.minute}'`).join(', ')}.
      
      Analyze technical relationships (cross-chart aspects, conjunctions) between transiting planets and natal planets. 
      Focus on the 2nd most significant impacts currently affecting their lives.
      Provide realistic guidance on areas of opportunity and caution.
      Keep it high-vibration, mystical yet grounded. Max 4 sentences. Plain text only.`;

      const impactValue = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        }
      }) || "The cosmic resonance is currently shifting beyond precise description.";
      setTransitImpactInsight(impactValue);
      if (isValidAiResponse(impactValue)) {
        await saveAIReport(user.uid, 'transit-impact', cacheKey, impactValue, 24);
      }
    } catch (error) {
      console.error("Transit Insight Error:", error);
      setDashboardError({
        error: error,
        title: "Celestial Insight Failed",
        retry: generateTransitImpactInsight
      });
    } finally {
      setIsTransitAiLoading(false);
    }
  };

  const generateSoulProfile = async () => {
    if (!birthPositions || !user) return;
    setIsSoulProfileLoading(true);
    setSoulProfileError(null);

    const fp = birthFingerprint || 'nob';
    // Fixed doc ID per account+profile — no fingerprint in key so there is always exactly one doc
    const docId = `soul_profile_${activeChildProfileId || 'self'}`;

    // Check cache — valid only if fingerprint matches (birth details unchanged)
    try {
      const cached = await getPerAccountReport(user.uid, docId);
      if (cached && cached.fingerprint === fp && cached.data?.gifts) {
        setSoulProfile(cached.data);
        setIsSoulProfileLoading(false);
        return;
      }
    } catch {}

    try {
      const moonPos = birthPositions.find(p => p.name === 'Moon');
      const ascPos = birthPositions.find(p => p.name === 'Ascendant');
      const yogaNames = natalYogas.slice(0, 6).map(y => y.name).join(', ');

      const prompt = `You are a master Vedic astrologer. Analyze this birth chart and generate a Soul Profile as structured JSON.

Birth Chart:
${birthPositions.filter(p => p.name !== 'Ascendant').map(p => `${p.name}: ${p.rashi} (House ${p.house}), Nakshatra: ${p.nakshatra}, Dignity: ${p.dignity || 'normal'}${p.isRetrograde ? ' R' : ''}`).join('\n')}
Ascendant: ${ascPos?.rashi || 'unknown'}
Moon Nakshatra: ${moonPos?.nakshatra || 'unknown'}
Key Yogas: ${yogaNames || 'none detected'}

Provide a Soul Profile with exactly these 7 fields. Each field should be 4-6 sentences of meaningful, specific astrological insight.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "gifts": "...",
  "challenges": "...",
  "shadowWork": "...",
  "spirituality": "...",
  "career": "...",
  "love": "...",
  "health": "..."
}`;

      const raw = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.75 }
      });

      let jsonStr = (raw || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(jsonStr);
      if (parsed.gifts) {
        setSoulProfile(parsed);
        // Upsert: one doc per profile, fingerprinted — auto-invalidates on birth detail change
        await savePerAccountReport(user.uid, docId, parsed, fp);
      }
    } catch (err) {
      setSoulProfileError('Could not generate Soul Profile. Please try again.');
    } finally {
      setIsSoulProfileLoading(false);
    }
  };


  const generateMuhurtaInterpretation = async (window: MuhurtaWindow) => {
    const key = window.start.toISOString();
    if (isMuhurtaAiLoading || muhurtaInterpretations[key] || !currentDashas || !user) return;

    // Check Cache
    const fp = birthFingerprint || 'nob';
    const cacheKey = `muhurta-interp-${user.uid}-${fp}-${key}`;
    try {
      const cached = await getCachedReport(user.uid, 'muhurta-analysis', cacheKey);
      if (cached && isValidAiResponse(cached)) {
        setMuhurtaInterpretations(prev => ({ ...prev, [key]: cached }));
        return;
      }
    } catch (e) {
      console.warn("Muhurta cache fetch failed", e);
    }

    setIsMuhurtaAiLoading(key);
    setDashboardError(null);
    try {
      const currentDasha = currentDashas[0];
      const antardasha = currentDashas[1];

      let prompt = `As a master Jyotish expert, provide a profound interpretation for this auspicious Muhurta window.
      Event Category: ${muhurtaEventType}
      Window: ${format(window.start, 'MMM d, h:mm a')} to ${format(window.end, 'h:mm a')}
      Initial Scoring Factors: ${window.reasons.join(', ')}
      Vargottama Highlights: ${window.vargottamaLagna ? 'Lagna (Ascendant) is Vargottama' : ''} ${window.vargottamaMoon ? 'Moon is Vargottama' : ''}
      
      CRITICAL CONTEXT (User's Current Dasha): ${currentDasha.lord}-${antardasha.lord} period.
      
      Deliver the following sections:
      1. THE "WHY" (Qualitative Translation): Explain in 2-3 sentences why this time carries specific cosmic weight for the ${muhurtaEventType}.
      2. DASHA CONTEXT WARNING: Provide a specific note based on their ${currentDasha.lord}-${antardasha.lord} period to manage expectations (e.g., if it's a Saturn period, suggest patience).
      
      Keep it high-vibration, mystical yet technically grounded. Plain text only. No markdown headers.`;

      const interpretation = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        }
      }) || "Cosmic alignment unclear at this moment.";
      setMuhurtaInterpretations(prev => ({
        ...prev,
        [key]: interpretation
      }));
      
      // Save to cache (30 days)
      if (isValidAiResponse(interpretation)) {
        await saveAIReport(user.uid, 'muhurta-analysis', cacheKey, interpretation, 720);
      }
    } catch (error) {
      console.error("Muhurta AI Error:", error);
      setDashboardError({
        error: error,
        title: "Muhurta Interpretation Failed",
        retry: () => generateMuhurtaInterpretation(window)
      });
    } finally {
      setIsMuhurtaAiLoading(null);
    }
  };

  const generateYogaInterpretation = async (yogaName: string, yogaDesc: string) => {
    if (isYogaAiLoading || yogaInterpretations[yogaName] || !user) return;

    // Check Cache
    const cacheKey = `yoga-interp-${yogaName.replace(/\s+/g, '-').toLowerCase()}`;
    try {
      const cached = await getCachedReport(user.uid, 'yoga-interpretation', cacheKey);
      if (cached && isValidAiResponse(cached)) {
        setYogaInterpretations(prev => ({ ...prev, [yogaName]: cached }));
        return;
      }
    } catch (e) {
      console.warn("Yoga cache fetch failed", e);
    }

    setIsYogaAiLoading(yogaName);
    setDashboardError(null);
    try {
      const prompt = `As a Jyotish master, explain the deeper spiritual and practical significance of the ${yogaName} yoga. 
      Description: ${yogaDesc}. 
      Focus on how it manifests in a person's life, its karmic roots, and potential remedies or ways to enhance its positive effects. 
      Keep the tone enlightened, compassionate, and precise. Max 3 sentences. Do not use complex formatting, just plain text.`;

      const interpretation = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40
        }
      }) || "Insight unavailable at the moment.";
      setYogaInterpretations(prev => ({
        ...prev,
        [yogaName]: interpretation
      }));
      
      // Save to cache (30 days TTL for yoga descriptions)
      if (isValidAiResponse(interpretation)) {
        await saveAIReport(user.uid, 'yoga-interpretation', cacheKey, interpretation, 720);
      }
    } catch (error) {
      console.error("Yoga AI Error:", error);
      setDashboardError({
        error: error,
        title: "Yoga Interpretation Failed",
        retry: () => generateYogaInterpretation(yogaName, yogaDesc)
      });
    } finally {
      setIsYogaAiLoading(null);
    }
  };

  const [transitPlanetFilter, setTransitPlanetFilter] = React.useState<string>('All');
  const [transitTypeFilter, setTransitTypeFilter] = React.useState<string>('All');
  const [natalTransitPlanetFilter, setNatalTransitPlanetFilter] = React.useState<string>('All');
  const [natalTransitIntensityFilter, setNatalTransitIntensityFilter] = React.useState<string>('All');
  const [natalTransitCategoryFilter, setNatalTransitCategoryFilter] = React.useState<string>('All');
  const [upcomingPlanetFilter, setUpcomingPlanetFilter] = React.useState<string>('All');
  const [upcomingTypeFilter, setUpcomingTypeFilter] = React.useState<string>('All');
  const [upcomingTimeframeFilter, setUpcomingTimeframeFilter] = React.useState<string>('30');

  const [citySuggestions, setCitySuggestions] = React.useState<any[]>([]);
  const [isCitySearching, setIsCitySearching] = React.useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = React.useState(false);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (birthCity.length < 3) {
        setCitySuggestions([]);
        return;
      }

      setIsCitySearching(true);
      try {
        // 1. Try proxy first
        let res = await withRetry(() => fetch(`/api/geocode?name=${encodeURIComponent(birthCity)}`));

        // 2. Fallback to direct if proxy fails
        if (!res.ok) {
          res = await withRetry(() => fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(birthCity)}&count=5&language=en&format=json`));
        }

        if (res.ok) {
          const data = await res.json();
          if (data && data.results) {
            setCitySuggestions(data.results);
            setShowCitySuggestions(true);
          }
        }
      } catch (e) {
        console.error("Suggestion fetch failed", e);
      } finally {
        setIsCitySearching(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [birthCity]);

  const generateAiInsights = async () => {
    if (!birthPositions || !panchang || !currentTarabala || !positions || isAiLoading || !user) return;
    
    // Check Firestore cache first
    const dateStr = currentTime.toDateString();
    const fp = birthFingerprint || 'nob';
    const cacheKey = `daily-insights-${user.uid}-${dateStr}-${fp}`;
    
    try {
      const cached = await getCachedReport(user.uid, 'daily-insights', cacheKey);
      if (Array.isArray(cached) && cached.length > 0) {
        setAiInsights(cached);
        return;
      }
    } catch (e) {
      console.warn("Cache fetch failed, proceeding with generation", e);
    }

    setIsAiLoading(true);
    setDashboardError(null);
    try {
      const dataContext = {
        panchang: {
          tithi: panchang.tithi.name,
          vara: panchang.vara,
          nakshatra: panchang.nakshatra.name,
          yoga: panchang.yoga.name,
          karana: panchang.karana.name
        },
        tarabala: {
          name: currentTarabala.name,
          quality: currentTarabala.quality,
          meaning: currentTarabala.meaning
        },
        dashas: currentDashas?.map(d => `${d.level}: ${d.lord}`).join(', '),
        transits: positions.map(p => `${p.name} in ${p.rashi} (${p.nakshatra}, ${p.degree}°)`),
        natalYogas: natalYogas.map(y => y.name),
        bhriguBindu: positions.find(p => p.name === "Bhrigu Bindu")?.rashi
      };

      const prompt = `As a world-class Jyotish expert following Parashara's wisdom, provide 5 unique, high-quality daily insights based on this data: ${JSON.stringify(dataContext)}. 
      Each insight should be profound, actionable, and specific to the cosmic alignment.
      Topics: 
      1. Mind & Emotions (Lunar focus, Tarabala)
      2. Career & Purpose (Sun, Dasha, 10th house energy)
      3. Health & Vitality (Sun, Vara, physical strength)
      4. Spirituality & Growth (Jupiter, Yoga, inner path)
      5. Destiny & Karma (Bhrigu Bindu, Rahu/Ketu nodes)
      
      Return a JSON array of objects with: topic, content, iconName (one of: Brain, Briefcase, HeartPulse, Compass, CircleDot), color (Tailwind text color), bg (Tailwind bg color).
      Make the content poetic yet practical. Avoid generic advice.`;

      const responseText = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                content: { type: Type.STRING },
                iconName: { type: Type.STRING },
                color: { type: Type.STRING },
                bg: { type: Type.STRING }
              },
              required: ["topic", "content", "iconName", "color", "bg"]
            }
          }
        }
      });
      if (!responseText) throw new Error("Celestial connection returned no data");
      const result = JSON.parse(responseText);
      setAiInsights(result);
      
      // Save to cache (24h TTL)
      if (Array.isArray(result) && result.length > 0) {
        await saveAIReport(user.uid, 'daily-insights', cacheKey, result, 24);
      }
      setLastAiFetchTime(Date.now());
    } catch (error) {
      console.error("AI Insight Error:", error);
      setDashboardError({
        error: error,
        title: "Daily Insights Failed",
        retry: generateAiInsights
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'overview' && isBirthMode) {
      generateAiInsights();
    }
  }, [activeTab, isBirthMode, currentTime.toDateString()]);

  const getIconComponent = (name: string) => {
    const icons: any = { Brain, Briefcase, HeartPulse, Compass, CircleDot };
    return icons[name] || Sparkles;
  };

  const deleteChart = async (chartId: string) => {
    if (!user || !userProfile?.savedCharts) return;
    
    try {
      const updatedCharts = userProfile.savedCharts.filter((c: any) => c.id !== chartId);
      await updateDoc(doc(db, 'users', user.uid), {
        savedCharts: updatedCharts
      });
      setUserProfile({
        ...userProfile,
        savedCharts: updatedCharts
      });
      if (editingChartId === chartId) {
        setEditingChartId(null);
      }
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting chart:", error);
    }
  };

  const currentAshtakavarga = ashtakavargaMode === 'natal' && natalAshtakavarga ? natalAshtakavarga : ashtakavarga;

  const [muhurtaResults, setMuhurtaResults] = React.useState<MuhurtaWindow[] | null>(null);

  // Reset results whenever the user changes search parameters so stale data is not shown
  React.useEffect(() => {
    setMuhurtaResults(null);
    setIsMuhurtaCalculating(false);
  }, [muhurtaDays, muhurtaEventType, dateRange]);

  const handleCalculateMuhurta = React.useCallback(() => {
    if (!birthPositions || !location || !currentDashas) return;
    setIsMuhurtaCalculating(true);
    setMuhurtaResults(null);
    // Defer one tick so the spinner renders before the synchronous calculation blocks the thread
    setTimeout(() => {
      try {
        const start = muhurtaDays === -1 ? dateRange.from : currentTime;
        const end = muhurtaDays === -1
          ? dateRange.to
          : new Date(currentTime.getTime() + muhurtaDays * 24 * 60 * 60 * 1000);
        const dashaStr = currentDashas.length > 0 ? `${currentDashas[0].lord}/${currentDashas[1].lord}` : "";
        const results = findMuhurtaWindows(birthPositions, start, end, muhurtaEventType, location.lat, location.lon, dashaStr);
        setMuhurtaResults(results);
      } finally {
        setIsMuhurtaCalculating(false);
      }
    }, 50);
  }, [birthPositions, location, currentDashas, muhurtaDays, dateRange, currentTime, muhurtaEventType]);

  const savData = React.useMemo(() => {
    if (!currentAshtakavarga) return [];
    
    const benefics = ["Moon", "Mercury", "Jupiter", "Venus"];
    const malefics = ["Sun", "Mars", "Saturn"];
    
    return RASHIS.map((rashi, i) => {
      let beneficCount = 0;
      let maleficCount = 0;
      
      benefics.forEach(p => {
        if (currentAshtakavarga.bav[p]) beneficCount += currentAshtakavarga.bav[p][i];
      });
      malefics.forEach(p => {
        if (currentAshtakavarga.bav[p]) maleficCount += currentAshtakavarga.bav[p][i];
      });

      return {
        name: rashi.substring(0, 3),
        fullName: rashi,
        score: currentAshtakavarga.sav[i],
        beneficCount,
        maleficCount,
        color: currentAshtakavarga.sav[i] >= 30 ? '#10B981' : currentAshtakavarga.sav[i] < 25 ? '#EF4444' : '#F59E0B'
      };
    });
  }, [currentAshtakavarga]);

  const bavData = React.useMemo(() => {
    if (!currentAshtakavarga || !currentAshtakavarga.bav[selectedBavPlanet]) return [];
    return RASHIS.map((rashi, i) => ({
      name: rashi.substring(0, 3),
      fullName: rashi,
      score: currentAshtakavarga.bav[selectedBavPlanet][i]
    }));
  }, [currentAshtakavarga, selectedBavPlanet]);

  const getPlanetKeywords = (planet: string) => {
    const keywords: Record<string, string> = {
      Sun: "authority, career, soul, and vitality",
      Moon: "emotions, mental peace, home, and changes",
      Mars: "energy, courage, property, and overcoming obstacles",
      Mercury: "intellect, communication, business, and learning",
      Jupiter: "expansion, wisdom, wealth, and luck",
      Venus: "relationships, luxury, arts, and harmony",
      Saturn: "discipline, hard work, structure, and karma",
      Rahu: "ambition, sudden changes, foreign elements, and material desires",
      Ketu: "spirituality, detachment, sudden endings, and liberation"
    };
    return keywords[planet] || "various life aspects";
  };

  const getDashaLordDetails = (lordName: string) => {
    if (!birthPositions) return null;
    const planet = birthPositions.find(p => p.name === lordName);
    if (!planet) return null;
    
    const ascendant = birthPositions.find(p => p.name === 'Ascendant');
    const ascDegree = ascendant ? ascendant.siderealLongitude : 0;

    const deeptadi = getDeeptadiAwastha(planet.name, planet.rashi);
    const shayanadi = getShayanadiAwastha(planet.siderealLongitude, ascDegree);
    
    let strength = "Moderate";
    if (deeptadi.includes("Exalted") || deeptadi.includes("Own Sign")) strength = "Poorna (Strong) - Capable of giving full results";
    if (deeptadi.includes("Debilitated")) strength = "Rikta (Weak) - May struggle to give results";

    return {
      planet,
      deeptadi,
      shayanadi,
      strength
    };
  };

  const dailyInsights = React.useMemo(() => {
    if (!birthPositions || !panchang || !currentTarabala || !positions) return [];

    const insights: any[] = [];
    const transitMoon = positions.find(p => p.name === "Moon");
    const transitSun = positions.find(p => p.name === "Sun");
    const transitJupiter = positions.find(p => p.name === "Jupiter");
    
    // 1. Mind
    let mindContent = `Today's lunar energy in ${panchang.nakshatra.name} creates a ${currentTarabala.name} Tara. `;
    if (currentTarabala.score >= 80) mindContent += "Your mental clarity is high, making it an excellent time for deep focus and emotional stability.";
    else if (currentTarabala.score >= 50) mindContent += "Your mind is active but may require conscious effort to stay grounded.";
    else mindContent += "You might feel emotionally sensitive today. Avoid impulsive decisions and prioritize self-care.";
    
    if (ashtakavarga && transitMoon) {
      const moonRashiIdx = RASHIS.indexOf(transitMoon.rashi);
      const moonSAV = ashtakavarga.sav[moonRashiIdx];
      if (moonSAV >= 30) mindContent += " The high SAV score in your current lunar sign supports emotional resilience.";
      else if (moonSAV < 25) mindContent += " The low SAV score suggests a need for extra rest and mental peace.";
    }
    
    insights.push({
      topic: "Mind & Emotions",
      content: mindContent,
      icon: Brain,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    });

    // 2. Career
    let careerContent = "";
    if (currentDashas && currentDashas.length > 0) {
      const mdLord = currentDashas[0].lord;
      careerContent += `You are currently in ${mdLord} Mahadasha. `;
      const mdTransit = positions.find(p => p.name === mdLord);
      if (mdTransit) {
        careerContent += `The transit of ${mdLord} through ${mdTransit.rashi} suggests a focus on ${getPlanetKeywords(mdLord)}. `;
      }
    }
    
    if (transitSun) {
      const sunRashiIdx = RASHIS.indexOf(transitSun.rashi);
      const sunSAV = ashtakavarga?.sav[sunRashiIdx];
      if (sunSAV >= 30) careerContent += "Transit Sun is in a strong position, favoring leadership and recognition.";
      else careerContent += "Focus on steady progress rather than major career shifts today.";
    }
    
    insights.push({
      topic: "Career & Purpose",
      content: careerContent || "Focus on your long-term goals. The current planetary alignment favors disciplined action.",
      icon: Briefcase,
      color: "text-jyotish-gold",
      bg: "bg-jyotish-gold/10"
    });

    // 3. Health
    let healthContent = "Vitality is influenced by the Sun and your Ascendant lord. ";
    if (transitSun) {
      if (transitSun.rashi === "Aries" || transitSun.rashi === "Leo") healthContent += "The Sun's strong placement boosts your physical energy and immunity.";
      else if (transitSun.rashi === "Libra") healthContent += "The Sun is currently weakened; prioritize rest and avoid overexertion.";
    }
    
    if (panchang.vara === "Tuesday" || panchang.vara === "Saturday") {
      healthContent += ` Today is ${panchang.vara}, ruled by ${panchang.vara === "Tuesday" ? "Mars" : "Saturn"}. Be mindful of physical safety.`;
    }
    
    insights.push({
      topic: "Health & Vitality",
      content: healthContent,
      icon: HeartPulse,
      color: "text-red-400",
      bg: "bg-red-500/10"
    });

    // 4. Spirituality
    let spiritContent = "Jupiter's influence guides your spiritual growth. ";
    if (transitJupiter) {
      spiritContent += `Jupiter in ${transitJupiter.rashi} encourages ${transitJupiter.rashi === "Sagittarius" || transitJupiter.rashi === "Pisces" || transitJupiter.rashi === "Cancer" ? "deep spiritual insights" : "practical learning"}. `;
    }
    
    if (panchang.yoga.name === "Siddha" || panchang.yoga.name === "Shubha" || panchang.yoga.name === "Shukla") {
      spiritContent += "The current Yoga is highly auspicious for meditation.";
    }
    
    insights.push({
      topic: "Spirituality & Growth",
      content: spiritContent,
      icon: Compass,
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    });

    // 5. Bhrigu Bindu (Destiny Point)
    const bb = positions.find(p => p.name === "Bhrigu Bindu");
    if (bb) {
      let bbContent = `Your Bhrigu Bindu (Destiny Point) is currently at ${bb.degree}° ${bb.rashi} (${bb.nakshatra}). `;
      
      // Check for transits over BB
      const conjunctPlanets = positions.filter(p => 
        p.name !== "Bhrigu Bindu" && 
        p.name !== "Ascendant" && 
        isConjunct(p, bb, 3)
      );

      if (conjunctPlanets.length > 0) {
        bbContent += `Significant transit: ${conjunctPlanets.map(p => p.name).join(', ')} is conjunct your Destiny Point. This indicates a period of karmic fulfillment or major life shifts.`;
      } else {
        bbContent += "This point represents the intersection of your intuition (Moon) and karmic path (Rahu). Focus on your inner calling today.";
      }

      insights.push({
        topic: "Destiny & Karma",
        content: bbContent,
        icon: CircleDot,
        color: "text-orange-400",
        bg: "bg-orange-500/10"
      });
    }

    return insights;
  }, [birthPositions, panchang, currentTarabala, positions, ashtakavarga, currentDashas]);

  return (
    <div className="flex flex-col h-full">
      {/* Temporal Controls */}
      {viewMode !== 'natal' && (
        <div className={cn("p-3 border-b sticky top-0 z-20 backdrop-blur-md", theme === 'dark' ? "border-white/10 bg-black/40" : "border-slate-200 bg-white/80")}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Clock className="w-4 h-4 text-jyotish-gold shrink-0" />
              <input 
                type="datetime-local" 
                value={format(currentTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={handleDateChange}
                className={cn("bg-transparent border-none text-sm font-mono focus:ring-0 p-0 w-full", theme === 'dark' ? "text-white" : "text-slate-900")}
              />
            </div>
            <button 
              onClick={() => setIsLive(!isLive)}
              className={cn("px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 transition-all shrink-0 shadow-sm", isLive ? "bg-jyotish-gold text-black font-bold" : (theme === 'dark' ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"))}
            >
              {isLive ? <Activity className="w-3 h-3 animate-pulse" /> : <Pause className="w-3 h-3" />}
              {isLive ? 'Live' : 'Paused'}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => adjustTime(-1)} className={cn("flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider transition-all border active:scale-95", theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white/60 border-white/10" : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm")}>
              <Rewind className="w-3 h-3" /> -1 Day
            </button>
            <button onClick={() => adjustTime(1)} className={cn("flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider transition-all border active:scale-95", theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white/60 border-white/10" : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm")}>
              +1 Day <FastForward className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Dashboard tabs — desktop/tablet only. Mobile uses the App chrome TabGroup above. */}
      <TabGroup
        className="hidden md:block"
        activeId={activeTab}
        onChange={(id) => {
          const tabDef = DASHBOARD_TABS.find((t) => t.id === id);
          if (tabDef?.requiredMode && tabDef.requiredMode !== viewMode) {
            if (tabDef.requiredMode === 'natal') {
              handleAutoSelectNatal();
            } else {
              switchToTransitMode();
            }
          }
          setActiveTab(id as any);
        }}
        items={DASHBOARD_TABS.map((tab): TabGroupItem => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          group: tab.group,
          badge: tab.requiredMode && tab.requiredMode !== viewMode
            ? (tab.requiredMode === 'natal' ? <Sparkles className="w-3 h-3 opacity-50" /> : <Compass className="w-3 h-3 opacity-50" />)
            : undefined,
        }))}
      />

      {/* Mode banner — desktop/tablet only; on mobile the chart + profile selector carry context */}
      <div className={cn("hidden md:block px-4 py-1.5 border-b", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
        <Label muted>
          {viewMode === 'natal'
            ? `Natal mode — birth chart for ${userProfile?.name || 'you'}`
            : 'Transit mode — the current sky'}
        </Label>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 pt-2 md:pt-4">
        {dashboardError && (
          <APIErrorMessage 
            error={dashboardError.error}
            title={dashboardError.title}
            onRetry={() => {
              const retryFn = dashboardError.retry;
              setDashboardError(null);
              retryFn?.();
            }}
            onClear={() => setDashboardError(null)}
            className="mb-4"
          />
        )}
        {activeTab === 'overview' && (
          <div className="space-y-6 pb-20">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              {(viewMode === 'natal' ? birthPanchang : panchang) && (
                <StatTile
                  label={viewMode === 'natal' ? 'Birth Tithi' : 'Current Tithi'}
                  value={<span className="text-jyotish-gold truncate block">{(viewMode === 'natal' ? birthPanchang : panchang)!.tithi.name}</span>}
                />
              )}
              {isBirthMode && currentTarabala && (
                <StatTile
                  label="Your Energy"
                  value={
                    <span className={cn("truncate block", currentTarabala.score >= 80 ? "text-green-500" : "text-jyotish-gold")}>
                      {currentTarabala.name}
                    </span>
                  }
                />
              )}
              {(() => {
                const bb = positions.find(p => p.name === "Bhrigu Bindu");
                if (!bb) return null;
                return (
                  <div className="col-span-2">
                    <StatTile
                      label="Bhrigu Bindu (Destiny Point)"
                      value={
                        <div className="flex items-center justify-between w-full">
                          <span className="text-orange-400">{bb.degree}° {bb.rashi}</span>
                          <span className={cn("text-caption font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{bb.nakshatra}</span>
                        </div>
                      }
                    />
                  </div>
                );
              })()}
            </div>

            {/* Daily Insight (if natal data available) */}
            {isBirthMode && birthPositions && panchang && currentTarabala && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-jyotish-gold" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-jyotish-gold">Your Daily Insights</h3>
                  </div>
                  {isAiLoading && (
                    <div className="flex items-center gap-2 text-[10px] text-jyotish-gold/60 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Synthesizing Cosmic Data...
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {(aiInsights.length > 0 ? aiInsights : dailyInsights).map((insight, i) => {
                    const Icon = aiInsights.length > 0 ? getIconComponent(insight.iconName) : insight.icon;
                    return (
                      <div key={i} className={cn("p-5 rounded-3xl border relative overflow-hidden transition-all active:scale-[0.98]", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                        <div className="flex items-start gap-4 relative z-10">
                          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", insight.bg, insight.color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className={cn("text-xs font-bold uppercase tracking-wider", insight.color)}>{insight.topic}</h4>
                            <p className={cn("text-[11px] leading-relaxed", theme === 'dark' ? "text-white/70" : "text-slate-600")}>
                              {insight.content}
                            </p>
                          </div>
                        </div>
                        <div className="absolute -right-2 -bottom-2 opacity-[0.03]">
                          <Icon className="w-16 h-16" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tarabala Details */}
            {isBirthMode && currentTarabala && (
              <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-mystic-purple/20 border-jyotish-gold/10" : "bg-white border-slate-100")}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Personal Tarabala</h3>
                  <div className={cn("px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider", 
                    currentTarabala.score >= 80 ? "bg-green-500/20 text-green-500" : 
                    currentTarabala.score >= 50 ? "bg-jyotish-gold/20 text-jyotish-gold" : 
                    "bg-red-500/20 text-red-500"
                  )}>
                    {currentTarabala.quality} ({currentTarabala.score}%)
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={theme === 'dark' ? "text-white/60" : "text-slate-500"}>Tara:</span>
                    <span className="font-mono text-jyotish-gold">{currentTarabala.tara} - {currentTarabala.name}</span>
                  </div>
                  <div className="text-xs leading-relaxed">
                    <span className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>{currentTarabala.meaning}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Personal Milestones */}
            {isBirthMode && upcomingTransits && upcomingTransits.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-jyotish-gold" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-jyotish-gold">Personal Timeline Peaks</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('upcoming')}
                    className="text-[10px] font-bold uppercase tracking-tighter text-jyotish-gold/60 hover:text-jyotish-gold transition-colors"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  {upcomingTransits
                    .filter(t => t.isImportant || t.type === 'Natal Conjunction' || t.type === 'Natal Aspect' || t.type === 'House Change')
                    .slice(0, 3)
                    .map((transit, i) => (
                      <div key={i} className={cn(
                        "p-4 rounded-3xl border flex items-center justify-between transition-all hover:scale-[1.01]",
                        theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center",
                            transit.isImportant ? "bg-jyotish-gold/20 text-jyotish-gold" : "bg-blue-500/10 text-blue-400"
                          )}>
                            <PlanetGlyph name={transit.planet} className="scale-110" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-bold flex items-center gap-1.5">
                              {transit.planet} 
                              <span className={theme === 'dark' ? "text-white/40" : "text-slate-400 font-normal"}>
                                {transit.type === 'Natal Conjunction' ? '→ natal' : transit.type === 'Natal Aspect' ? 'aspecting' : 'entering'}
                              </span>
                              <span>{transit.to}</span>
                            </div>
                            <div className={cn("text-[10px] font-mono tracking-tight", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
                              {format(transit.date, 'MMMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => interpretPrediction(transit)}
                          className={cn(
                            "p-2 rounded-xl border transition-all active:scale-95", 
                            theme === 'dark' ? "border-jyotish-gold/20 hover:bg-jyotish-gold/10 text-jyotish-gold" : "border-orange-200 hover:bg-orange-50 text-orange-600"
                          )}
                          title="Get AI Prediction"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Planet List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Planetary Positions</Label>
                <Label muted={false} className="text-jyotish-gold">Sidereal (Lahiri)</Label>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {positions.map((p, idx) => {
                  const isInSelectedZodiac = selectedZodiac !== null && p.rashi === RASHIS[selectedZodiac];
                  const isSelected = selectedPlanet === p.name;
                  
                  return (
                    <React.Fragment key={`${p.name}-${idx}`}>
                      <button
                        onClick={() => setSelectedPlanet(isSelected ? null : p.name)}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border",
                          isSelected 
                            ? "bg-jyotish-gold/10 border-jyotish-gold/30 shadow-[0_4px_20px_-5px_rgba(212,175,55,0.2)]" 
                            : isInSelectedZodiac
                            ? "bg-orange-500/5 border-orange-500/20"
                            : theme === 'dark' ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                            style={{ backgroundColor: p.color, color: '#000' }}
                          >
                            {p.symbol}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold flex items-center gap-2">
                              <span className={theme === 'dark' ? "text-white/90" : "text-slate-800"}>{p.name}</span>
                              {p.isRetrograde && !["Rahu", "Ketu"].includes(p.name) && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-jyotish-gold/20 text-jyotish-gold border border-jyotish-gold/20 font-bold">Rx</span>
                              )}
                            </div>
                            <div className={cn("text-[10px] font-mono uppercase tracking-wider mt-0.5", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                              {p.rashi} • {p.nakshatra} <span className={cn("normal-case", theme === 'dark' ? "text-jyotish-gold/50" : "text-orange-400")}>P{p.pada}</span>
                            </div>
                          </div>
                        </div>
                          <div className="text-right flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <div className={cn("font-mono text-sm font-bold", isSelected || isInSelectedZodiac ? "text-jyotish-gold" : (theme === 'dark' ? "text-white/80" : "text-slate-700"))}>
                                {p.degree}°{p.minute}'
                              </div>
                              <div className={cn("text-[9px] font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/20" : "text-slate-400")}>
                                {p.house ? `House ${p.house}` : 'N/A'}
                              </div>
                            </div>
                            <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isSelected ? "rotate-90 text-jyotish-gold" : (theme === 'dark' ? "text-white/10" : "text-slate-300"))} />
                          </div>
                      </button>

                      {/* Drishti Overview - Only for Natal Reading */}
                      <AnimatePresence>
                        {isSelected && viewMode === 'natal' && activePlanetDrishti && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={cn(
                              "mt-2 p-4 rounded-2xl border space-y-3",
                              theme === 'dark' ? "bg-jyotish-gold/5 border-jyotish-gold/20" : "bg-jyotish-gold/5 border-jyotish-gold/20"
                            )}>
                              <div className="flex items-center gap-2">
                                <Eye className="w-3 h-3 text-jyotish-gold" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-jyotish-gold">Natal Drishti (Aspects)</span>
                              </div>
                              
                              <div className="space-y-3">
                                {activePlanetDrishti.aspectedHouses.map((ah: any, idx: number) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                                        Aspects {getOrdinal(ah.house)} House ({getOrdinal(ah.relativeHouse)} from {activePlanet.name})
                                      </span>
                                      <div className="h-px flex-1 mx-3 bg-jyotish-gold/10" />
                                    </div>
                                    <p className={cn("text-[11px] leading-relaxed italic", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
                                      {ah.interpretation}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {activePlanetDrishti.aspects.length > 0 && (
                                <div className="pt-2 border-t border-jyotish-gold/10">
                                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5 font-mono">Aspected Planets</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.from(new Set(activePlanetDrishti.aspects)).map((name: string) => (
                                      <span key={name} className="px-2 py-0.5 rounded-full bg-jyotish-gold/10 text-jyotish-gold text-[9px] font-bold border border-jyotish-gold/20 flex items-center gap-1.5">
                                        <PlanetGlyph name={name} className="scale-75" />
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Nakshatra Detail Panel — shown for any selected planet in both views */}
                      <AnimatePresence>
                        {isSelected && (() => {
                          const nak = NAKSHATRA_DATA[p.nakshatra as keyof typeof NAKSHATRA_DATA];
                          if (!nak) return null;
                          return (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className={cn(
                                "mt-2 p-4 rounded-2xl border space-y-2",
                                theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                              )}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Star className="w-3 h-3 text-jyotish-gold/70" />
                                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-jyotish-gold/60" : "text-orange-500")}>
                                    Nakshatra — {p.nakshatra} Pada {p.pada}
                                  </span>
                                </div>
                                <div className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/50" : "text-slate-500")}>
                                  <span className={cn("font-semibold", theme === 'dark' ? "text-white/70" : "text-slate-700")}>Lord:</span> {(nak as any).lord}
                                  {" · "}
                                  <span className={cn("font-semibold", theme === 'dark' ? "text-white/70" : "text-slate-700")}>Deity:</span> {(nak as any).deity}
                                  {" · "}
                                  <span className={cn("font-semibold", theme === 'dark' ? "text-white/70" : "text-slate-700")}>Symbol:</span> {(nak as any).symbol}
                                </div>
                                {(nak as any).characteristics && (
                                  <p className={cn("text-[10px] italic leading-relaxed", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                                    {(nak as any).characteristics}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'panchang' && panchang && (
          <div className="space-y-4 pb-20">
            {[
              { label: 'Tithi', value: panchang.tithi.name, element: 'Water (Jala)', color: 'text-jyotish-gold', icon: Moon },
              { label: 'Vara', value: panchang.vara, element: 'Fire (Agni)', color: 'text-red-400', icon: Sun },
              { label: 'Nakshatra', value: panchang.nakshatra.name, element: 'Air (Vayu)', color: 'text-blue-400', icon: Sparkles },
              { label: 'Yoga', value: panchang.yoga.name, element: 'Ether (Akasha)', color: 'text-purple-400', icon: Zap },
              { label: 'Karana', value: panchang.karana.name, element: 'Earth (Prithvi)', color: 'text-emerald-400', icon: Grid },
            ].map((item, i) => (
              <div key={i} className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-widest font-mono text-white/30">{item.label}</div>
                      <div className={cn("text-base font-bold italic font-serif", item.color)}>{item.value}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p className={theme === 'dark' ? "text-white/60" : "text-slate-600"}>
                    <span className={cn("font-bold", item.color)}>Element: {item.element}.</span>
                  </p>
                  <p className={theme === 'dark' ? "text-white/80" : "text-slate-800"}>
                    {i === 0 ? (panchang.tithi.phase + " Paksha. " + (panchang.tithi.number === 15 ? (panchang.tithi.phase === 'Krishna' ? "Amavasya. Best for introspection." : "Purnima. Excellent for manifestation.") : "Purna Tithi. Auspicious for spiritual practices.")) : 
                     i === 1 ? ("Ruled by " + (panchang.vara === "Sunday" ? "Sun" : panchang.vara === "Monday" ? "Moon" : panchang.vara === "Tuesday" ? "Mars" : panchang.vara === "Wednesday" ? "Mercury" : panchang.vara === "Thursday" ? "Jupiter" : panchang.vara === "Friday" ? "Venus" : "Saturn") + ". " + (panchang.vara === "Thursday" || panchang.vara === "Friday" ? "Highly benefic day." : "Good for specific tasks.")) :
                     "Influences the success and quality of actions today."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vargas' && (
          <div className="pb-6">
            {birthPositions && birthPositions.length > 0 ? (
              <DivisionalCharts
                birthPositions={birthPositions}
                user={user}
                userProfile={userProfile}
                birthFingerprint={birthFingerprint}
              />
            ) : (
              <div className={cn("flex flex-col items-center justify-center py-24 gap-3", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
                <Layers className="w-10 h-10 opacity-40" />
                <p className="text-sm">Enter birth details to view divisional charts</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ashtakavarga' && currentAshtakavarga && (
          <div className="space-y-8 pb-8">
            {/* Mode Toggle */}
            <div className="flex p-1 rounded-xl bg-black/20 border border-white/5">
              <button
                onClick={() => setAshtakavargaMode('transit')}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all",
                  ashtakavargaMode === 'transit' ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                Transit (Current)
              </button>
              <button
                onClick={() => setAshtakavargaMode('natal')}
                disabled={!natalAshtakavarga}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all",
                  ashtakavargaMode === 'natal' ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white/60",
                  !natalAshtakavarga && "opacity-30 cursor-not-allowed"
                )}
              >
                Personal (Natal)
              </button>
            </div>

            {/* SAV Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn("text-[10px] uppercase tracking-widest font-mono flex items-center gap-2", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                  <BarChart3 className="w-3 h-3" /> Sarvashtakavarga (SAV)
                </div>
                <div className="text-[10px] font-mono text-orange-500/60">Avg: 28 pts</div>
              </div>
              
              <div className={cn("h-64 w-full p-4 rounded-2xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-100")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#111' : '#fff', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Bar dataKey="beneficCount" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} name="Benefic Points" />
                    <Bar dataKey="maleficCount" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} name="Malefic Points" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                {savData.map((data, i) => (
                  <div key={data.name} className={cn("p-2 rounded-xl border flex flex-col items-center transition-all", data.score >= 30 ? "bg-green-500/10 border-green-500/20 text-green-400" : data.score < 25 ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-white/60")}>
                    <div className="text-[8px] uppercase tracking-wider mb-0.5 font-mono">{data.name}</div>
                    <div className="text-sm font-mono font-bold">{data.score}</div>
                    <div className="flex gap-2 mt-1 text-[8px] font-mono">
                      <span className="text-green-400/80" title="Benefic Points">+{data.beneficCount}</span>
                      <span className="text-red-400/80" title="Malefic Points">-{data.maleficCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rectifications & Yog Pinda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                <div className={cn("text-[10px] uppercase tracking-widest font-mono mb-3", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Trikon Shodhana (Trine Reduction)</div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {currentAshtakavarga.trikonReduced?.map((score, i) => (
                    <div key={i} className="text-center">
                      <div className={cn("text-[8px] font-mono uppercase", theme === 'dark' ? "text-white/30" : "text-slate-400")}>{RASHIS[i].substring(0, 3)}</div>
                      <div className="text-sm font-mono font-bold text-jyotish-gold">{score}</div>
                    </div>
                  ))}
                </div>
                <div className={cn("text-[10px] uppercase tracking-widest font-mono mb-3 pt-3 border-t", theme === 'dark' ? "text-white/40 border-white/5" : "text-slate-500 border-slate-100")}>Ekadhipatya Shodhana</div>
                <div className="grid grid-cols-4 gap-2">
                  {currentAshtakavarga.ekadhipatyaReduced?.map((score, i) => (
                    <div key={i} className="text-center">
                      <div className={cn("text-[8px] font-mono uppercase", theme === 'dark' ? "text-white/30" : "text-slate-400")}>{RASHIS[i].substring(0, 3)}</div>
                      <div className="text-sm font-mono font-bold text-orange-500">{score}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={cn("p-4 rounded-2xl border flex flex-col justify-center items-center", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
                <div className={cn("text-[10px] uppercase tracking-widest font-mono mb-1", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Yog Pinda</div>
                <div className="text-4xl font-serif italic text-orange-500">{currentAshtakavarga.yogPinda}</div>
                <div className={cn("text-[10px] font-mono mt-2 uppercase text-center max-w-[200px]", theme === 'dark' ? "text-white/30" : "text-slate-400")}>Master Key for Timing Events in Ashtakavarga</div>
              </div>
            </div>

            {/* Interpretations */}
            <div className="space-y-4">
              <div className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Ashtakavarga Yogas & Predictions</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(() => {
                  const interpretations = [];
                  const sav = currentAshtakavarga.sav;
                  
                  // Financial (Dhana Yoga)
                  if (sav[10] > sav[9] && sav[10] > sav[11]) {
                    interpretations.push({
                      title: "Dhana Yoga (Wealth)",
                      desc: "11th house (Gains) is stronger than 10th (Profession) and 12th (Losses). Wealth will accumulate with relative ease.",
                      type: "positive"
                    });
                  }

                  // Savings Yoga
                  if (sav[1] > sav[11]) {
                    interpretations.push({
                      title: "Savings Yoga",
                      desc: "2nd house (Wealth) has more points than 12th house (Expenses). You have a natural ability to save money.",
                      type: "positive"
                    });
                  }

                  // Daridra Yoga
                  if (sav[11] > sav[10]) {
                    interpretations.push({
                      title: "Expense Yoga",
                      desc: "12th house (Expenses) is stronger than 11th house (Gains). Expenses may frequently exceed income.",
                      type: "negative"
                    });
                  }

                  // Raja Yoga
                  if (sav[0] >= 28 && sav[8] >= 28 && sav[9] >= 28) {
                    interpretations.push({
                      title: "Raja Yoga (Success)",
                      desc: "1st, 9th, and 10th houses are all strong (28+ points). Indicates high potential for success, luck, and status.",
                      type: "positive"
                    });
                  }

                  // Health Yoga
                  if (sav[0] > sav[5] && sav[0] > sav[7] && sav[0] > sav[11]) {
                    interpretations.push({
                      title: "Vitality Yoga",
                      desc: "1st house (Self) is stronger than 6th, 8th, and 12th houses. Indicates strong health and immunity to overcome obstacles.",
                      type: "positive"
                    });
                  }
                  
                  // Strong Houses
                  const strongHouses = sav.map((s, i) => s >= 30 ? i + 1 : null).filter(h => h !== null);
                  if (strongHouses.length > 0) {
                    interpretations.push({
                      title: "Fortified Areas",
                      desc: `Houses ${strongHouses.join(', ')} are highly fortified (30+ points). Transits through these signs will yield excellent results.`,
                      type: "positive"
                    });
                  }
                  
                  // Weak Houses
                  const weakHouses = sav.map((s, i) => s < 25 ? i + 1 : null).filter(h => h !== null);
                  if (weakHouses.length > 0) {
                    interpretations.push({
                      title: "Vulnerable Areas",
                      desc: `Houses ${weakHouses.join(', ')} are weak (below 25 points). Planets transiting here may struggle to deliver benefits.`,
                      type: "negative"
                    });
                  }

                  // Progeny
                  if (birthPositions) {
                    const jupiter = birthPositions.find(p => p.name === "Jupiter");
                    if (jupiter) {
                      const jupiterRashiIdx = RASHIS.indexOf(jupiter.rashi);
                      const fifthFromJupiter = (jupiterRashiIdx + 4) % 12;
                      const progenyPoints = currentAshtakavarga.sav[fifthFromJupiter];
                      interpretations.push({
                        title: "Progeny Potential",
                        desc: `5th house from Jupiter (${RASHIS[fifthFromJupiter]}) has ${progenyPoints} points, indicating potential for progeny and creative output.`,
                        type: "neutral"
                      });
                    }
                  }

                  return interpretations.map((item, i) => (
                    <div key={i} className={cn("p-4 rounded-2xl border flex flex-col justify-between", theme === 'dark' ? "bg-mystic-purple/20 border-jyotish-gold/10" : "bg-white border-slate-100")}>
                      <div>
                        <div className={cn("text-xs font-bold mb-2 flex items-center gap-1.5", item.type === 'positive' ? "text-green-500" : item.type === 'negative' ? "text-red-500" : "text-jyotish-gold")}>
                          {item.type === 'positive' && <Sparkles className="w-3.5 h-3.5" />}
                          {item.type === 'negative' && <Info className="w-3.5 h-3.5" />}
                          {item.type === 'neutral' && <CircleDot className="w-3.5 h-3.5" />}
                          {item.title}
                        </div>
                        <div className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{item.desc}</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* BAV Section */}
            <div className="space-y-4">
              <div className={cn("text-[10px] uppercase tracking-widest font-mono flex items-center gap-2", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                <Grid className="w-3 h-3" /> Bhinnashtakavarga (BAV)
              </div>
              
              <div className="flex flex-wrap gap-1">
                {["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].map(planet => (
                  <button
                    key={planet}
                    onClick={() => setSelectedBavPlanet(planet)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest whitespace-nowrap border transition-all",
                      selectedBavPlanet === planet 
                        ? "bg-jyotish-gold border-jyotish-gold text-black font-bold" 
                        : "bg-mystic-purple/20 border-jyotish-gold/10 text-white/40 hover:bg-mystic-purple/40"
                    )}
                  >
                    {planet}
                  </button>
                ))}
              </div>

              <div className={cn("h-64 w-full p-4 rounded-2xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-100")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bavData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1a0b2e' : '#fff', 
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                      itemStyle={{ color: '#d4af37' }}
                    />
                    <Bar dataKey="score" fill="#d4af37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'natal' && (
          <div className="space-y-6 pb-20">

            {/* ── Profile Selector — last on-screen control on mobile (chart panel fills the fold above) ── */}
            <div className="relative -mx-0" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(v => !v)}
                className={cn(
                  "w-full min-h-[52px] px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-200",
                  activeChildProfileId
                    ? theme === 'dark' ? "bg-jyotish-gold/10 border-jyotish-gold/30 hover:bg-jyotish-gold/15" : "bg-orange-50 border-orange-200 hover:bg-orange-100"
                    : theme === 'dark' ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]" : "bg-white border-slate-100 shadow-sm hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {activeChildProfileId && childProfiles ? (() => {
                    const active = childProfiles.find(p => p.id === activeChildProfileId);
                    return active ? (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold font-bold text-sm shrink-0">
                          {active.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{active.name}'s Chart</p>
                          <p className={cn("text-[10px] font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{active.city} · {new Date(active.birthTime).toLocaleDateString()}</p>
                        </div>
                      </>
                    ) : null;
                  })() : (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-jyotish-gold/10 flex items-center justify-center text-jyotish-gold shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>My Chart</p>
                        <p className={cn("text-[10px] font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{userProfile?.displayName || 'Default profile'}</p>
                      </div>
                    </>
                  )}
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 shrink-0", showProfileDropdown ? "rotate-180" : "", theme === 'dark' ? "text-white/40" : "text-slate-400")} />
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border overflow-hidden shadow-xl",
                      theme === 'dark' ? "bg-[#0d0d0d] border-white/10" : "bg-white border-slate-200"
                    )}
                  >
                    {/* My Chart (default) */}
                    <button
                      onClick={() => { onClearChildProfile?.(); setShowProfileDropdown(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                        !activeChildProfileId
                          ? theme === 'dark' ? "bg-jyotish-gold/10" : "bg-orange-50"
                          : theme === 'dark' ? "hover:bg-white/[0.04]" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl bg-jyotish-gold/10 flex items-center justify-center text-jyotish-gold shrink-0">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>My Chart</p>
                        <p className={cn("text-[10px] font-mono truncate", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{userProfile?.displayName || 'Default profile'}</p>
                      </div>
                      {!activeChildProfileId && <Check className="w-3.5 h-3.5 text-jyotish-gold shrink-0" />}
                    </button>

                    {/* Child profiles */}
                    {childProfiles && childProfiles.length > 0 && (
                      <>
                        <div className={cn("h-px mx-4", theme === 'dark' ? "bg-white/5" : "bg-slate-100")} />
                        {childProfiles.map(profile => (
                          <button
                            key={profile.id}
                            onClick={() => { onLoadChildProfile?.(profile.id); setShowProfileDropdown(false); }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                              activeChildProfileId === profile.id
                                ? theme === 'dark' ? "bg-jyotish-gold/10" : "bg-orange-50"
                                : theme === 'dark' ? "hover:bg-white/[0.04]" : "hover:bg-slate-50"
                            )}
                          >
                            <div className="w-8 h-8 rounded-xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold font-bold text-sm shrink-0">
                              {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>{profile.name}</p>
                              <p className={cn("text-[10px] font-mono truncate", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{profile.city} · {new Date(profile.birthTime).toLocaleDateString()}</p>
                            </div>
                            {activeChildProfileId === profile.id && <Check className="w-3.5 h-3.5 text-jyotish-gold shrink-0" />}
                          </button>
                        ))}
                      </>
                    )}

                    {/* Manage link */}
                    <div className={cn("h-px mx-4", theme === 'dark' ? "bg-white/5" : "bg-slate-100")} />
                    <button
                      onClick={() => { onNavigateToProfiles?.(); setShowProfileDropdown(false); }}
                      className={cn("w-full flex items-center gap-2 px-4 py-3 transition-colors", theme === 'dark' ? "hover:bg-white/[0.04] text-white/40 hover:text-white/70" : "hover:bg-slate-50 text-slate-400 hover:text-slate-600")}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Manage People Profiles</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Planet Positions Table ────────────────────────────── */}
            {isBirthMode && birthPositions && birthPositions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                  <div className={cn("text-[10px] uppercase tracking-widest font-mono mb-4 flex items-center gap-2", theme === 'dark' ? "text-jyotish-gold/60" : "text-slate-400")}>
                    <Sparkles className="w-3 h-3" /> Planet Positions at Birth
                  </div>
                  {(() => {
                    const statusOf = (p: PlanetPosition) => p.isRetrograde ? 'R' : p.dignity === 'exalted' ? 'Exalt' : p.dignity === 'debilitated' ? 'Debil' : p.dignity === 'moolatrikona' ? 'MT' : p.dignity === 'own' ? 'Own' : '';
                    const statusColorOf = (p: PlanetPosition) => p.isRetrograde ? 'text-amber-400' : p.dignity === 'exalted' ? 'text-green-400' : p.dignity === 'debilitated' ? 'text-red-400' : p.dignity === 'moolatrikona' ? 'text-blue-400' : p.dignity === 'own' ? 'text-jyotish-gold' : theme === 'dark' ? 'text-white/20' : 'text-slate-300';
                    return (
                      <>
                        {/* Mobile: stacked cards (no horizontal scroll) */}
                        <div className="md:hidden space-y-2">
                          {birthPositions.map((p, i) => (
                            <div key={i} className={cn("rounded-xl border p-3 flex flex-col gap-2 min-w-0", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100")}>
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0">{PLANET_GLYPHS[p.name] || ''}</span>
                                  <span className={cn("font-medium truncate", theme === 'dark' ? "text-white/80" : "text-slate-700")}>{p.name}</span>
                                </span>
                                <span className={cn("text-[10px] font-bold shrink-0", statusColorOf(p))}>{statusOf(p) || '—'}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] min-w-0">
                                <div className="flex justify-between gap-2 min-w-0">
                                  <span className={theme === 'dark' ? "text-white/30" : "text-slate-400"}>Rashi</span>
                                  <span className={cn("truncate text-right", theme === 'dark' ? "text-white/70" : "text-slate-600")}>{p.rashi}</span>
                                </div>
                                <div className="flex justify-between gap-2 min-w-0">
                                  <span className={theme === 'dark' ? "text-white/30" : "text-slate-400"}>House</span>
                                  <span className={cn("font-mono", theme === 'dark' ? "text-white/60" : "text-slate-500")}>{p.house}</span>
                                </div>
                                <div className="flex justify-between gap-2 min-w-0 col-span-2">
                                  <span className={theme === 'dark' ? "text-white/30" : "text-slate-400"}>Nakshatra</span>
                                  <span className={cn("truncate text-right", theme === 'dark' ? "text-white/50" : "text-slate-500")}>{p.nakshatra} <span className={theme === 'dark' ? "text-jyotish-gold/40" : "text-orange-400"}>P{p.pada}</span></span>
                                </div>
                                <div className="flex justify-between gap-2 min-w-0">
                                  <span className={theme === 'dark' ? "text-white/30" : "text-slate-400"}>Degree</span>
                                  <span className={cn("font-mono", theme === 'dark' ? "text-white/50" : "text-slate-400")}>{p.degree}°{p.minute}'</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop: table */}
                        <table className="hidden md:table w-full text-xs">
                          <thead>
                            <tr className={cn("border-b", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
                              {["Planet", "Rashi", "Nakshatra", "House", "Deg", "Status"].map(h => (
                                <th key={h} className={cn("pb-2 text-left text-[9px] uppercase tracking-widest font-mono font-medium", theme === 'dark' ? "text-white/30" : "text-slate-400")}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {birthPositions.map((p, i) => (
                              <tr key={i} className={cn("transition-colors", theme === 'dark' ? "hover:bg-white/[0.02]" : "hover:bg-slate-50")}>
                                <td className="py-2 pr-3 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-sm">{PLANET_GLYPHS[p.name] || ''}</span>
                                    <span className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>{p.name}</span>
                                  </span>
                                </td>
                                <td className={cn("py-2 pr-3", theme === 'dark' ? "text-white/70" : "text-slate-600")}>{p.rashi}</td>
                                <td className={cn("py-2 pr-3 text-[10px]", theme === 'dark' ? "text-white/50" : "text-slate-500")}>
                                  {p.nakshatra}
                                  <span className={cn("ml-1", theme === 'dark' ? "text-jyotish-gold/40" : "text-orange-400")}>P{p.pada}</span>
                                </td>
                                <td className={cn("py-2 pr-3 font-mono", theme === 'dark' ? "text-white/60" : "text-slate-500")}>{p.house}</td>
                                <td className={cn("py-2 pr-3 font-mono text-[10px]", theme === 'dark' ? "text-white/50" : "text-slate-400")}>{p.degree}°{p.minute}'</td>
                                <td className={cn("py-2 text-[10px] font-bold", statusColorOf(p))}>{statusOf(p) || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* ── Nakshatra Section ─────────────────────────────────── */}
            {isBirthMode && birthPositions && (() => {
              const moonPos = birthPositions.find(p => p.name === 'Moon');
              if (!moonPos) return null;
              const moonNak = NAKSHATRA_DATA[moonPos.nakshatra as keyof typeof NAKSHATRA_DATA] as any;
              const allPlanets = birthPositions.filter(p => p.name !== 'Ascendant');
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                  <div className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                    <div className={cn("text-[10px] uppercase tracking-widest font-mono mb-4 flex items-center gap-2", theme === 'dark' ? "text-jyotish-gold/60" : "text-slate-400")}>
                      <Star className="w-3 h-3" /> Nakshatra Blueprint
                    </div>

                    {/* Moon Nakshatra — primary highlight */}
                    <div className={cn("p-4 rounded-2xl border mb-3", theme === 'dark' ? "bg-jyotish-gold/5 border-jyotish-gold/20" : "bg-orange-50 border-orange-200")}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">☽</span>
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-jyotish-gold/60" : "text-orange-500")}>Birth Moon Nakshatra</span>
                      </div>
                      <p className={cn("text-lg font-bold mb-1", theme === 'dark' ? "text-white" : "text-slate-900")}>{moonPos.nakshatra}
                        <span className={cn("ml-2 text-xs font-normal", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Pada {moonPos.pada}</span>
                      </p>
                      {moonNak && <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
                        Lord: <span className="text-jyotish-gold font-medium">{moonNak.lord}</span> · Deity: {moonNak.deity} · Symbol: {moonNak.symbol}
                      </p>}
                      {moonNak?.characteristics && <p className={cn("text-[11px] leading-relaxed mt-2 italic", theme === 'dark' ? "text-white/50" : "text-slate-500")}>{moonNak.characteristics}</p>}
                    </div>

                    {/* All planets nakshatra grid */}
                    <div className={cn("text-[9px] uppercase tracking-widest font-mono mb-3", theme === 'dark' ? "text-white/25" : "text-slate-400")}>
                      All Planets
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {allPlanets.map(p => {
                        const nak = NAKSHATRA_DATA[p.nakshatra as keyof typeof NAKSHATRA_DATA];
                        return (
                          <div key={p.name} className={cn("flex items-start gap-3 p-3 rounded-2xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100")}>
                            <span className="text-base mt-0.5 shrink-0" style={{ color: p.color }}>{PLANET_GLYPHS[p.name] || p.symbol}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn("text-xs font-bold", theme === 'dark' ? "text-white/80" : "text-slate-700")}>{p.name}</span>
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-mono", theme === 'dark' ? "bg-jyotish-gold/10 text-jyotish-gold/60" : "bg-orange-100 text-orange-500")}>
                                  {p.nakshatra} P{p.pada}
                                </span>
                                <span className={cn("text-[9px]", theme === 'dark' ? "text-white/30" : "text-slate-400")}>{p.rashi}</span>
                              </div>
                              {nak && (
                                <div className={cn("text-[10px] mt-1", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                                  Lord: <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{nak.lord}</span>
                                  {" · "}Deity: <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{nak.deity}</span>
                                  {" · "}Symbol: <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{nak.symbol}</span>
                                </div>
                              )}
                              {nak?.characteristics && (
                                <p className={cn("text-[9px] italic mt-0.5 leading-relaxed", theme === 'dark' ? "text-white/25" : "text-slate-400")}>
                                  {nak.characteristics}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* ── Major Current Transits ────────────────────────────── */}
            {isBirthMode && transits && transits.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("text-[10px] uppercase tracking-widest font-mono flex items-center gap-2", theme === 'dark' ? "text-jyotish-gold/60" : "text-slate-400")}>
                      <Activity className="w-3 h-3" /> Major Transits Now
                    </div>
                    <button onClick={() => setActiveTab('transits')} className="text-[10px] font-bold uppercase tracking-widest text-jyotish-gold/60 hover:text-jyotish-gold transition-colors">
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {transits.slice(0, 6).map((t, i) => {
                      const isPos = t.type === 'positive';
                      const isNeg = t.type === 'negative';
                      const badge = isPos ? 'bg-green-500/10 text-green-400' : isNeg ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400';
                      return (
                        <div key={i} className={cn("flex items-start gap-3 p-3 rounded-2xl", theme === 'dark' ? "bg-white/[0.02]" : "bg-slate-50")}>
                          <span className="text-base mt-0.5">{PLANET_GLYPHS[(t as any).planet] || '●'}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-medium truncate", theme === 'dark' ? "text-white/80" : "text-slate-700")}>{(t as any).description || (t as any).title || `${(t as any).planet} transit`}</p>
                          </div>
                          <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0", badge)}>
                            {isPos ? 'pos' : isNeg ? 'neg' : 'neu'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Birth Chart Yogas ─────────────────────────────────── */}
            {isBirthMode && natalYogas && natalYogas.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <div className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("text-[10px] uppercase tracking-widest font-mono flex items-center gap-2", theme === 'dark' ? "text-jyotish-gold/60" : "text-slate-400")}>
                      <Sparkles className="w-3 h-3" /> Birth Yogas
                    </div>
                    <span className={cn("text-[10px] font-mono", theme === 'dark' ? "text-white/30" : "text-slate-400")}>{natalYogas.length} detected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(showAllYogas ? natalYogas : natalYogas.slice(0, 8)).map((yoga, i) => {
                      const isAuspicious = yoga.type === 'auspicious';
                      const isNeutral = yoga.type === 'neutral';
                      const bg = isAuspicious ? 'bg-green-500/10 text-green-400 border-green-500/20' : isNeutral ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
                      return (
                        <span key={i} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border", bg)}>
                          {yoga.name}
                        </span>
                      );
                    })}
                  </div>
                  {natalYogas.length > 8 && (
                    <button onClick={() => setShowAllYogas(v => !v)} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-jyotish-gold/60 hover:text-jyotish-gold transition-colors">
                      {showAllYogas ? '← Show Less' : `+ ${natalYogas.length - 8} More`}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Bhrigu Bindu Analysis ─────────────────────────────── */}
            {isBirthMode && birthSpecialPoints?.bhriguBindu && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                <BhriguBinduAnalysis bhriguBindu={birthSpecialPoints.bhriguBindu} currentPositions={positions} />
              </motion.div>
            )}

            {/* ── Planet Dignity Analysis ───────────────────────────── */}
            {isBirthMode && birthPositions && birthPositions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                <NatalDignityAnalysis positions={birthPositions} />
              </motion.div>
            )}

            {/* ── Soul Profile AI Report ────────────────────────────── */}
            {isBirthMode && birthPositions && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <div className={cn("p-6 rounded-3xl border relative overflow-hidden", theme === 'dark' ? "bg-mystic-purple/20 border-jyotish-gold/10" : "bg-white border-slate-100 shadow-sm")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-jyotish-gold/5 via-transparent to-mystic-purple/5 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", theme === 'dark' ? "bg-jyotish-gold/10 text-jyotish-gold" : "bg-orange-100 text-orange-600")}>
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn("text-base font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Soul Profile</h3>
                        <p className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>AI-powered natal chart reading</p>
                      </div>
                    </div>

                    {!soulProfile && !isSoulProfileLoading && (
                      <button
                        onClick={generateSoulProfile}
                        className="mt-4 w-full py-3.5 rounded-2xl bg-jyotish-gold text-black text-[11px] font-bold uppercase tracking-widest hover:bg-celestial-gold transition-all shadow-lg shadow-jyotish-gold/20 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Sparkles className="w-4 h-4" /> Generate Soul Profile
                      </button>
                    )}

                    {isSoulProfileLoading && (
                      <div className="mt-4 flex flex-col items-center gap-3 py-6">
                        <div className="w-10 h-10 rounded-full border-2 border-jyotish-gold/30 border-t-jyotish-gold animate-spin" />
                        <p className={cn("text-[11px] font-mono uppercase tracking-widest animate-pulse", theme === 'dark' ? "text-jyotish-gold/60" : "text-orange-500")}>
                          Reading your cosmic blueprint...
                        </p>
                      </div>
                    )}

                    {soulProfileError && (
                      <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-400">{soulProfileError}</p>
                        <button onClick={generateSoulProfile} className="mt-2 text-[10px] font-bold uppercase tracking-widest text-jyotish-gold hover:underline">Retry</button>
                      </div>
                    )}

                    {soulProfile && (() => {
                      const sections = [
                        { key: 'gifts', icon: '✨', label: 'Gifts & Strengths', color: 'text-green-400' },
                        { key: 'challenges', icon: '⚠️', label: 'Challenges', color: 'text-amber-400' },
                        { key: 'shadowWork', icon: '🌑', label: 'Shadow Work', color: 'text-purple-400' },
                        { key: 'spirituality', icon: '🕉️', label: 'Spirituality', color: 'text-blue-400' },
                        { key: 'career', icon: '💼', label: 'Career & Purpose', color: 'text-jyotish-gold' },
                        { key: 'love', icon: '💞', label: 'Love & Relationships', color: 'text-pink-400' },
                        { key: 'health', icon: '🌿', label: 'Health & Vitality', color: 'text-emerald-400' },
                      ] as const;
                      return (
                        <div className="mt-5 space-y-3">
                          {sections.map(({ key, icon, label, color }) => (
                            <div key={key} className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100")}>
                              <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5", color)}>
                                <span>{icon}</span> {label}
                              </div>
                              <p className={cn("text-[11px] leading-relaxed", theme === 'dark' ? "text-white/70" : "text-slate-600")}>
                                {soulProfile[key]}
                              </p>
                            </div>
                          ))}
                          <button
                            onClick={() => { setSoulProfile(null); generateSoulProfile(); }}
                            disabled={isSoulProfileLoading}
                            className={cn("w-full py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all", theme === 'dark' ? "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20" : "border-slate-200 text-slate-400 hover:text-slate-600")}
                          >
                            ↻ Regenerate
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        )}

        {activeTab === 'impacts' && viewMode === 'natal' && (
          <div className="space-y-6 pb-20">
            {/* Header & AI CTA */}
            <div className={cn("p-6 rounded-3xl border relative overflow-hidden", theme === 'dark' ? "bg-mystic-purple/20 border-jyotish-gold/10" : "bg-white border-slate-100 shadow-sm")}>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", theme === 'dark' ? "bg-jyotish-gold/10 text-jyotish-gold" : "bg-orange-100 text-orange-600")}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={cn("text-lg font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Transit Interpretations</h2>
                    <p className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>How the current sky affects you</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button 
                    onClick={generateTransitImpactInsight}
                    disabled={isTransitAiLoading}
                    className={cn(
                      "px-4 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border active:scale-95 shadow-sm",
                      theme === 'dark' 
                        ? "bg-jyotish-gold/20 text-jyotish-gold border-jyotish-gold/30 hover:bg-jyotish-gold/30" 
                        : "bg-orange-500 text-white border-orange-600 hover:bg-orange-600"
                    )}
                  >
                    {isTransitAiLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating Your Reading...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        {transitImpactInsight ? "Refresh AI Analysis" : "Analyze My Transits (AI)"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                <Compass className="w-32 h-32" />
              </div>
            </div>

            {/* AI Insight Box */}
            {transitImpactInsight && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-jyotish-gold/5 border border-jyotish-gold/10 relative overflow-hidden group shadow-inner"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-10 h-10 text-jyotish-gold" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-jyotish-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-jyotish-gold/80">Individual Interpretation</span>
                </div>
                <p className={cn("text-sm leading-relaxed italic font-serif relative z-10", theme === 'dark' ? "text-white/90" : "text-slate-800")}>
                  "{transitImpactInsight}"
                </p>
              </motion.div>
            )}

            {/* Filters */}
            <div className={cn("p-5 rounded-3xl border grid grid-cols-1 md:grid-cols-3 gap-4", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
              <div>
                <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-1.5 opacity-50 px-1", theme === 'dark' ? "text-white" : "text-slate-900")}>Transiting Planet</label>
                <select 
                  value={natalTransitPlanetFilter}
                  onChange={(e) => setNatalTransitPlanetFilter(e.target.value)}
                  className={cn(
                    "w-full bg-transparent border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-jyotish-gold/50 transition-all",
                    theme === 'dark' ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                  )}
                >
                  <option value="All">All Planets</option>
                  {["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-1.5 opacity-50 px-1", theme === 'dark' ? "text-white" : "text-slate-900")}>Influence Category</label>
                <select 
                  value={natalTransitCategoryFilter}
                  onChange={(e) => setNatalTransitCategoryFilter(e.target.value)}
                  className={cn(
                    "w-full bg-transparent border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-jyotish-gold/50 transition-all",
                    theme === 'dark' ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                  )}
                >
                  <option value="All">All Categories</option>
                  <option value="major">Major (Slow Moving)</option>
                  <option value="minor">Minor (Fast Moving)</option>
                </select>
              </div>
              <div>
                <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-1.5 opacity-50 px-1", theme === 'dark' ? "text-white" : "text-slate-900")}>Impact Intensity</label>
                <select 
                  value={natalTransitIntensityFilter}
                  onChange={(e) => setNatalTransitIntensityFilter(e.target.value)}
                  className={cn(
                    "w-full bg-transparent border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-jyotish-gold/50 transition-all",
                    theme === 'dark' ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                  )}
                >
                  <option value="All">All Intensities</option>
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>
              </div>
            </div>

            {/* Comparison Data */}
            {isBirthMode && natalComparisons && (
              <div className="space-y-8">
                {(() => {
                  const filtered = natalComparisons
                    .filter(c => natalTransitPlanetFilter === 'All' || c.planet === natalTransitPlanetFilter)
                    .filter(c => natalTransitCategoryFilter === 'All' || c.category === natalTransitCategoryFilter)
                    .filter(c => natalTransitIntensityFilter === 'All' || c.intensity === natalTransitIntensityFilter);

                  const major = filtered.filter(c => c.category === 'major');
                  const minor = filtered.filter(c => c.category === 'minor');

                  return (
                    <>
                      {/* Major Influences */}
                      {(natalTransitCategoryFilter === 'All' || natalTransitCategoryFilter === 'major') && (
                        <div className="space-y-4">
                          <div className={cn("text-[10px] uppercase tracking-[0.2em] font-mono flex items-center gap-2", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Macro Cycles & Foundations
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {major.map((comparison, i) => (
                              <div key={i} className={cn("p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden group transition-all hover:border-jyotish-gold/30", theme === 'dark' ? "bg-mystic-purple/20 border-jyotish-gold/10" : "bg-white border-slate-100 shadow-sm")}>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Activity className="w-12 h-12" />
                                </div>
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg", theme === 'dark' ? "bg-jyotish-gold/10 text-jyotish-gold" : "bg-orange-50 text-orange-600")}>
                                        <PlanetGlyph name={comparison.planet} className="text-2xl" />
                                      </div>
                                      <div>
                                        <div className={cn("text-[10px] font-mono uppercase tracking-widest leading-none mb-1 opacity-60")}>Transit Influence</div>
                                        <div className={cn("text-base font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                          {comparison.planet} {comparison.type === 'conjunction' ? 'Alignment' : comparison.type === 'aspect' ? 'Drishti' : 'Movement'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={cn("text-[9px] uppercase tracking-widest font-mono px-3 py-1 rounded-full font-bold", comparison.intensity === 'high' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "bg-jyotish-gold/10 text-jyotish-gold border border-jyotish-gold/20")}>
                                      {comparison.intensity}
                                    </div>
                                  </div>
                                  <div className={cn("text-xs font-semibold mb-2 flex items-center gap-1.5", theme === 'dark' ? "text-white/90" : "text-slate-800")}>
                                    <div className="w-1 h-1 rounded-full bg-jyotish-gold" />
                                    {comparison.description}
                                  </div>
                                  <p className={cn("text-xs leading-relaxed mb-5", theme === 'dark' ? "text-white/60" : "text-slate-500")}>{comparison.interpretation}</p>
                                  
                                  {comparison.startDate && comparison.endDate && (
                                    <div className={cn("mb-5 flex items-center gap-4 text-[10px] font-mono p-2.5 rounded-xl border", theme === 'dark' ? "bg-black/20 border-white/5 text-white/40" : "bg-slate-50 border-slate-100 text-slate-500")}>
                                      <div className="flex items-center gap-1.5 flex-1">
                                        <span className="opacity-50">FROM</span>
                                        <span className={theme === 'dark' ? "text-white/80" : "text-slate-900"}>{format(comparison.startDate, 'MMM d, yyyy')}</span>
                                      </div>
                                      <div className="w-px h-3 bg-current opacity-10" />
                                      <div className="flex items-center gap-1.5 flex-1">
                                        <span className="opacity-50">UNTIL</span>
                                        <span className={theme === 'dark' ? "text-white/80" : "text-slate-900"}>{format(comparison.endDate, 'MMM d, yyyy')}</span>
                                      </div>
                                    </div>
                                  )}

                                  {comparison.actionableAdvice && (
                                    <div className={cn("p-4 rounded-2xl border leading-relaxed", theme === 'dark' ? "bg-black/40 border-jyotish-gold/20 text-jyotish-gold/90" : "bg-slate-50 border-slate-200 text-slate-700")}>
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <Sparkles className="w-3 h-3 opacity-60" />
                                        <span className="font-bold uppercase tracking-widest text-[9px] opacity-60">Sage Guidance</span>
                                      </div>
                                      <p className="text-[11px] font-medium leading-relaxed italic">{comparison.actionableAdvice}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {major.length === 0 && (
                              <div className={cn("text-[11px] italic py-8 text-center border-2 border-dashed rounded-3xl opacity-30", theme === 'dark' ? "border-white/10" : "border-slate-200")}>
                                No major karmic shifts detected in this category.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Minor Influences */}
                      {(natalTransitCategoryFilter === 'All' || natalTransitCategoryFilter === 'minor') && (
                        <div className="space-y-4">
                          <div className={cn("text-[10px] uppercase tracking-[0.2em] font-mono flex items-center gap-2", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Daily Environmental Rhythms
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {minor.map((comparison, i) => (
                              <div key={i} className={cn("p-5 rounded-3xl border transition-all hover:bg-white/[0.05] active:scale-[0.98]", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs", theme === 'dark' ? "bg-white/5 text-white/80" : "bg-slate-50 text-slate-600")}>
                                      <PlanetGlyph name={comparison.planet} className="text-base" />
                                    </div>
                                    <div className={cn("text-xs font-bold", comparison.intensity === 'medium' ? "text-blue-400" : "text-slate-400")}>
                                      {comparison.planet} {comparison.type === 'conjunction' ? 'Alignment' : 'Aspect'}
                                    </div>
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-blue-400/30" />
                                </div>
                                <div className={cn("text-[11px] font-semibold leading-tight mb-2", theme === 'dark' ? "text-white/80" : "text-slate-700")}>{comparison.description}</div>
                                <p className={cn("text-[10px] leading-relaxed mb-3", theme === 'dark' ? "text-white/50 font-light" : "text-slate-600")}>{comparison.interpretation}</p>
                                
                                {comparison.startDate && comparison.endDate && (
                                  <div className={cn("flex items-center gap-4 text-[9px] font-mono p-2 rounded-xl border", theme === 'dark' ? "bg-black/20 border-white/5 text-white/40" : "bg-slate-50 border-slate-100 text-slate-500")}>
                                    <div className="flex items-center gap-1 justify-between flex-1">
                                      <span className="opacity-50">START</span>
                                      <span className={theme === 'dark' ? "text-white/80" : "text-slate-900"}>{format(comparison.startDate, 'MMM d')}</span>
                                    </div>
                                    <div className="w-px h-2 bg-current opacity-10" />
                                    <div className="flex items-center gap-1 justify-between flex-1">
                                      <span className="opacity-50">END</span>
                                      <span className={theme === 'dark' ? "text-white/80" : "text-slate-900"}>{format(comparison.endDate, 'MMM d')}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            {minor.length === 0 && (
                              <div className={cn("col-span-full text-[11px] italic py-8 text-center border-2 border-dashed rounded-3xl opacity-30", theme === 'dark' ? "border-white/10" : "border-slate-200")}>
                                The current sky is harmonizing with your secondary placements.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'blueprint' && (
          <div className="space-y-6 pb-20">
            {birthSpecialPoints ? (
              <LifeBlueprintSection result={birthSpecialPoints} birthPositions={birthPositions} />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Compass className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/40">Enter birth details to unlock your cosmic blueprint.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rectify' && (
          <div className="pb-20">
            <RectifySection 
              birthTime={birthTime}
              setBirthTime={setBirthTime}
              rectifyTime={rectifyTime}
              setRectifyTime={setRectifyTime}
              isRectifying={isRectifying}
              setIsRectifying={setIsRectifying}
              birthPositions={birthPositions}
              rectifiedPositions={rectifiedPositions}
            />
          </div>
        )}

        {activeTab === 'yogas' && (
          <div className="space-y-4 pb-20">
            {(isBirthMode ? natalYogas : yogas).map((yoga, i) => {
              const isAuspicious = yoga.type === 'auspicious';
              const isNeutral = yoga.type === 'neutral';
              const iconColor = isAuspicious ? 'text-green-500' : isNeutral ? 'text-blue-500' : 'text-red-500';
              const bgColor = isAuspicious ? 'bg-green-500/10' : isNeutral ? 'bg-blue-500/10' : 'bg-red-500/10';

              return (
                <div key={i} className={cn("p-5 rounded-3xl border transition-all active:scale-[0.98]", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl", bgColor)}>
                        {yoga.icon ? (
                          <span>{yoga.icon}</span>
                        ) : (
                          isAuspicious ? <Sparkles className={cn("w-5 h-5", iconColor)} /> : <Flame className={cn("w-5 h-5", iconColor)} />
                        )}
                      </div>
                      <div>
                        <div className={cn("font-bold text-base leading-tight flex items-center gap-2", theme === 'dark' ? "text-white" : "text-slate-800")}>
                          {yoga.name}
                          {yoga.strength === 'strong' && (
                            <div className="w-4 h-4 bg-jyotish-gold/20 rounded-full flex items-center justify-center">
                              <Zap className="w-2.5 h-2.5 text-jyotish-gold fill-jyotish-gold" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn("text-[9px] uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 rounded-md", bgColor, iconColor)}>
                            {yoga.type}
                          </div>
                          {yoga.category && (
                            <div className="text-[9px] uppercase tracking-widest font-mono font-medium text-slate-500 bg-slate-500/5 px-1.5 py-0.5 rounded-md">
                              {yoga.category.replace('_', ' ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {yoga.bphsReference && (
                      <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border", theme === 'dark' ? "bg-white/5 border-white/5 text-white/40" : "bg-slate-50 border-slate-100 text-slate-400")}>
                        <BookOpen className="w-3 h-3" />
                        <span className="text-[9px] font-mono leading-none">{yoga.bphsReference}</span>
                      </div>
                    )}
                  </div>
                  <div className={cn("text-xs leading-relaxed mb-4", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
                    {yoga.description}
                  </div>
                  
                  {yoga.implication && (
                    <div className={cn("text-[11px] mb-4 p-3.5 rounded-2xl border leading-relaxed", theme === 'dark' ? "bg-black/40 border-jyotish-gold/10 text-jyotish-gold/80" : "bg-orange-50/50 border-orange-100 text-slate-700")}>
                      <span className="font-bold uppercase tracking-widest text-[8px] block mb-1.5 opacity-60">Implication</span>
                      {yoga.implication}
                    </div>
                  )}
                  
                  {/* Involved Planets with Nakshatra detail */}
                  {yoga.planets && yoga.planets.length > 0 && (
                    <div className={cn("pt-4 border-t", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
                      <div className={cn("text-[9px] uppercase tracking-widest font-mono mb-2.5", theme === 'dark' ? "text-white/25" : "text-slate-400")}>Involved Planets & Nakshatras</div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(yoga.planets || [])).map((planetName: string) => {
                          const planetData = (isBirthMode ? birthPositions : positions)?.find(p => p.name === planetName);
                          if (!planetData) return null;
                          const nak = NAKSHATRA_DATA[planetData.nakshatra as keyof typeof NAKSHATRA_DATA];
                          return (
                            <div
                              key={planetName}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border",
                                theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-slate-50 border-slate-100"
                              )}
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                                style={{ backgroundColor: planetData.color, color: '#000' }}
                              >
                                {planetData.symbol}
                              </div>
                              <div>
                                <div className={cn("text-[10px] font-bold leading-none", theme === 'dark' ? "text-white/70" : "text-slate-700")}>{planetName}</div>
                                <div className={cn("text-[9px] mt-0.5", theme === 'dark' ? "text-jyotish-gold/50" : "text-orange-500")}>
                                  {planetData.nakshatra} P{planetData.pada}
                                </div>
                                {nak && (
                                  <div className={cn("text-[8px] leading-tight mt-0.5", theme === 'dark' ? "text-white/25" : "text-slate-400")}>
                                    {(nak as any).lord} · {(nak as any).deity}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI Interpretation */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    {yogaInterpretations[yoga.name] ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 bg-jyotish-gold/5 p-4 rounded-2xl border border-jyotish-gold/10"
                      >
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-3 h-3 text-jyotish-gold" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-jyotish-gold/60">Vedic Insight (AI)</span>
                        </div>
                        <p className={cn("text-xs leading-relaxed italic font-serif", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
                          "{yogaInterpretations[yoga.name]}"
                        </p>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => generateYogaInterpretation(yoga.name, yoga.description)}
                        disabled={isYogaAiLoading === yoga.name}
                        className={cn(
                          "w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border active:scale-95 shadow-sm",
                          theme === 'dark' 
                            ? "bg-jyotish-gold/10 text-jyotish-gold border-jyotish-gold/20 hover:bg-jyotish-gold/20" 
                            : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                        )}
                      >
                        {isYogaAiLoading === yoga.name ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Consulting Akashic Records...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Explain Significance with AI
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {(isBirthMode ? natalYogas : yogas).length === 0 && <div className="text-center text-white/40 text-sm py-12 px-6">No yogas detected in this chart.</div>}
          </div>
        )}

        {activeTab === 'transits' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className={cn("p-4 rounded-2xl border flex flex-col gap-4", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Filter by Planet</label>
                  <select 
                    value={transitPlanetFilter}
                    onChange={(e) => setTransitPlanetFilter(e.target.value)}
                    className={cn(
                      "w-full bg-transparent border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-jyotish-gold/50",
                      theme === 'dark' ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="All">All Planets</option>
                    {["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Filter by Type</label>
                  <select 
                    value={transitTypeFilter}
                    onChange={(e) => setTransitTypeFilter(e.target.value)}
                    className={cn(
                      "w-full bg-transparent border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-jyotish-gold/50",
                      theme === 'dark' ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="All">All Types</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              </div>
            </div>

            {transits
              .filter(t => transitPlanetFilter === 'All' || t.planets.includes(transitPlanetFilter))
              .filter(t => transitTypeFilter === 'All' || t.type === transitTypeFilter)
              .map((transit, i) => (
              <div key={i} className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-mystic-purple/20 border-jyotish-gold/10" : "bg-white border-slate-100 shadow-sm")}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm text-jyotish-gold">{transit.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Array.from(new Set(transit.planets || [])).map(p => (
                         <span key={p} className={cn("flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase", theme === 'dark' ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500")}>
                           <PlanetGlyph name={p} className="scale-75 opacity-70" />
                           {p}
                         </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => interpretTransit(transit)}
                    className={cn("p-1.5 rounded-lg border transition-colors flex items-center gap-1", theme === 'dark' ? "bg-black/40 border-jyotish-gold/20 hover:bg-jyotish-gold/20 text-jyotish-gold" : "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-600")}
                    title="AI Interpretation"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-mono uppercase tracking-wider">Interpret</span>
                  </button>
                </div>
                <div className={cn("text-xs mb-3", theme === 'dark' ? "text-white/60" : "text-slate-500")}>{transit.description}</div>
                
                {transit.startDate && transit.endDate && (
                  <div className={cn("flex items-center gap-4 text-[10px] font-mono p-2.5 rounded-xl border", theme === 'dark' ? "bg-black/20 border-white/5 text-white/40" : "bg-slate-50 border-slate-100 text-slate-500")}>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="opacity-50">FROM</span>
                      <span className={theme === 'dark' ? "text-white/80" : "text-slate-900"}>{format(transit.startDate, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="w-px h-3 bg-current opacity-10" />
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="opacity-50">UNTIL</span>
                      <span className={theme === 'dark' ? "text-white/80" : "text-slate-900"}>{format(transit.endDate, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {transits.filter(t => (transitPlanetFilter === 'All' || t.planets.includes(transitPlanetFilter)) && (transitTypeFilter === 'All' || t.type === transitTypeFilter)).length === 0 && (
              <div className={cn("text-center text-sm py-8", theme === 'dark' ? "text-white/40" : "text-slate-400")}>No transits match your filters.</div>
            )}
          </div>
        )}
        {activeTab === 'upcoming' && (
          <div className="space-y-3 pb-20">
            {/* Filters */}
            <div className={cn("p-4 rounded-2xl border flex flex-col gap-4 mb-4", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Filter by Planet</label>
                  <select 
                    value={upcomingPlanetFilter}
                    onChange={(e) => setUpcomingPlanetFilter(e.target.value)}
                    className={cn(
                      "w-full bg-transparent border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-jyotish-gold/50",
                      theme === 'dark' ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="All">All Planets</option>
                    {["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Filter by Type</label>
                  <select 
                    value={upcomingTypeFilter}
                    onChange={(e) => setUpcomingTypeFilter(e.target.value)}
                    className={cn(
                      "w-full bg-transparent border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-jyotish-gold/50",
                      theme === 'dark' ? "border-white/10 text-white" : "border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="All">All Types</option>
                    <option value="Natal">Natal Influences</option>
                    <option value="Rashi">Rashi Change</option>
                    <option value="Nakshatra">Nakshatra Change</option>
                    <option value="Natal Conjunction">Natal Conjunction</option>
                    <option value="Natal Aspect">Natal Aspect</option>
                    <option value="House Change">House Change</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Timeframe</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      {[
                        { id: '7', label: '7D' },
                        { id: '14', label: '14D' },
                        { id: '30', label: '30D' },
                        { id: 'custom', label: 'Custom' }
                      ].map((tf) => (
                        <button
                          key={tf.id}
                          onClick={() => setUpcomingTimeframeFilter(tf.id)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all",
                            upcomingTimeframeFilter === tf.id 
                              ? "bg-jyotish-gold border-jyotish-gold text-black font-bold" 
                              : theme === 'dark' ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 border-slate-200 text-slate-500"
                          )}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                    {upcomingTimeframeFilter === 'custom' && (
                      <DateRangePicker 
                        range={dateRange} 
                        onChange={setDateRange} 
                        theme={theme} 
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {upcomingTransits === null && (
              <div className={cn("text-center py-16 px-8 rounded-3xl border border-dashed", theme === 'dark' ? "border-white/10 bg-white/[0.01]" : "border-slate-200 bg-slate-50/50")}>
                <Loader2 className="w-8 h-8 text-jyotish-gold/60 animate-spin mx-auto mb-3" />
                <p className={cn("text-xs opacity-40", theme === 'dark' ? "text-white" : "text-slate-500")}>Computing upcoming transits…</p>
              </div>
            )}

            {(upcomingTransits ?? [])
              .filter(t => upcomingPlanetFilter === 'All' || t.planet === upcomingPlanetFilter)
              .filter(t => {
                if (upcomingTypeFilter === 'All') return true;
                if (upcomingTypeFilter === 'Natal') {
                  return t.type === 'Natal Conjunction' || t.type === 'Natal Aspect' || t.type === 'House Change';
                }
                return t.type === upcomingTypeFilter;
              })
              .filter(t => {
                if (upcomingTimeframeFilter === 'custom') {
                  return isWithinInterval(t.date, { start: dateRange.from, end: dateRange.to });
                }
                const daysDiff = (t.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                return daysDiff <= parseInt(upcomingTimeframeFilter);
              })
              .map((transit, i, filteredArray) => {
              const isImportant = transit.isImportant;
              const isNatalConj = transit.type === 'Natal Conjunction';
              const isNatalAspect = transit.type === 'Natal Aspect';
              const isHouseChange = transit.type === 'House Change';
              const isNatalImpact = isNatalConj || isNatalAspect || isHouseChange;
              const daysRemaining = Math.ceil((transit.date.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
              
              const title = isNatalConj 
                ? `Conjoins Natal ${transit.to}`
                : isNatalAspect
                ? `Aspects Natal ${transit.to}`
                : isHouseChange
                ? `Enters ${transit.to}`
                : `Enters ${transit.to}`;

              const sub = isNatalConj
                ? `Direct Alignment`
                : isNatalAspect
                ? `${transit.aspectType} activation`
                : isHouseChange
                ? `New sector focused`
                : `Leaving ${transit.from}`;

              return (
                <div key={i} className="relative pl-8">
                  {/* Timeline connector */}
                  {i < filteredArray.length - 1 && (
                    <div className={cn(
                      "absolute left-[14px] top-[40px] bottom-0 w-px",
                      theme === 'dark' ? "bg-white/10" : "bg-slate-200"
                    )} />
                  )}
                  
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-2 top-[34px] w-3 h-3 rounded-full border-2 z-10",
                    isImportant 
                      ? "bg-jyotish-gold border-black" 
                      : isNatalImpact 
                      ? "bg-blue-500 border-white" 
                      : theme === 'dark' ? "bg-white/20 border-black" : "bg-slate-300 border-white"
                  )} />

                  <div className={cn(
                    "p-5 rounded-3xl border flex items-center justify-between transition-all active:scale-[0.98] mb-6", 
                    theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm",
                    isImportant && (theme === 'dark' ? "border-jyotish-gold/40 bg-jyotish-gold/5" : "border-jyotish-gold/40 bg-jyotish-gold/5 shadow-jyotish-gold/10"),
                    isNatalImpact && !isImportant && (theme === 'dark' ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50/30")
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center relative",
                        isImportant 
                          ? "bg-jyotish-gold text-black" 
                          : isNatalImpact
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-jyotish-gold/10 text-jyotish-gold"
                      )}>
                        <PlanetGlyph name={transit.planet} className="scale-125" />
                        {isNatalImpact && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-black">
                            {transit.to[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={cn(
                          "font-bold text-sm flex items-center gap-1.5", 
                          isImportant ? "text-jyotish-gold" : isNatalImpact ? (theme === 'dark' ? "text-blue-400" : "text-blue-600") : "text-jyotish-gold/80"
                        )}>
                          <span>{transit.planet} {title}</span>
                          <span className={cn(
                            "text-[8px] px-1 py-0.5 rounded uppercase tracking-tighter",
                            daysRemaining <= 3 ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/40"
                          )}>
                            In {daysRemaining === 0 ? 'Today' : `${daysRemaining}d`}
                          </span>
                        </div>
                        <div className={cn("text-[10px] uppercase tracking-widest font-mono mt-0.5", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                          {sub}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => interpretPrediction(transit)}
                        className={cn("p-1.5 rounded-lg border transition-colors flex items-center gap-1", theme === 'dark' ? "bg-black/40 border-jyotish-gold/20 hover:bg-jyotish-gold/20 text-jyotish-gold" : "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-600")}
                        title="AI Interpretation"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-mono uppercase tracking-wider">Interpret</span>
                      </button>
                      <div className="text-right">
                        <div className={cn("text-xs font-bold", theme === 'dark' ? "text-white/80" : "text-slate-900")}>{format(transit.date, 'MMM d')}</div>
                        <div className={cn("text-[9px] font-mono uppercase tracking-tighter", theme === 'dark' ? "text-white/20" : "text-slate-400")}>{format(transit.date, 'yyyy')}</div>
                        {isImportant && (
                          <div className="mt-1">
                            <span className="text-[8px] font-bold uppercase tracking-tighter bg-jyotish-gold/20 text-jyotish-gold px-1.5 py-0.5 rounded">High Probability</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {upcomingTransits && upcomingTransits.filter(t => {
              const daysDiff = (t.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
              const matchesType = upcomingTypeFilter === 'All' || 
                                 (upcomingTypeFilter === 'Natal' && (t.type === 'Natal Conjunction' || t.type === 'Natal Aspect' || t.type === 'House Change')) ||
                                 t.type === upcomingTypeFilter;
              return (upcomingPlanetFilter === 'All' || t.planet === upcomingPlanetFilter) && 
                     matchesType &&
                     daysDiff <= parseInt(upcomingTimeframeFilter);
            }).length === 0 && (
              <div className={cn("text-center text-sm py-12 px-6", theme === 'dark' ? "text-white/40" : "text-slate-400")}>No upcoming transits match your filters.</div>
            )}
          </div>
        )}

        {activeTab === 'muhurta' && (
          <div className="space-y-6 pb-20">
            <div className={cn("p-5 rounded-3xl border space-y-6", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
              <div>
                <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Step 1: Event Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CAREER', icon: Briefcase },
                    { id: 'MARRIAGE', icon: HeartPulse },
                    { id: 'PROPERTY', icon: MapPin },
                    { id: 'GENERAL', icon: LayoutGrid }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setMuhurtaEventType(cat.id as EventCategory)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                        muhurtaEventType === cat.id 
                          ? "bg-jyotish-gold border-jyotish-gold text-black shadow-lg shadow-jyotish-gold/20" 
                          : theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-slate-50 border-slate-200 text-slate-500"
                      )}
                    >
                      <cat.icon className="w-3 h-3" />
                      {cat.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={cn("block text-[10px] font-mono uppercase tracking-widest mb-3", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Step 2: Time Window</label>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {[
                      { id: 7, label: '7 Days' },
                      { id: 14, label: '14 Days' },
                      { id: 30, label: '30 Days' },
                      { id: -1, label: 'Custom' }
                    ].map((tf) => (
                      <button
                        key={tf.id}
                        onClick={() => setMuhurtaDays(tf.id)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all",
                          muhurtaDays === tf.id 
                            ? "bg-jyotish-gold border-jyotish-gold text-black font-bold" 
                            : theme === 'dark' ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 border-slate-200 text-slate-500"
                        )}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                  {muhurtaDays === -1 && (
                    <DateRangePicker 
                      range={dateRange} 
                      onChange={setDateRange} 
                      theme={theme} 
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="text-[10px] uppercase tracking-widest font-mono text-white/40">Parashari Synthesis (Top Windows)</div>
                {muhurtaResults && muhurtaResults.length > 0 && <span className="text-[9px] font-mono text-jyotish-gold/60">{muhurtaResults.length} windows found</span>}
              </div>

              {currentDashas && currentDashas[0] && (
                <div className={cn("p-4 rounded-2xl border flex items-start gap-3", theme === 'dark' ? "bg-jyotish-gold/5 border-jyotish-gold/20" : "bg-orange-50 border-orange-200")}>
                  <Info className="w-4 h-4 text-jyotish-gold shrink-0 mt-0.5" />
                  <p className={cn("text-xs font-medium italic", theme === 'dark' ? "text-jyotish-gold" : "text-orange-700")}>
                    {getDashaWarning(`${currentDashas[0].lord} ${currentDashas[1]?.lord ? `- ${currentDashas[1].lord}` : ''}`)}
                  </p>
                </div>
              )}

              {muhurtaResults && muhurtaResults.map((result, i) => (
                <div key={i} className={cn("p-6 rounded-3xl border transition-all relative overflow-hidden group", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                   {/* Background Decorative Element */}
                   <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Compass className="w-32 h-32 text-jyotish-gold" />
                  </div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", 
                        result.score >= 80 ? "bg-green-500 text-white" : 
                        result.score >= 50 ? "bg-jyotish-gold text-black" : 
                        "bg-orange-500 text-white"
                      )}>
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div>
                        <div className={cn("font-bold text-base", theme === 'dark' ? "text-white" : "text-slate-900")}>
                          {format(result.start, 'EEEE, MMM d')}
                        </div>
                        <div className={cn("text-[11px] font-mono flex items-center gap-2", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                          <Clock className="w-3 h-3 text-jyotish-gold" />
                          {format(result.start, 'h:mm a')} — {format(result.end, 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                       <div className={cn("px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-inner flex flex-col items-end", 
                        result.score >= 80 ? "bg-green-500/20 text-green-500" : 
                        result.score >= 50 ? "bg-jyotish-gold/20 text-jyotish-gold" : 
                        "bg-orange-500/20 text-orange-500"
                      )}>
                        <span className="text-[10px] opacity-60 font-medium tracking-widest">SYNTHESIS</span>
                        {result.score}
                      </div>
                    </div>
                  </div>

                  {/* Synthesis Meters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative z-10">
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest opacity-40">
                          <span>Cosmic Weather</span>
                          <span>{result.globalScore}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(result.globalScore / 40) * 100}%` }}
                            className="h-full bg-blue-400"
                          />
                       </div>
                       <div className="text-[8px] font-mono opacity-30 uppercase tracking-tighter truncate">
                          Panchang: {result.panchang.tithi.name}, {result.panchang.vara}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-jyotish-gold/60">
                          <span>Personal Resonance</span>
                          <span>{result.individualScore}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(result.individualScore / 100) * 100}%` }}
                            className="h-full bg-jyotish-gold"
                          />
                       </div>
                       <div className="text-[8px] font-mono opacity-30 uppercase tracking-tighter truncate">
                          Chart authority applied
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex flex-wrap gap-1.5">
                      {result.vargottamaLagna && (
                        <span className="px-2 py-0.5 rounded-md bg-jyotish-gold/10 text-jyotish-gold text-[9px] font-bold uppercase tracking-widest border border-jyotish-gold/20 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Vargottama Lagna
                        </span>
                      )}
                      {result.vargottamaMoon && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" /> Vargottama Moon
                        </span>
                      )}
                      {result.reasons && result.reasons.slice(0, 3).map((r, idx) => (
                        <span key={idx} className={cn("px-2 py-0.5 rounded-md text-[9px] font-medium tracking-wide flex items-center gap-1 border", theme === 'dark' ? "bg-white/5 border-white/10 text-white/50" : "bg-slate-50 border-slate-200 text-slate-500")}>
                          <CheckCircle2 className="w-2.5 h-2.5 text-green-500/60" /> {r}
                        </span>
                      ))}
                    </div>

                    {muhurtaInterpretations[result.start.toISOString()] ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("p-4 rounded-2xl border space-y-3", theme === 'dark' ? "bg-black/40 border-jyotish-gold/20" : "bg-orange-50 border-orange-200")}
                      >
                        <div className="flex items-center gap-1.5 opacity-60 text-[9px] font-bold uppercase tracking-widest text-jyotish-gold">
                          <Brain className="w-3.5 h-3.5" /> Muhurta Insight (AI)
                        </div>
                        <p className={cn("text-xs leading-relaxed italic font-serif", theme === 'dark' ? "text-white/80" : "text-slate-800")}>
                          {muhurtaInterpretations[result.start.toISOString()]}
                        </p>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => generateMuhurtaInterpretation(result)}
                        disabled={!!isMuhurtaAiLoading}
                        className={cn(
                          "w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all border active:scale-95 shadow-sm group",
                          theme === 'dark' 
                            ? "bg-jyotish-gold/10 text-jyotish-gold border-jyotish-gold/20 hover:bg-jyotish-gold/20" 
                            : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                        )}
                      >
                        {isMuhurtaAiLoading === result.start.toISOString() ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Synthesizing Cosmos...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Reveal The "Why" & Dasha Warning
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Idle — user hasn't run the calculation yet */}
              {muhurtaResults === null && !isMuhurtaCalculating && (
                <div className={cn("text-center py-16 px-8 rounded-3xl border border-dashed", theme === 'dark' ? "border-white/10 bg-white/[0.01]" : "border-slate-200 bg-slate-50/50")}>
                  <div className="w-16 h-16 bg-jyotish-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-8 h-8 text-jyotish-gold/60" />
                  </div>
                  <h4 className={cn("text-sm font-bold mb-2", theme === 'dark' ? "text-white/70" : "text-slate-700")}>Ready to Find Auspicious Windows</h4>
                  <p className={cn("text-xs opacity-50 max-w-xs mx-auto mb-6", theme === 'dark' ? "text-white" : "text-slate-500")}>
                    Select your event category and time window above, then tap Calculate to find your best Muhurta windows.
                  </p>
                  <button
                    onClick={handleCalculateMuhurta}
                    disabled={!birthPositions || !location}
                    className={cn(
                      "inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border shadow-lg active:scale-95",
                      birthPositions && location
                        ? "bg-jyotish-gold text-black border-jyotish-gold hover:bg-jyotish-gold/90 shadow-jyotish-gold/30"
                        : theme === 'dark' ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Calculate Muhurta Windows
                  </button>
                </div>
              )}

              {/* Calculating — show spinner */}
              {isMuhurtaCalculating && (
                <div className={cn("text-center py-16 px-8 rounded-3xl border border-dashed", theme === 'dark' ? "border-white/10 bg-white/[0.01]" : "border-slate-200 bg-slate-50/50")}>
                  <Loader2 className="w-10 h-10 text-jyotish-gold animate-spin mx-auto mb-4" />
                  <h4 className={cn("text-sm font-bold mb-1", theme === 'dark' ? "text-white/70" : "text-slate-700")}>Scanning Cosmic Alignments…</h4>
                  <p className={cn("text-xs opacity-40", theme === 'dark' ? "text-white" : "text-slate-500")}>Analysing {muhurtaDays === -1 ? 'custom range' : `${muhurtaDays}-day window`}</p>
                </div>
              )}

              {/* Calculated — no results */}
              {muhurtaResults !== null && muhurtaResults.length === 0 && (
                <div className={cn("text-center py-16 px-8 rounded-3xl border border-dashed", theme === 'dark' ? "border-white/10 bg-white/[0.01]" : "border-slate-200 bg-slate-50/50")}>
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 grayscale">
                    <CalendarDays className="w-8 h-8 opacity-20" />
                  </div>
                  <h4 className={cn("text-sm font-bold mb-2", theme === 'dark' ? "text-white/60" : "text-slate-600")}>No Auspicious Windows Found</h4>
                  <p className={cn("text-xs opacity-50 max-w-xs mx-auto mb-4", theme === 'dark' ? "text-white" : "text-slate-500")}>
                    The elimination filters are currently very strict. Try a different event category or expand your search window.
                  </p>
                  <button
                    onClick={handleCalculateMuhurta}
                    className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border", theme === 'dark' ? "bg-white/5 border-white/10 text-white/50 hover:bg-white/10" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Recalculate
                  </button>
                </div>
              )}
            </div>

            <div className={cn("p-4 rounded-2xl border text-[10px] leading-relaxed flex items-start gap-3", theme === 'dark' ? "bg-blue-500/5 border-blue-500/20 text-blue-400/80" : "bg-blue-50 border-blue-200 text-blue-600")}>
               <Info className="w-4 h-4 shrink-0 mt-0.5" />
               <div>
                  <span className="font-bold underline">Engine Note:</span> Every window above has survived deep vetoes including Tarabala, Chandrabala, Rahu Kaal, and Rikta Tithi filters. Scores are then generated using Parashari synthesis of Ascendant strength, Vargottama status, and specific event indicators.
               </div>
            </div>
          </div>
        )}
        {activeTab === 'dashas' && (
          <div className="space-y-6 pb-20">
            {!isBirthMode || !birthPositions ? (
              <div className="text-center text-white/40 text-sm py-12 px-6">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 opacity-20" />
                </div>
                Please enter your birth details in the Natal tab to view your Vimshottari Dasha.
              </div>
            ) : currentDashas ? (
              <div className="space-y-6">
                <div className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-mystic-purple/40 border-jyotish-gold/20" : "bg-orange-50 border-orange-200")}>
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-jyotish-gold" />
                    <h3 className="text-lg font-bold text-jyotish-gold uppercase tracking-tighter">Current Dasha Sequence</h3>
                  </div>
                  
                  <div className="space-y-4 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-jyotish-gold/20" />
                    
                    {currentDashas.map((dasha, idx) => {
                      const daysRemaining = differenceInDays(dasha.end, currentTime);
                      const totalDuration = differenceInDays(dasha.end, dasha.start);
                      const progress = Math.max(0, Math.min(100, (differenceInDays(currentTime, dasha.start) / totalDuration) * 100));

                      return (
                        <div key={idx} className={cn(
                          "relative pl-10 transition-all",
                          idx === 0 ? "scale-100 opacity-100" : "scale-[0.98] opacity-80"
                        )}>
                          {/* Dot */}
                          <div className={cn(
                            "absolute left-0 top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10",
                            idx === 0 ? "bg-jyotish-gold border-jyotish-gold text-black" : "bg-black border-jyotish-gold/40 text-jyotish-gold"
                          )}>
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          </div>
                          
                          <div className={cn(
                            "p-4 rounded-2xl border shadow-sm relative overflow-hidden",
                            idx === 0 ? "bg-jyotish-gold/10 border-jyotish-gold/30" : 
                            theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100"
                          )}>
                            {/* Progress bar background for current dasha */}
                            {idx === 0 && (
                              <div className="absolute bottom-0 left-0 h-0.5 bg-jyotish-gold/20 w-full">
                                <div 
                                  className="h-full bg-jyotish-gold transition-all duration-1000" 
                                  style={{ width: `${progress}%` }} 
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                              <span className={cn(
                                "text-[8px] uppercase tracking-widest font-mono",
                                idx === 0 ? "text-jyotish-gold font-bold" : "text-white/40"
                              )}>
                                {idx === 0 ? 'Mahadasha' : idx === 1 ? 'Antardasha' : idx === 2 ? 'Pratyantardasha' : idx === 3 ? 'Sookshmadasha' : 'Pranadasha'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-white/30">
                                  {format(dasha.start, 'dd MMM yyyy')} — {format(dasha.end, 'dd MMM yyyy')}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-end justify-between">
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "font-bold flex items-center gap-2",
                                  idx === 0 ? "text-2xl text-white" : "text-lg text-white/90"
                                )}>
                                  <PlanetGlyph name={dasha.lord} className={cn("opacity-80", idx === 0 ? "text-3xl" : "text-xl")} />
                                  {dasha.lord}
                                </span>
                                <div className={cn(
                                  "text-[9px] font-mono uppercase tracking-tighter",
                                  theme === 'dark' ? "text-white/40" : "text-slate-400"
                                )}>
                                  Planetary Ruler
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className={cn(
                                  "text-xs font-bold font-mono",
                                  daysRemaining > 30 ? "text-jyotish-gold" : "text-orange-500"
                                )}>
                                  {daysRemaining.toLocaleString()} days
                                </div>
                                <div className="text-[8px] font-mono uppercase tracking-tighter text-white/20">
                                  remaining
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Synthesized Reading */}
                {currentDashas.length >= 3 && birthPositions && (
                  <div className={cn("p-5 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-jyotish-gold/20" : "bg-orange-50 border-orange-200")}>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-jyotish-gold" />
                      <h3 className="text-lg font-medium text-jyotish-gold">Current Dasha Reading</h3>
                    </div>
                    <div className="space-y-4 text-sm leading-relaxed">
                      {(() => {
                        const md = currentDashas[0].lord;
                        const ad = currentDashas[1].lord;
                        const pd = currentDashas[2].lord;
                        const sd = currentDashas[3]?.lord;
                        const prd = currentDashas[4]?.lord;

                        const mdPlanet = birthPositions.find(p => p.name === md);
                        const adPlanet = birthPositions.find(p => p.name === ad);
                        const pdPlanet = birthPositions.find(p => p.name === pd);

                        if (!mdPlanet || !adPlanet || !pdPlanet) return null;

                        return (
                          <>
                            <p className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>
                              <strong className="text-jyotish-gold">The Major Chapter (Mahadasha):</strong> You are currently in the major period of <strong>{md}</strong>. This sets the overarching theme of your life for several years, focusing heavily on <em>{getPlanetKeywords(md)}</em>. Because {md} is placed in your {getOrdinal(mdPlanet.house || 1)} house in the sign of {mdPlanet.rashi}, these themes will manifest strongly through the affairs of that house.
                            </p>
                            <p className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>
                              <strong className="text-jyotish-gold">The Current Focus (Antardasha):</strong> Within this larger chapter, the sub-period of <strong>{ad}</strong> is directing your immediate focus for the coming months. {ad} brings its energy of <em>{getPlanetKeywords(ad)}</em> into the mix, operating from your {getOrdinal(adPlanet.house || 1)} house. The interaction between {md} and {ad} defines the primary events happening in your life right now.
                            </p>
                            <p className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>
                              <strong className="text-jyotish-gold">The Active Undercurrent (Pratyantardasha):</strong> On a week-to-week basis, <strong>{pd}</strong> is the active trigger. It is currently activating events related to <em>{getPlanetKeywords(pd)}</em> (from the {getOrdinal(pdPlanet.house || 1)} house), acting as the catalyst that brings the promises of {md} and {ad} into reality.
                            </p>
                            {sd && prd && (
                              <p className={cn("text-xs italic pt-2 border-t", theme === 'dark' ? "text-white/50 border-white/10" : "text-slate-500 border-slate-200")}>
                                * On a micro level, the fleeting energies of {sd} (Sookshmadasha) and {prd} (Pranadasha) are influencing your day-to-day moods and minor interactions.
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Activated Yogas */}
                {currentDashas.length >= 3 && natalYogas.length > 0 && (
                  <div className={cn("p-5 rounded-2xl border", theme === 'dark' ? "bg-mystic-purple/20 border-jyotish-gold/10" : "bg-white border-slate-200")}>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-jyotish-gold" />
                      <h3 className="text-lg font-medium text-jyotish-gold">Activated Yogas</h3>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        const activeLords = [currentDashas[0].lord, currentDashas[1].lord, currentDashas[2].lord];
                        
                        // Find yogas that involve at least one of the active lords
                        const activeYogas = natalYogas.filter(yoga => 
                          yoga.planets.some(p => activeLords.includes(p))
                        );

                        if (activeYogas.length === 0) {
                          return <div className={cn("text-sm", theme === 'dark' ? "text-white/40" : "text-slate-500")}>No major yogas are currently activated by the Mahadasha, Antardasha, or Pratyantardasha lords.</div>;
                        }

                        return activeYogas.map((yoga, idx) => {
                          // Determine which active lords are involved
                          const involvedLords = yoga.planets.filter(p => activeLords.includes(p));
                          
                          return (
                            <div key={idx} className={cn("p-3 rounded-xl border", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-100")}>
                              <div className="flex items-center justify-between mb-1">
                                <div className={cn("text-sm font-bold", yoga.type === 'auspicious' ? "text-green-500" : yoga.type === 'inauspicious' ? "text-red-500" : "text-jyotish-gold")}>
                                  {yoga.name}
                                </div>
                                <div className="flex gap-1.5">
                                  {involvedLords.map(lord => {
                                    const role = lord === currentDashas[0].lord ? 'MD' : lord === currentDashas[1].lord ? 'AD' : 'PD';
                                    return (
                                      <span key={lord} className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded flex items-center gap-1.5", theme === 'dark' ? "bg-jyotish-gold/20 text-jyotish-gold" : "bg-orange-100 text-orange-700")}>
                                        <PlanetGlyph name={lord} className="scale-75" />
                                        {role}: {lord}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className={cn("text-xs", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{yoga.description}</div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Mahadasha Lord Analysis */}
                  {currentDashas[0] && getDashaLordDetails(currentDashas[0].lord) && (
                    <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-white/10" : "bg-white border-slate-200")}>
                      <h4 className="text-sm font-medium text-jyotish-gold mb-3 flex items-center gap-2">
                        <PlanetGlyph name={currentDashas[0].lord} className="text-lg opacity-70" />
                        Mahadasha Lord: {currentDashas[0].lord}
                      </h4>
                      {(() => {
                        const details = getDashaLordDetails(currentDashas[0].lord)!;
                        return (
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">Strength</span>
                              <span className={details.strength.includes("Poorna") ? "text-green-400" : details.strength.includes("Rikta") ? "text-red-400" : "text-jyotish-gold"}>{details.strength.split(' - ')[0]}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">Placement</span>
                              <span className="text-white/80">{details.planet.rashi} ({details.planet.nakshatra})</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">House</span>
                              <span className="text-white/80">House {details.planet.house}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">Deeptadi Awastha</span>
                              <span className="text-white/80 text-right">{details.deeptadi.split(' - ')[0]}</span>
                            </div>
                            <div className="flex justify-between pb-1">
                              <span className="text-white/40">Shayanadi Awastha</span>
                              <span className="text-white/80 text-right">{details.shayanadi.split(' - ')[0]}</span>
                            </div>
                            <div className="pt-2 text-xs text-white/50 italic">
                              {details.deeptadi.split(' - ')[1]}. {details.shayanadi.split(' - ')[1]}.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Antardasha Lord Analysis */}
                  {currentDashas[1] && getDashaLordDetails(currentDashas[1].lord) && (
                    <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-white/10" : "bg-white border-slate-200")}>
                      <h4 className="text-sm font-medium text-jyotish-gold mb-3 flex items-center gap-2">
                        <PlanetGlyph name={currentDashas[1].lord} className="text-lg opacity-70" />
                        Antardasha Lord: {currentDashas[1].lord}
                      </h4>
                      {(() => {
                        const details = getDashaLordDetails(currentDashas[1].lord)!;
                        return (
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">Strength</span>
                              <span className={details.strength.includes("Poorna") ? "text-green-400" : details.strength.includes("Rikta") ? "text-red-400" : "text-jyotish-gold"}>{details.strength.split(' - ')[0]}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">Placement</span>
                              <span className="text-white/80">{details.planet.rashi} ({details.planet.nakshatra})</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">House</span>
                              <span className="text-white/80">House {details.planet.house}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-white/40">Deeptadi Awastha</span>
                              <span className="text-white/80 text-right">{details.deeptadi.split(' - ')[0]}</span>
                            </div>
                            <div className="flex justify-between pb-1">
                              <span className="text-white/40">Shayanadi Awastha</span>
                              <span className="text-white/80 text-right">{details.shayanadi.split(' - ')[0]}</span>
                            </div>
                            <div className="pt-2 text-xs text-white/50 italic">
                              {details.deeptadi.split(' - ')[1]}. {details.shayanadi.split(' - ')[1]}.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

const SpecialPointCard: React.FC<{ 
  name: string; 
  sign: number; 
  degree: number; 
  meaning: string; 
  tags?: { label: string; type: 'success' | 'neutral' }[];
}> = ({ name, sign, degree, meaning, tags }) => {
  const { theme } = useTheme();
  const RASHIS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return (
    <div className={cn("p-4 rounded-3xl border transition-all hover:scale-[1.02]", theme === 'dark' ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-bold text-jyotish-gold font-serif">{name}</h3>
        <div className="flex flex-wrap gap-1 justify-end">
          {tags?.map((tag, i) => (
            <span key={i} className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter", 
              tag.type === 'success' ? "bg-green-500/20 text-green-500" : "bg-white/10 text-white/40")}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-mono", theme === 'dark' ? "bg-jyotish-gold/20 text-jyotish-gold" : "bg-orange-100 text-orange-600")}>
          {RASHIS[sign - 1]}
        </span>
        <span className="text-[12px] font-mono text-white/60">
          {degree.toFixed(2)}°
        </span>
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed font-sans">{meaning}</p>
    </div>
  );
};

const RectifySection: React.FC<{
  birthTime: Date | null;
  setBirthTime: (date: Date | null) => void;
  rectifyTime: Date | null;
  setRectifyTime: (date: Date | null) => void;
  isRectifying: boolean;
  setIsRectifying: (is: boolean) => void;
  birthPositions: PlanetPosition[] | null;
  rectifiedPositions: PlanetPosition[] | null;
}> = ({ birthTime, setBirthTime, rectifyTime, setRectifyTime, isRectifying, setIsRectifying, birthPositions, rectifiedPositions }) => {
  const { theme } = useTheme();
  const [offsetMinutes, setOffsetMinutes] = React.useState(0);

  React.useEffect(() => {
    if (birthTime && !rectifyTime) {
      setRectifyTime(new Date(birthTime));
    }
  }, [birthTime]);

  const adjustTime = (minutes: number) => {
    if (!birthTime) return;
    const newTime = new Date((rectifyTime || birthTime).getTime() + minutes * 60000);
    setRectifyTime(newTime);
    setOffsetMinutes(prev => prev + minutes);
  };

  const reset = () => {
    setRectifyTime(birthTime ? new Date(birthTime) : null);
    setOffsetMinutes(0);
  };

  if (!birthTime || !birthPositions) return null;

  const originalAsc = birthPositions.find(p => p.name === "Ascendant");
  const rectifiedAsc = rectifiedPositions?.find(p => p.name === "Ascendant");
  
  const originalMoon = birthPositions.find(p => p.name === "Moon");
  const rectifiedMoon = rectifiedPositions?.find(p => p.name === "Moon");

  const hasAscChanged = originalAsc?.rashi !== rectifiedAsc?.rashi;
  const hasMoonNakChanged = originalMoon?.nakshatra !== rectifiedMoon?.nakshatra;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={cn("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-xl")}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-jyotish-gold" />
            <h2 className="text-lg font-bold text-jyotish-gold uppercase tracking-tighter">Time Rectification</h2>
          </div>
          <button 
            onClick={reset}
            className={cn("p-2 rounded-xl border transition-all hover:scale-105", theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-600")}
            title="Reset to Original"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Original Birth Time</div>
            <div className="text-xl font-mono font-bold">{format(birthTime, 'HH:mm:ss')}</div>
            <div className={cn("text-[11px]", theme === 'dark' ? "text-white/20" : "text-slate-400")}>{format(birthTime, 'MMMM d, yyyy')}</div>
          </div>
          <div className="space-y-4">
            <div className={cn("text-[10px] uppercase tracking-widest font-mono text-orange-400")}>Rectified Estimate</div>
            <div className="text-xl font-mono font-bold text-orange-500">{rectifyTime ? format(rectifyTime, 'HH:mm:ss') : '--:--:--'}</div>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-bold", offsetMinutes > 0 ? "text-green-500" : offsetMinutes < 0 ? "text-red-500" : "text-white/40")}>
                {offsetMinutes > 0 ? '+' : ''}{offsetMinutes} minutes
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={cn("text-[10px] uppercase tracking-widest font-mono mb-4", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Adjust Calibration</div>
          <div className="grid grid-cols-4 gap-2">
            {[-60, -5, -1, 1, 5, 60].map(val => (
              <button
                key={val}
                onClick={() => adjustTime(val)}
                className={cn(
                  "py-3 rounded-2xl border text-xs font-mono font-bold transition-all active:scale-95",
                  theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700"
                )}
              >
                {val > 0 ? '+' : ''}{val}m
              </button>
            ))}
            <button 
              onClick={() => adjustTime(offsetMinutes * -1)}
              className={cn("col-span-2 py-3 rounded-2xl border text-xs font-mono font-bold transition-all active:scale-95", theme === 'dark' ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-600")}
            >
              Reset Offset
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
          <button
            onClick={() => setIsRectifying(!isRectifying)}
            className={cn(
              "w-full py-4 rounded-3xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
              isRectifying 
                ? "bg-orange-500 text-black hover:bg-orange-400" 
                : "bg-jyotish-gold text-black hover:bg-jyotish-gold/90"
            )}
          >
            <Activity className={cn("w-5 h-5", isRectifying && "animate-pulse")} />
            {isRectifying ? 'Viewing Rectified Chart' : 'Compare on Map'}
          </button>
          <p className={cn("text-center text-[10px] mt-4 leading-relaxed", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
            Activating comparison will update the Sky Map to show the rectified positions. Use this to see how planetary houses shift.
          </p>
        </div>

        {offsetMinutes !== 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => {
                if (rectifyTime) {
                  setBirthTime(rectifyTime);
                  setIsRectifying(false);
                  setOffsetMinutes(0);
                }
              }}
              className={cn("w-full py-3 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2", 
                theme === 'dark' ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20" : "bg-green-50 border-green-200 text-green-600 hover:bg-green-100")}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply as Primary Birth Time
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Comparison Card: Ascendant */}
        <div className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-sm", hasAscChanged && "border-orange-500/30 bg-orange-500/5")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-jyotish-gold">Ascendant (Lagna)</h3>
            {hasAscChanged && <span className="text-[9px] font-bold uppercase bg-orange-500 text-black px-1.5 py-0.5 rounded">Shifted</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className={cn("text-[9px] uppercase font-mono", theme === 'dark' ? "text-white/20" : "text-slate-400")}>Original</div>
              <div className="text-sm font-bold">{originalAsc?.rashi} {originalAsc?.degree}°</div>
            </div>
            <ArrowRightLeft className={cn("w-4 h-4", hasAscChanged ? "text-orange-500" : "text-white/10")} />
            <div className="space-y-1 text-right">
              <div className={cn("text-[9px] uppercase font-mono", theme === 'dark' ? "text-white/20" : "text-slate-400")}>Rectified</div>
              <div className={cn("text-sm font-bold", hasAscChanged ? "text-orange-500" : "")}>{rectifiedAsc?.rashi} {rectifiedAsc?.degree}°</div>
            </div>
          </div>
        </div>

        {/* Comparison Card: Moon Nakshatra */}
        <div className={cn("p-5 rounded-3xl border", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-sm", hasMoonNakChanged && "border-blue-500/30 bg-blue-500/5")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-jyotish-gold">Moon Nakshatra</h3>
            {hasMoonNakChanged && <span className="text-[9px] font-bold uppercase bg-blue-500 text-white px-1.5 py-0.5 rounded">Shifted</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className={cn("text-[9px] uppercase font-mono", theme === 'dark' ? "text-white/20" : "text-slate-400")}>Original</div>
              <div className="text-sm font-bold">{originalMoon?.nakshatra}</div>
            </div>
            <ArrowRightLeft className={cn("w-4 h-4", hasMoonNakChanged ? "text-blue-500" : "text-white/10")} />
            <div className="space-y-1 text-right">
              <div className={cn("text-[9px] uppercase font-mono", theme === 'dark' ? "text-white/20" : "text-slate-400")}>Rectified</div>
              <div className={cn("text-sm font-bold", hasMoonNakChanged ? "text-blue-500" : "")}>{rectifiedMoon?.nakshatra}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={cn("p-6 rounded-3xl border", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-200")}>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-jyotish-gold" />
          <h3 className="text-sm font-bold text-jyotish-gold">Why Rectify?</h3>
        </div>
        <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
          Birth times are rarely recorded with second-level precision. In Vedic astrology, a few minutes difference can shift the Ascendant sign or the Moon's Nakshatra, leading to an inaccurate interpretation. 
          Use this tool to refine your birth time by matching your life events and nature to the resulting chart variations. 
          <br /><br />
          <strong className="text-jyotish-gold">Tip:</strong> Watch for the Lagna (Ascendant) change. If you find your current chart doesn't quite "feel" like you, try shifting a few minutes forward or backward to see if a more accurate Lagna emerges.
        </p>
      </div>
    </div>
  );
};

const BlueprintCard: React.FC<{
  name: string;
  sign: number;
  degree: number;
  meaning: string;
  tags?: { label: string; type: 'success' | 'neutral' | 'warning' }[];
  planet?: string;
}> = ({ name, sign, degree, meaning, tags, planet }) => {
  const { theme } = useTheme();
  const RASHIS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return (
    <div className={cn(
      "rounded-2xl border p-4 flex flex-col gap-3 min-w-0 transition-colors duration-500",
      theme === 'dark' ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200 shadow-sm"
    )}>
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className="font-serif font-bold text-base sm:text-lg text-jyotish-gold leading-tight flex items-center gap-2 min-w-0">
            <PlanetGlyph name={name} className="text-jyotish-gold/60 shrink-0" />
            <span className="truncate">{name}</span>
          </div>
          {planet && (
            <div className={cn("text-sm font-bold mt-1 tracking-wide flex items-center gap-1.5", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
              <PlanetGlyph name={planet} className="scale-75 opacity-70 shrink-0" />
              <span className="truncate">{planet}</span>
            </div>
          )}
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
            {tags.map((tag, i) => (
              <span key={i} className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                tag.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                tag.type === 'warning' ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                theme === 'dark' ? "bg-white/5 text-white/40 border border-white/10" : "bg-slate-100 text-slate-500 border border-slate-200")}>
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("inline-flex px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-sm", theme === 'dark' ? "bg-jyotish-gold/20 text-jyotish-gold" : "bg-orange-100 text-orange-600")}>
          {RASHIS[sign - 1]}
        </span>
        <span className={cn("text-[12px] font-mono", theme === 'dark' ? "text-white/60" : "text-slate-500")}>{degree.toFixed(2)}°</span>
      </div>
      <p className={cn("text-[13px] leading-relaxed break-words", theme === 'dark' ? "text-white/70" : "text-slate-600")}>{meaning}</p>
    </div>
  );
};

const LifeBlueprintSection: React.FC<{ result: any; birthPositions: PlanetPosition[] | null }> = ({ result, birthPositions }) => {
  const { theme } = useTheme();
  const RASHIS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  
  const charaKarakas = [
    { key: 'AK', label: 'Atmakaraka', meaning: 'Primary soul indicator; your internal nature and path.' },
    { key: 'AmK', label: 'Amatyakaraka', meaning: 'Professional indicator; career trajectory and resources.' },
    { key: 'BK', label: 'Bhratrukaraka', meaning: 'Siblings, coworkers, and immediate surroundings.' },
    { key: 'MK', label: 'Matrukaraka', meaning: 'Roots, happiness, and connection to the mother.' },
    { key: 'PiK', label: 'Pitrukaraka', meaning: 'Authority figures and the influence of the father.' },
    { key: 'PuK', label: 'Putrakaraka', meaning: 'Creativity, children, and specialized knowledge.' },
    { key: 'GK', label: 'Gnatikaraka', meaning: 'Karmic tests, rivals, and structural obstacles.' },
    { key: 'DK', label: 'Darakaraka', meaning: 'Nature of partnerships and soulmate resonances.' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chara Karakas */}
              {charaKarakas.map((ck) => {
                const planetName = result.charakarakas[ck.key];
                const pos = birthPositions?.find(p => p.name === planetName);
                if (!pos) return null;
                return (
                  <BlueprintCard 
                    key={ck.key}
                    name={ck.label}
                    planet={planetName}
                    sign={Math.floor(pos.siderealLongitude / 30) + 1}
                    degree={pos.siderealLongitude % 30}
                    meaning={ck.meaning}
                  />
                );
              })}

              {/* Special Lagnas */}
              <BlueprintCard 
                name="Ghati Lagna"
                sign={result.ghatiLagna.ghatiLagnaSignNumber}
                degree={result.ghatiLagna.ghatiLagnaDegree}
                meaning="Power, authority, and professional influence."
                tags={[{ label: result.ghatiLagna.isDayBirth ? 'Day Birth' : 'Night Birth', type: 'neutral' }]}
              />
              <BlueprintCard 
                name="Hora Lagna"
                sign={result.horaLagna.horaLagnaSignNumber}
                degree={result.horaLagna.horaLagnaDegree}
                meaning="Wealth potential, financial status, and prosperity."
                tags={[{ label: result.horaLagna.isDayBirth ? 'Day Birth' : 'Night Birth', type: 'neutral' }]}
              />
              <BlueprintCard 
                name="Bhava Lagna"
                sign={result.bhavaLagna.bhavaLagnaSignNumber}
                degree={result.bhavaLagna.bhavaLagnaDegree}
                meaning="Physical body and life circumstances."
              />
              <BlueprintCard 
                name="Pranapada Lagna"
                sign={result.pranapada.pranapadalagnaSignNumber}
                degree={result.pranapada.pranapadalagnaDegree}
                meaning="Auspiciousness of birth and overall life vitality."
                tags={[{ label: result.pranapada.isFortunate ? 'Fortunate' : 'Neutral', type: result.pranapada.isFortunate ? 'success' : 'neutral' }]}
              />
              <BlueprintCard 
                name="Sree Lagna"
                sign={result.sreeLagna.signNumber}
                degree={0}
                meaning="Potential for cumulative wealth and abundance."
              />

              {/* Arudha Lagnas */}
              <BlueprintCard 
                name="Arudha Lagna"
                sign={result.arudhaLagna.signNumber}
                degree={0}
                meaning="Social image, status, and how the world perceives you."
                tags={[{ label: 'AL', type: 'neutral' }]}
              />
              <BlueprintCard 
                name="Upapada Lagna"
                sign={result.upapadaLagna.signNumber}
                degree={0}
                meaning="Marriage, partnership, and nature of the spouse."
                tags={[{ label: 'UL', type: 'neutral' }]}
              />

              {/* Kaal Velas */}
              {result.kaalVelas && (
                <>
                  <BlueprintCard 
                    name="Gulika"
                    sign={result.kaalVelas.gulika.signNumber}
                    degree={0}
                    meaning="Point of deep karmic entanglement for the house it occupies."
                    tags={[{ label: 'Severe Malefic', type: 'warning' }]}
                  />
                  <BlueprintCard 
                    name="Maandi"
                    sign={result.kaalVelas.maandi.signNumber}
                    degree={0}
                    meaning="Strongest secondary malefic focus (Midpoint of Saturn's portion)."
                    tags={[{ label: 'Severe Malefic', type: 'warning' }]}
                  />
                </>
              )}

              {/* Sphutas */}
              <BlueprintCard 
                name="Beeja Sphuta"
                sign={result.beejaSphuata.signNumber}
                degree={result.beejaSphuata.degree}
                meaning="Fertility and creative vitality (Male / Solar seed)."
                tags={[{ label: result.beejaSphuata.isAuspicious ? 'Strong' : 'Weak', type: result.beejaSphuata.isAuspicious ? 'success' : 'neutral' }]}
              />
              <BlueprintCard 
                name="Ksheetra Sphuta"
                sign={result.kshetraSphuta.signNumber}
                degree={result.kshetraSphuta.degree}
                meaning="Fertility and creative potential (Female / Lunar field)."
                tags={[{ label: result.kshetraSphuta.isAuspicious ? 'Strong' : 'Weak', type: result.kshetraSphuta.isAuspicious ? 'success' : 'neutral' }]}
              />

              {/* Midpoints */}
              <BlueprintCard 
                name="Bhrigu Bindu"
                sign={result.bhriguBindu.signNumber}
                degree={result.bhriguBindu.degree}
                meaning="Highly sensitive karmic focal point between Moon and Rahu."
                tags={[{ label: 'Destiny Hub', type: 'success' }]}
              />
      </div>

      {/* Dhooma Chain - Still nice in grid for "Non-Luminous" vibe, or I can add to table */}
      <div className={cn("p-6 rounded-3xl border mt-6", theme === 'dark' ? "bg-white/[0.01] border-white/5" : "bg-slate-50 border-slate-100")}>
        <div className="flex items-center gap-2 mb-4">
          <CircleDot className="w-4 h-4 text-jyotish-gold" />
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/30">Dhooma Chain (Intense Karmic Points)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { label: 'Dhooma', data: result.dhoomaChain.dhooma, desc: 'Fiery/Obstructive' },
            { label: 'Vyatipata', data: result.dhoomaChain.vyatipata, desc: 'Misfortune' },
            { label: 'Parivesha', data: result.dhoomaChain.parivesha, desc: 'Eclipse focus' },
            { label: 'Indra Chapa', data: result.dhoomaChain.indraChapa, desc: 'Indra\'s Bow' },
            { label: 'Upaketu', data: result.dhoomaChain.upaketu, desc: 'Dissolution' }
          ].map((pt, i) => (
            <div key={i} className="text-center group">
              <div className="text-[10px] font-bold text-jyotish-gold mb-1 group-hover:text-white transition-colors">{pt.label}</div>
              <div className="text-[12px] font-serif text-white/80 mb-0.5">{RASHIS[pt.data.signNumber-1]}</div>
              <div className="text-[9px] font-mono text-white/20">{pt.data.degree.toFixed(1)}°</div>
              <div className="text-[8px] mt-1 text-white/10 uppercase tracking-tighter">{pt.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DataDashboard = React.memo(DataDashboardInner);
