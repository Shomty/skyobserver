import React, { useRef, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  Download, 
  MapPin, 
  Clock, 
  Calendar, 
  Sparkles, 
  Wind, 
  Flame, 
  Droplets, 
  Mountain, 
  Compass, 
  Zap,
  BookOpen,
  ArrowLeft,
  BrainCircuit,
  Loader2,
  Info,
  History,
  RotateCcw,
  X
} from 'lucide-react';
import { cn, getOrdinal } from '../lib/utils';
import { format } from 'date-fns';
import NorthIndianChart from './NorthIndianChart';
import { PlanetPosition, PanchangData, TransitEvent } from '../vedic-utils';
import { generateCosmicInterpretations, AICosmicInterpretations } from '../services/geminiService';
import { ensureReport, dailyFingerprint, backupAIReport, getAIReportBackups, restoreAIReport, AIReportBackup } from '../services/aiReportService';
import { exportUserData, downloadExportAsJSON } from '../services/exportService';
import { SavedIndicator } from './SavedIndicator';
import { KARAKA_INTERPRETATIONS } from '../lib/blueprintInterpretations';

interface CosmicReportProps {
  user: any;
  profile: any;
  birthPositions: PlanetPosition[] | null;
  yogas: any[];
  panchang: PanchangData | null;
  blueprint: any | null;
  theme: 'light' | 'dark';
  onClose?: () => void;
  transitPositions?: PlanetPosition[];
  transits?: TransitEvent[];
  birthFingerprint?: string | null;
}

const getPlanetKeywords = (planet: string) => {
  const keywords: Record<string, string> = {
    'Sun': 'Self, soul, leadership, vitality, ego, father',
    'Moon': 'Mind, emotions, mother, peace of mind, intuition',
    'Mars': 'Energy, courage, brothers, competition, logic, technical skill',
    'Mercury': 'Communication, intelligence, business, relatives, speech',
    'Jupiter': 'Wisdom, wealth, children, expansion, spirituality, gurus',
    'Venus': 'Love, beauty, luxury, marriage, arts, aesthetics',
    'Saturn': 'Discipline, structure, obstacles, longevity, hard work, delay',
    'Rahu': 'Ambition, innovation, obsession, foreigners, unconventionality',
    'Ketu': 'Liberation, spirituality, isolation, mathematics, sharp logic'
  };
  return keywords[planet] || '';
};

export const CosmicReport: React.FC<CosmicReportProps> = ({
  user,
  profile,
  birthPositions,
  yogas,
  panchang,
  blueprint,
  theme,
  onClose,
  transitPositions = [],
  transits = [],
  birthFingerprint
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [aiData, setAIData] = useState<AICosmicInterpretations | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<AIReportBackup[]>([]);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  // Compute dominant element and guna from birth positions
  const chartQualities = useMemo(() => {
    if (!birthPositions) return null;

    const elementMap: Record<string, string> = {
      Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
      Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
      Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
      Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
    };
    const gunaMap: Record<string, string> = {
      Sun: 'Sattva', Moon: 'Sattva', Jupiter: 'Sattva',
      Mercury: 'Rajas', Venus: 'Rajas', Rahu: 'Rajas',
      Mars: 'Tamas', Saturn: 'Tamas', Ketu: 'Tamas'
    };

    const elementCount: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    const gunaCount: Record<string, number> = { Sattva: 0, Rajas: 0, Tamas: 0 };

    for (const p of birthPositions) {
      const el = elementMap[p.rashi];
      if (el) elementCount[el]++;
      const gn = gunaMap[p.name];
      if (gn) gunaCount[gn]++;
    }

    const dominantElement = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0][0];
    const dominantGuna = Object.entries(gunaCount).sort((a, b) => b[1] - a[1])[0][0];

    const elementMeta: Record<string, { icon: string; emoji: string; color: string; label: string; description: string }> = {
      Fire: { icon: '🔥', emoji: '🔥', color: 'bg-orange-500/20', label: 'Agni (Fire)', description: 'High drive, leadership potential, and transformative energy. You process life through action and direct experience.' },
      Earth: { icon: '🌍', emoji: '🌍', color: 'bg-green-700/20', label: 'Prithvi (Earth)', description: 'Grounded, pragmatic, and enduring. You build tangible results and value stability, patience, and material mastery.' },
      Air:   { icon: '💨', emoji: '💨', color: 'bg-sky-400/20',  label: 'Vayu (Air)',   description: 'Curious, communicative, and idealistic. You thrive through intellectual exchange, social connection, and adaptive thinking.' },
      Water: { icon: '💧', emoji: '💧', color: 'bg-blue-500/20', label: 'Jala (Water)',  description: 'Deeply intuitive, empathic, and emotionally intelligent. You move through life guided by feeling and inner knowing.' }
    };
    const gunaMeta: Record<string, { emoji: string; label: string; description: string }> = {
      Sattva: { emoji: '✨', label: 'Sattva (Balance)',   description: 'A natural inclination towards purity, wisdom, and spiritual clarity. Your journey involves balancing earthly duties with inner peace.' },
      Rajas:  { emoji: '⚡', label: 'Rajas (Action)',     description: 'Dynamic, ambitious, and driven by desire. Your path is one of active engagement with the world — creation, commerce, and transformation.' },
      Tamas:  { emoji: '🌑', label: 'Tamas (Inertia)',    description: 'Deliberate, structured, and resistant to change. Your strength lies in endurance, steadiness, and mastery through patient effort.' }
    };

    return {
      element: elementMeta[dominantElement] || elementMeta.Fire,
      guna: gunaMeta[dominantGuna] || gunaMeta.Sattva,
      elementCounts: elementCount,
      gunaCounts: gunaCount
    };
  }, [birthPositions]);

  const aiCallInFlightRef = useRef(false);
  // Track the last fingerprint we successfully resolved so we can skip re-runs
  // when nothing meaningful changed (e.g. every-second currentTime ticks that
  // cause transits/panchang to re-render but describe the same day).
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchAIInterpretations() {
      if (!birthPositions || !panchang || !blueprint || !user?.uid) return;
      // Prevent concurrent calls — React may re-fire this effect before the
      // previous async call finishes (e.g. when parent re-renders with new
      // array references for the same logical data).
      if (aiCallInFlightRef.current) return;

      const transitEvents = transits.slice(0, 10); // cap to top 10 events for prompt size

      // The report reads the current sky, so it is keyed by birth details plus
      // the calendar day — NOT by tithi/karana/transit counts, which shift
      // several times a day and used to force a fresh Gemini call each time.
      const fingerprint = dailyFingerprint(birthFingerprint, new Date());

      // Skip if the fingerprint hasn't changed — this effect fires every second
      // because transits/panchang props include currentTime. Returning early
      // here prevents the isLoadingAI toggle from causing visible flickering.
      if (fingerprint === lastFingerprintRef.current) return;

      aiCallInFlightRef.current = true;
      setIsLoadingAI(true);
      try {
        const previousData = aiData;
        const { data, fromCache, saved } = await ensureReport<AICosmicInterpretations>({
          uid: user.uid,
          docId: 'cosmic-report',
          type: 'cosmic_analysis',
          fingerprint,
          normalize: raw =>
            raw && typeof raw === 'object' && typeof (raw as AICosmicInterpretations).summary === 'string'
              ? (raw as AICosmicInterpretations)
              : null,
          generate: () => generateCosmicInterpretations(
            profile,
            birthPositions,
            yogas,
            panchang,
            blueprint,
            transitPositions,
            transitEvents
          ),
        });

        // Snapshot the version this one replaced, so the restore history keeps
        // working. Only meaningful when a new report was actually generated.
        if (!fromCache && previousData) {
          await backupAIReport(user.uid, 'cosmic_analysis', previousData);
        }

        lastFingerprintRef.current = fingerprint;
        setIsReportSaved(fromCache || saved);
        setAIData(data);
      } catch (error) {
        setIsReportSaved(false);
        console.error("AI Generation failed:", error);
        // Don't update lastFingerprintRef on error so the next effect run can retry.
      } finally {
        aiCallInFlightRef.current = false;
        setIsLoadingAI(false);
      }
    }

    fetchAIInterpretations();
  }, [user?.uid, birthFingerprint, birthPositions, panchang, blueprint, profile, yogas, transitPositions, transits]);

  const interpretedBlueprint = useMemo(() => {
    if (!blueprint) return null;
    const akPlanet = blueprint.charakarakas?.AK || 'Sun';
    const amkPlanet = blueprint.charakarakas?.AmK || 'Moon';
    const ishta = blueprint.ishtaDevata || akPlanet; // Simplified fallback
    const dharma = blueprint.dharmaChakra || 'Mercury';

    return {
      ak: {
        planet: akPlanet,
        interpretation: KARAKA_INTERPRETATIONS.AK[akPlanet] || 'Soul purpose through mastery of planetary energy.'
      },
      amk: {
        planet: amkPlanet,
        interpretation: KARAKA_INTERPRETATIONS.AmK[amkPlanet] || 'Material success through professional alignment.'
      },
      ishta: {
        planet: ishta,
        interpretation: KARAKA_INTERPRETATIONS.Ishta[ishta] || 'Spiritual protector based on your soul signature.'
      },
      dharma: {
        planet: dharma,
        interpretation: KARAKA_INTERPRETATIONS.Dharma[dharma] || 'The guiding force of your ethical and social duty.'
      }
    };
  }, [blueprint]);

  const handlePrint = () => {
    window.print();
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!user?.uid) return;
    setIsExporting(true);
    try {
      const data = await exportUserData(user.uid);
      downloadExportAsJSON(data, user.uid);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenBackups = async () => {
    if (!user?.uid) return;
    setShowBackups(true);
    const list = await getAIReportBackups(user.uid, 'cosmic_analysis');
    setBackups(list);
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!user?.uid) return;
    setIsRestoringBackup(true);
    try {
      const data = await restoreAIReport(user.uid, backupId);
      if (data) setAIData(data);
    } finally {
      setIsRestoringBackup(false);
      setShowBackups(false);
    }
  };

  if (!birthPositions || !panchang) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center h-full">
        <Sparkles className="w-16 h-16 text-jyotish-gold opacity-20 mb-6" />
        <h2 className="text-2xl font-serif italic text-jyotish-gold mb-2">Report Not Available</h2>
        <p className="text-sm text-slate-400 max-w-md">Please ensure your birth details are complete in your profile to generate your cosmic report.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-100/50 dark:bg-black/40 py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
          {onClose && (
            <button 
              onClick={onClose}
              className={cn(
                "p-2 rounded-xl transition-all duration-300 backdrop-blur-md border",
                theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/60" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif italic font-bold text-jyotish-gold">Cosmic Analysis Report</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Exclusive personalized blueprint</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {aiData && (
            <button
              onClick={handleOpenBackups}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border active:scale-95",
                theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/60" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm"
              )}
              title="Restore previous AI interpretations"
            >
              <History className="w-4 h-4" />
              History
            </button>
          )}
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border active:scale-95 disabled:opacity-40",
              theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/60" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm"
            )}
            title="Export all your data as JSON"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Data
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-jyotish-gold text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-celestial-gold transition-all shadow-lg active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Backup History Modal */}
      <AnimatePresence>
        {showBackups && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden"
            onClick={() => setShowBackups(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full max-w-md rounded-3xl border p-6 shadow-2xl",
                theme === 'dark' ? "bg-mystic-purple border-jyotish-gold/20 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-jyotish-gold/10 flex items-center justify-center">
                    <History className="w-4 h-4 text-jyotish-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-jyotish-gold">Interpretation History</h3>
                    <p className="text-xs opacity-40">Restore a previous AI snapshot</p>
                  </div>
                </div>
                <button onClick={() => setShowBackups(false)} className="p-1.5 rounded-xl opacity-40 hover:opacity-80 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {backups.length === 0 ? (
                <p className="text-sm opacity-40 text-center py-8">No backups yet. Backups are created automatically before new AI interpretations are generated.</p>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border",
                      theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                    )}>
                      <div>
                        <p className="text-sm font-bold">Snapshot</p>
                        <p className="text-xs opacity-40">
                          {backup.createdAt?.toDate ? format(backup.createdAt.toDate(), 'MMM d, yyyy · HH:mm') : 'Unknown date'}
                        </p>
                      </div>
                      <button
                        onClick={() => backup.id && handleRestoreBackup(backup.id)}
                        disabled={isRestoringBackup}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-jyotish-gold/10 text-jyotish-gold text-xs font-bold hover:bg-jyotish-gold/20 transition-all disabled:opacity-40"
                      >
                        {isRestoringBackup ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={reportRef}
        className={cn(
          "report-content p-10 shadow-2xl rounded-[2.5rem] border transition-all duration-700",
          "print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:bg-white print:text-black",
          theme === 'dark' ? "bg-mystic-purple/60 border-jyotish-gold/20 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        {/* Report Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 pb-16 border-b border-jyotish-gold/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-3xl border border-jyotish-gold/30 flex items-center justify-center bg-jyotish-gold/10 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-8 h-8 text-jyotish-gold" />
                )}
              </div>
              <div>
                <h2 className="text-4xl font-serif italic leading-tight text-jyotish-gold">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : (profile?.displayName || user?.displayName || 'Seeker')}
                </h2>
                <p className="text-sm font-mono uppercase tracking-[0.3em] opacity-40">Life Blueprint</p>
              </div>
            </div>
            
            <AnimatePresence>
              {(isLoadingAI || aiData) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-6 rounded-3xl border mt-8",
                    theme === 'dark' ? "bg-jyotish-gold/5 border-jyotish-gold/20" : "bg-jyotish-gold/5 border-jyotish-gold/10"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-jyotish-gold/20 flex items-center justify-center">
                      <BrainCircuit className={cn("w-4 h-4 text-jyotish-gold", isLoadingAI && "animate-pulse")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-jyotish-gold uppercase tracking-widest font-mono">Soul Synthesis</h4>
                      <p className="text-[10px] opacity-40">Personalized AI Interpretation</p>
                    </div>
                    <SavedIndicator saved={isReportSaved && !!aiData && !isLoadingAI} isDark={theme === 'dark'} />
                  </div>
                  
                  {isLoadingAI ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 text-jyotish-gold animate-spin" />
                      <p className="text-xs font-mono opacity-40">Consulting the cosmic intelligence...</p>
                    </div>
                  ) : (
                    <p className="text-base font-serif italic leading-relaxed text-jyotish-gold/90">
                      "{aiData?.summary}"
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex items-center gap-3 text-xs">
              <Calendar className="w-4 h-4 text-jyotish-gold/50" />
              <div className="flex flex-col">
                <span className="opacity-40 uppercase tracking-widest text-[8px] font-mono">Birth Date</span>
                <span className="font-bold">
                  {(profile?.birthDetails?.time || profile?.birthTime) 
                    ? format(new Date(profile?.birthDetails?.time || profile?.birthTime), 'MMMM do, yyyy') 
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Clock className="w-4 h-4 text-jyotish-gold/50" />
              <div className="flex flex-col">
                <span className="opacity-40 uppercase tracking-widest text-[8px] font-mono">Time of Birth</span>
                <span className="font-bold">
                  {(profile?.birthDetails?.time || profile?.birthTime) 
                    ? format(new Date(profile?.birthDetails?.time || profile?.birthTime), 'HH:mm') 
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <MapPin className="w-4 h-4 text-jyotish-gold/50" />
              <div className="flex flex-col">
                <span className="opacity-40 uppercase tracking-widest text-[8px] font-mono">Place of Birth</span>
                <span className="font-bold">{profile?.birthDetails?.city || profile?.birthPlace || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Compass className="w-4 h-4 text-jyotish-gold/50" />
              <div className="flex flex-col">
                <span className="opacity-40 uppercase tracking-widest text-[8px] font-mono">Coordinates</span>
                <span className="font-mono text-[10px] break-all">
                  {(profile?.birthDetails?.lat || profile?.birthLat || 0).toFixed(4)}°, 
                  {(profile?.birthDetails?.lon || profile?.birthLon || 0).toFixed(4)}°
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: The Cosmic Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
                <Compass className="w-5 h-5 text-jyotish-gold" />
              </div>
              <h3 className="text-2xl font-serif italic">Natal Birth Chart</h3>
            </div>
            <p className="text-base leading-relaxed opacity-70">
              The North Indian style chart provides a geometric representation of the zodiac houses relative to your Lagna (Ascendant). This map captures the precise positioning of celestial bodies at the moment of your incarnation, forming the framework of your karmic profile.
            </p>
            <div className="p-6 bg-jyotish-gold/5 rounded-3xl border border-jyotish-gold/10 italic text-sm">
              "As above, so below; as within, so without. The stars at your birth reveal the rhythm of your unique cosmic signature."
            </div>
          </div>
          <div className="flex justify-center print:scale-75">
            <div className="w-[450px] aspect-square">
              <NorthIndianChart 
                positions={birthPositions} 
                className="w-full h-full"
                showHover={false}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Life Blueprint (Special Points) */}
        {interpretedBlueprint && (
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-jyotish-gold" />
              </div>
              <h3 className="text-2xl font-serif italic text-jyotish-gold">Your Unique Life Blueprint</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-[2.5rem] border border-jyotish-gold/10 bg-jyotish-gold/5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold text-2xl shadow-inner italic font-serif">
                    {interpretedBlueprint.ak.planet.substring(0, 2)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono opacity-50 block mb-0.5">Atmakaraka (Soul Planet)</span>
                    <h4 className="text-xl font-bold text-jyotish-gold">{interpretedBlueprint.ak.planet}</h4>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-sm leading-relaxed">
                    {aiData?.blueprint?.ak || interpretedBlueprint.ak.interpretation}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-jyotish-gold/10 bg-jyotish-gold/5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold text-2xl shadow-inner italic font-serif">
                    {interpretedBlueprint.amk.planet.substring(0, 2)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono opacity-50 block mb-0.5">Amatyakaraka (Career Planet)</span>
                    <h4 className="text-xl font-bold text-jyotish-gold">{interpretedBlueprint.amk.planet}</h4>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-sm leading-relaxed">
                    {aiData?.blueprint?.amk || interpretedBlueprint.amk.interpretation}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-jyotish-gold/10 bg-jyotish-gold/5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold text-2xl shadow-inner italic font-serif">
                    {interpretedBlueprint.ishta.planet.substring(0, 2)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono opacity-50 block mb-0.5">Ishta Devata (Indicator)</span>
                    <h4 className="text-xl font-bold text-jyotish-gold">{interpretedBlueprint.ishta.planet}</h4>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-sm leading-relaxed">
                    {aiData?.blueprint?.ishta || interpretedBlueprint.ishta.interpretation}
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-jyotish-gold/10 bg-jyotish-gold/5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold text-2xl shadow-inner italic font-serif">
                    {interpretedBlueprint.dharma.planet.substring(0, 2)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono opacity-50 block mb-0.5">Dharma Chakra (Duty)</span>
                    <h4 className="text-xl font-bold text-jyotish-gold">{interpretedBlueprint.dharma.planet}</h4>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-sm leading-relaxed">
                    {aiData?.blueprint?.dharma || interpretedBlueprint.dharma.interpretation}
                  </p>
                </div>
              </div>
            </div>
            
            {chartQualities && (
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-8 rounded-[2rem] bg-jyotish-gold/5 border border-jyotish-gold/10">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-jyotish-gold" />
                  Dominant Element
                </h4>
                <div className="flex gap-4 items-center">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl", chartQualities.element.color)}>{chartQualities.element.emoji}</div>
                  <div className="flex-1">
                    <p className="font-bold text-xl uppercase tracking-tighter">{chartQualities.element.label}</p>
                    <p className="text-sm leading-relaxed mt-1 opacity-80">{chartQualities.element.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-[2rem] bg-jyotish-gold/5 border border-jyotish-gold/10">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-jyotish-gold" />
                  Primary Guna
                </h4>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-jyotish-gold/20 flex items-center justify-center text-3xl">{chartQualities.guna.emoji}</div>
                  <div className="flex-1">
                    <p className="font-bold text-xl uppercase tracking-tighter">{chartQualities.guna.label}</p>
                    <p className="text-sm leading-relaxed mt-1 opacity-80">{chartQualities.guna.description}</p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Section 3: Panchang Details */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-jyotish-gold" />
            </div>
            <h3 className="text-2xl font-serif italic text-jyotish-gold">Natal Panchang Parameters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                label: 'Tithi', 
                val: typeof panchang.tithi === 'object' ? panchang.tithi.name : panchang.tithi, 
                icon: '🌘',
                meaning: 'Emotional well-being & social harmony',
                ai: aiData?.panchang?.tithi
              },
              { 
                label: 'Nakshatra', 
                val: typeof panchang.nakshatra === 'object' ? panchang.nakshatra.name : panchang.nakshatra, 
                icon: '⭐',
                meaning: 'Mindscape & primary subconscious drive',
                ai: aiData?.panchang?.nakshatra
              },
              { 
                label: 'Yoga', 
                val: typeof panchang.yoga === 'object' ? panchang.yoga.name : panchang.yoga, 
                icon: '🔗',
                meaning: 'Inherent life-force & health alignment',
                ai: aiData?.panchang?.yoga
              },
              { 
                label: 'Karana', 
                val: typeof panchang.karana === 'object' ? panchang.karana.name : panchang.karana, 
                icon: '🦅',
                meaning: 'Success in daily action & profession',
                ai: aiData?.panchang?.karana
              },
              { 
                label: 'Vara', 
                val: panchang.vara, 
                icon: '📅',
                meaning: 'Physical vitality & solar strength',
                ai: aiData?.panchang?.vara
              }
            ].map((p, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest opacity-40 block">{p.label}</span>
                    <span className="text-base font-bold">{p.val}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <p className="text-xs font-mono uppercase tracking-widest opacity-30">{p.meaning}</p>
                  {p.ai ? (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-jyotish-gold/50 mb-1.5 flex items-center gap-1">
                        <BrainCircuit className="w-2.5 h-2.5" /> AI Insight
                      </p>
                      <p className="text-sm leading-relaxed text-jyotish-gold/90">{p.ai}</p>
                    </div>
                  ) : isLoadingAI ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-jyotish-gold/40" />
                      <span className="text-xs opacity-30">Generating insight…</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Planetary Positions */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
              <List className="w-5 h-5 text-jyotish-gold" />
            </div>
            <h3 className="text-2xl font-serif italic text-jyotish-gold">Planetary Alignment</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-mono opacity-40">Planet</th>
                  <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-mono opacity-40">Sign / Rashi</th>
                  <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-mono opacity-40">Degrees</th>
                  <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-mono opacity-40">House</th>
                  <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-mono opacity-40">Nakshatra</th>
                  <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-mono opacity-40">Core Influence</th>
                </tr>
              </thead>
              <tbody>
                {birthPositions.map((p, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{p.name} {p.isRetrograde && <span className="text-orange-500 font-mono text-[10px]">(R)</span>}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">{p.rashi}</td>
                    <td className="py-4 px-4 font-mono text-xs">{p.degree.toFixed(2)}°</td>
                    <td className="py-4 px-4 text-sm">{getOrdinal(p.house || 1)} House</td>
                    <td className="py-4 px-4 text-sm">{p.nakshatra}</td>
                    <td className="py-4 px-6 text-[10px] italic opacity-60 leading-relaxed max-w-xs">{getPlanetKeywords(p.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Planetary Insights — AI paragraph per planet */}
          {(aiData?.planets || isLoadingAI) && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-4 h-4 text-jyotish-gold/60" />
                <h4 className="text-sm font-mono uppercase tracking-widest text-jyotish-gold/60">Planetary Insights</h4>
              </div>
              {isLoadingAI && !aiData?.planets ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
                      <div className="h-4 w-1/3 bg-white/10 rounded mb-3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-white/10 rounded w-full" />
                        <div className="h-3 bg-white/10 rounded w-5/6" />
                        <div className="h-3 bg-white/10 rounded w-4/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {birthPositions.map((p) => aiData?.planets?.[p.name] && (
                    <div key={p.name} className="p-6 rounded-2xl border border-jyotish-gold/10 bg-jyotish-gold/5 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-jyotish-gold text-base">{p.name}</span>
                        {p.isRetrograde && <span className="text-orange-500 font-mono text-[10px]">(R)</span>}
                        <span className="text-xs opacity-40">{p.rashi} · {getOrdinal(p.house || 1)} House · {p.nakshatra}</span>
                        {p.dignity && p.dignity !== 'Neutral' && (
                          <span className="ml-auto text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-jyotish-gold/10 text-jyotish-gold/60">{p.dignity}</span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{aiData.planets[p.name]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 5: Significant Yogas */}
        <div className="mb-20 page-break-before">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-jyotish-gold" />
            </div>
            <h3 className="text-2xl font-serif italic text-jyotish-gold">Significant Yogas (Natal Combinations)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {yogas.map((yoga, i) => (
              <div key={i} className="p-8 rounded-[2rem] border border-jyotish-gold/10 bg-jyotish-gold/5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-bold text-jyotish-gold">{yoga.name}</h4>
                  {yoga.strength === 'strong' && <span className="px-2 py-0.5 rounded bg-jyotish-gold/20 text-jyotish-gold text-[8px] font-mono uppercase tracking-widest">High Potential</span>}
                </div>
                <p className="text-xs leading-relaxed opacity-80">{yoga.description}</p>
                <div className="mt-2 pt-3 border-t border-jyotish-gold/10 italic text-[10px] opacity-60">
                  <strong className="uppercase tracking-widest text-[8px] antialiased">Effect: </strong>
                  {yoga.implication || "Manifests through dedicated action and timing."}
                </div>
                {aiData?.yogas[yoga.name] && (
                  <div className="mt-2 pt-3 border-t border-jyotish-gold/5 flex gap-2 items-start">
                    <BrainCircuit className="w-3 h-3 text-jyotish-gold/50 mt-1 shrink-0" />
                    <p className="text-sm leading-relaxed text-jyotish-gold/80">
                      {aiData.yogas[yoga.name]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Current Transits — AI Interpretations */}
        {(aiData?.transits && Object.keys(aiData.transits).length > 0 || isLoadingAI) && (
          <div className="mb-20 page-break-before">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-jyotish-gold" />
              </div>
              <h3 className="text-2xl font-serif italic text-jyotish-gold">Current Sky Transits</h3>
            </div>

            {isLoadingAI && !aiData?.transits ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
                    <div className="h-4 w-2/3 bg-white/10 rounded mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-white/10 rounded w-full" />
                      <div className="h-3 bg-white/10 rounded w-5/6" />
                      <div className="h-3 bg-white/10 rounded w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiData?.transits && Object.entries(aiData.transits).map(([title, interpretation]) => {
                  const event = transits.find(t => t.title === title);
                  const typeColor = event?.type === 'positive'
                    ? 'border-green-500/20 bg-green-500/5 text-green-400'
                    : event?.type === 'negative'
                    ? 'border-red-500/20 bg-red-500/5 text-red-400'
                    : 'border-jyotish-gold/10 bg-jyotish-gold/5 text-jyotish-gold';
                  return (
                    <div key={title} className={cn("p-6 rounded-2xl border flex flex-col gap-3", typeColor)}>
                      <div className="flex flex-wrap items-start gap-2">
                        <span className="font-bold text-base leading-snug flex-1">{title}</span>
                        {event?.type && (
                          <span className={cn(
                            "text-[9px] font-mono uppercase px-2 py-0.5 rounded shrink-0",
                            event.type === 'positive' ? 'bg-green-500/20' : event.type === 'negative' ? 'bg-red-500/20' : 'bg-jyotish-gold/20'
                          )}>{event.type}</span>
                        )}
                      </div>
                      <div className="flex gap-2 items-start">
                        <BrainCircuit className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
                        <p className="text-sm leading-relaxed opacity-90">{interpretation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Report Footer */}
        <div className="pt-16 mt-32 border-t border-jyotish-gold/10 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-jyotish-gold/30 flex items-center justify-center">
              <Compass className="w-4 h-4 text-jyotish-gold" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold font-serif italic leading-none">Vedic Sky Report</span>
              <span className="text-[7px] font-mono uppercase tracking-widest">Sidereal Engine v2.0</span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[8px] uppercase font-mono tracking-widest">Generated On</p>
            <p className="text-[10px] font-bold">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          </div>
          <div className="text-[8px] leading-tight max-w-xs text-center border p-3 rounded-xl border-white/5">
            Disclaimer: This report is for personal guidance and information only. Vedic Astrology provides insights into probabilistic outcomes; free will and effort remain the primary drivers of destiny.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .report-content {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .page-break-before {
            page-break-before: always;
          }
          .jyotish-gold { color: #856404 !important; }
          .print-hidden { display: none !important; }
          @page { margin: 2cm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

const List = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);
