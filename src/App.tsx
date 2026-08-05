/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { calculatePositions, PlanetPosition, detectYogas, calculateAshtakavarga, RASHIS, RASHI_DATA, NAKSHATRA_DATA, analyzeTransits, TransitEvent, predictTransits, TransitPrediction, analyzeNatalComparison, NatalComparisonResult, calculatePanchang, PanchangData, calculateDrishti, isConjunct, calculateSpecialPointsV2, getBirthInfo, TransitIngress } from './vedic-utils';
import { fetchPlanetPositions, fetchTransitIngresses } from './services/positionsService';
import NorthIndianChart from './components/NorthIndianChart';
import { Header } from './components/Header';
import { SectionNav } from './components/SectionNav';
import { MobileNavigation } from './components/MobileNavigation';
import { MoreSheet } from './components/MoreSheet';
import { type NavId, pathToNavId, navIdToPath, isProtectedAppPath, DEFAULT_NAV_ID, MORE_SHEET_IDS, CONTROLS_HUD_IDS, isDashboardView } from './lib/navigation';
import { DASHBOARD_TABS } from './lib/dashboardTabs';
import { TabGroup, type TabGroupItem } from './components/ui';
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import SunCalc from 'suncalc';
import ReactMarkdown from 'react-markdown';
import { 
  Compass, 
  Clock, 
  Info, 
  Maximize2, 
  Moon, 
  Sun, 
  CircleDot,
  ChevronRight,
  Activity,
  Play,
  Pause,
  CalendarDays,
  Rewind,
  FastForward,
  MapPin,
  Loader2,
  Sparkles,
  ChevronDown,
  User as UserIcon,
  ChevronUp,
  Download,
  X,
  Bot,
  LogIn,
  LogOut,
  Save,
  Settings,
  LayoutGrid,
  ChartArea,
  Bookmark,
  CheckCircle2,
  BookOpen,
  Flame,
  List,
  Grid,
  Eye,
  Layers,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { Archives } from './components/Archives';
import { DateTimePicker } from './components/DateTimePicker';
import { toDateTimeLocalValue } from './lib/dateInputUtils';
import { useTheme } from './context/ThemeContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import AIAssistant from './components/AIAssistant';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cn, getOrdinal } from './lib/utils';
import { SkyMap } from './components/SkyMap';
import { CelestialBackground } from './components/CelestialBackground';
import { DataDashboard } from './components/DataDashboard';
import DivisionalCharts from './components/DivisionalCharts';
import { OnboardingFlow } from './components/Onboarding';
import { PendingApprovalBanner } from './components/PendingApprovalBanner';
import type { ChildProfile } from './pages/ProfilesPage';
import { lazyWithReload } from './lib/lazyWithReload';
// Route-level components are lazy-loaded to reduce initial bundle parse cost
const CosmicReport = lazyWithReload(() => import('./components/CosmicReport.tsx').then(m => ({ default: m.CosmicReport })));
const AIChatPage = lazyWithReload(() => import('./pages/AIChatPage.tsx'));
const ProfilesPage = lazyWithReload(() => import('./pages/ProfilesPage.tsx'));
const SudarshanaChakraPage = lazyWithReload(() => import('./pages/SudarshanaChakraPage.tsx'));
const AdminPage = lazyWithReload(() => import('./pages/AdminPage.tsx'));
import { callGeminiProxy, withRetry, getErrorMessage } from './lib/api-utils';
import { debugError, debugLog, debugWarn } from './lib/debug';
import { APIErrorMessage } from './components/APIErrorMessage';
import { UserProfile } from './components/UserProfile';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  Timestamp,
  handleFirestoreError,
  OperationType,
  orderBy,
  query,
  addDoc,
  fetchWithRetry,
  createPendingRegistration,
} from './firebase';
import { deleteDoc } from 'firebase/firestore';

const EphemerisModal = ({ 
  isOpen, 
  onClose, 
  onExport,
  start,
  setStart,
  end,
  setEnd,
  freq,
  setFreq,
  theme
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onExport: () => void,
  start: string,
  setStart: (s: string) => void,
  end: string,
  setEnd: (s: string) => void,
  freq: 'daily' | 'weekly',
  setFreq: (f: 'daily' | 'weekly') => void,
  theme: 'light' | 'dark'
}) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-colors duration-500",
        theme === 'dark' ? "bg-black/80" : "bg-slate-900/40"
      )}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-colors duration-500",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-surface-card border-border-gold"
        )}
      >
        <div className={cn("p-6 border-b flex justify-between items-center", theme === 'dark' ? "border-white/5" : "border-border-gold")}>
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-orange-500" />
            <h2 className={cn("text-lg font-bold uppercase tracking-tight font-serif italic", theme === 'dark' ? "text-white" : "text-ink-primary")}>Ephemeris Export</h2>
          </div>
          <button onClick={onClose} className={cn("p-2 rounded-lg transition-colors", theme === 'dark' ? "hover:bg-white/5 text-white/40" : "hover:bg-slate-100 text-slate-400")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Start Date</label>
              <input 
                type="date" 
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={cn(
                  "w-full border rounded-lg p-3 text-sm transition-colors",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-orange-500/50 [color-scheme:dark]" : "bg-white border-slate-200 text-slate-900 focus:border-orange-500/50 shadow-sm [color-scheme:light]"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>End Date</label>
              <input 
                type="date" 
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={cn(
                  "w-full border rounded-lg p-3 text-sm transition-colors",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white focus:border-orange-500/50 [color-scheme:dark]" : "bg-white border-slate-200 text-slate-900 focus:border-orange-500/50 shadow-sm [color-scheme:light]"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFreq(f)}
                  className={cn(
                    "flex-1 p-3 rounded-lg border text-sm uppercase tracking-widest font-mono transition-all",
                    freq === f 
                      ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                      : theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 shadow-sm"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={onExport}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            GENERATE CSV
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TransitInterpretationModal = ({ 
  isOpen, 
  onClose, 
  transit,
  interpretation,
  isLoading,
  user
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  transit: TransitEvent | null,
  interpretation: string | null,
  isLoading: boolean,
  user: User | null
}) => {
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
    }
  }, [isOpen, transit]);

  if (!isOpen || !transit) return null;

  const handleSave = async () => {
    if (!user || !interpretation || isSaved) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/interpretations`), {
        uid: user.uid,
        title: transit.title,
        content: interpretation,
        type: 'transit',
        context: transit.description,
        createdAt: Timestamp.now()
      });
      setIsSaved(true);
    } catch (error) {
      console.error("Error saving interpretation:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-colors duration-500",
        theme === 'dark' ? "bg-black/80" : "bg-slate-900/40"
      )}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl transition-colors duration-500 flex flex-col max-h-[80vh]",
          theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-surface-card border-border-gold"
        )}
      >
        <div className={cn("p-6 border-b flex justify-between items-center", theme === 'dark' ? "border-white/5 bg-white/5" : "border-border-gold bg-surface-muted")}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <div>
              <h2 className={cn("text-lg font-bold uppercase tracking-tight font-serif italic", theme === 'dark' ? "text-white/90" : "text-ink-primary")}>{transit.title}</h2>
              <p className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>AI Astrological Interpretation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && interpretation && (
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={cn(
                  "p-2 rounded-lg border transition-all flex items-center gap-2",
                  isSaved 
                    ? "bg-green-500/10 border-green-500/20 text-green-500" 
                    : theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
                title={isSaved ? "Saved to Profile" : "Save Interpretation"}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span className="text-[10px] uppercase tracking-widest font-mono hidden sm:inline">
                  {isSaved ? "Saved" : "Save Insight"}
                </span>
              </button>
            )}
            <button onClick={onClose} className={cn("p-2 rounded-lg transition-colors", theme === 'dark' ? "hover:bg-white/5 text-white/40" : "hover:bg-slate-100 text-slate-400")}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className={cn("text-sm font-mono uppercase tracking-widest animate-pulse", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Consulting the celestial spheres...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] uppercase tracking-widest px-2 py-0.5 rounded", 
                  transit.type === 'positive' ? 'bg-green-500/10 text-green-500' : 
                  transit.type === 'negative' ? 'bg-red-500/10 text-red-500' : 
                  'bg-blue-500/10 text-blue-500'
                )}>
                  {transit.type}
                </span>
                <span className={cn("text-xs font-mono italic", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>Original interpretation: {transit.description}</span>
              </div>
              
              <div className={cn("prose max-w-none", theme === 'dark' ? "prose-invert" : "")}>
                <div className={cn("markdown-body leading-relaxed text-sm", theme === 'dark' ? "text-white/80" : "text-ink-secondary")}>
                  <ReactMarkdown>{interpretation || "No interpretation generated."}</ReactMarkdown>
                </div>
              </div>

              {interpretation && (
                <div className={cn("pt-6 border-t flex justify-center", theme === 'dark' ? "border-white/5" : "border-border-gold")}>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl border transition-all text-xs uppercase tracking-[0.2em] font-mono",
                      isSaved 
                        ? "bg-green-500/10 border-green-500/20 text-green-500" 
                        : "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
                    )}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {isSaved ? "Interpretation Saved" : "Save to My Profile"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={cn("p-4 border-t flex justify-end transition-colors duration-500", theme === 'dark' ? "border-white/5 bg-white/[0.02]" : "border-border-gold bg-surface-muted")}>
          <button 
            onClick={onClose}
            className={cn(
              "px-6 py-2 rounded-lg border text-xs font-mono uppercase tracking-widest transition-colors",
              theme === 'dark' ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/60" : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600"
            )}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};



const geocode = async (query: string) => {
  if (!query || query.length < 2) return null;
  debugLog('geocode', 'Resolving location', { query });
  
  // 1. Try our own proxy first
  try {
    const res = await withRetry(() => fetch(`/api/geocode?name=${encodeURIComponent(query)}`));
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const coords = { lat: data.results[0].latitude, lon: data.results[0].longitude };
        debugLog('geocode', 'Resolved via proxy', { query, coords });
        return coords;
      }
    }
  } catch (e) {
    debugWarn('geocode', 'Proxy geocoding failed, trying direct fallbacks', e);
  }

  // 2. Direct fallbacks if proxy fails or is unavailable
  try {
    const res = await withRetry(() => fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`));
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const coords = { lat: data.results[0].latitude, lon: data.results[0].longitude };
        debugLog('geocode', 'Resolved via Open-Meteo fallback', { query, coords });
        return coords;
      }
    }
  } catch (e) {
    debugWarn('geocode', 'Open-Meteo geocoding failed, trying next fallback', e);
  }

  try {
    const res = await withRetry(() => fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`));
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        debugLog('geocode', 'Resolved via Nominatim fallback', { query, coords });
        return coords;
      }
    }
  } catch (e) {
    debugWarn('geocode', 'Nominatim geocoding failed, trying final fallback', e);
  }

  try {
    const res = await withRetry(() => fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`));
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        const coords = { lat, lon };
        debugLog('geocode', 'Resolved via Photon fallback', { query, coords });
        return coords;
      }
    }
  } catch (e) {
    debugError('geocode', 'All geocoding services failed', e);
    console.error("All geocoding services failed:", e);
    throw e;
  }
  debugWarn('geocode', 'No geocoding results found', { query });
  return null;
};

const reverseGeocode = async (lat: number, lon: number) => {
  debugLog('reverse-geocode', 'Resolving coordinates', { lat, lon });

  // 1. Try our own proxy first
  try {
    const res = await withRetry(() => fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`));
    if (res.ok) {
      const data = await res.json();
      // Universal field check from our proxy which might return BigDataCloud or Nominatim structure
      const locationName = data.city || data.locality || data.principalSubdivision || (data.address && (data.address.city || data.address.town)) || "Unknown Location";
      debugLog('reverse-geocode', 'Resolved via proxy', { lat, lon, locationName });
      return locationName;
    }
  } catch (e) {
    debugWarn('reverse-geocode', 'Proxy reverse geocoding failed, trying direct fallbacks', e);
  }

  // 2. Direct fallbacks
  try {
    const res = await withRetry(() => fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`));
    if (res.ok) {
      const data = await res.json();
      const locationName = data.city || data.locality || data.principalSubdivision || "Unknown Location";
      debugLog('reverse-geocode', 'Resolved via BigDataCloud fallback', { lat, lon, locationName });
      return locationName;
    }
  } catch (e) {
    debugWarn('reverse-geocode', 'BigDataCloud reverse geocoding failed, trying next fallback', e);
  }

  try {
    const res = await withRetry(() => fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`));
    if (res.ok) {
      const data = await res.json();
      const locationName = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown Location";
      debugLog('reverse-geocode', 'Resolved via Nominatim fallback', { lat, lon, locationName });
      return locationName;
    }
  } catch (e) {
    debugWarn('reverse-geocode', 'Nominatim reverse geocoding failed, trying final fallback', e);
  }

  try {
    const res = await withRetry(() => fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`));
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const locationName = props.city || props.town || props.name || "Unknown Location";
        debugLog('reverse-geocode', 'Resolved via Photon fallback', { lat, lon, locationName });
        return locationName;
      }
    }
  } catch (e) {
    debugError('reverse-geocode', 'All reverse geocoding services failed', e);
    console.error("All reverse geocoding services failed:", e);
    throw e;
  }
  debugWarn('reverse-geocode', 'No reverse geocoding results found', { lat, lon });
  return null;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authProfileError, setAuthProfileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavId>(() => {
    // Initialize from URL so the activeTab→URL effect doesn't redirect on first render
    return pathToNavId(window.location.pathname) ?? DEFAULT_NAV_ID;
  });
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'transit' | 'natal'>('natal');
  const [isLive, setIsLive] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayTime, setDisplayTime] = useState(new Date());
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedZodiac, setSelectedZodiac] = useState<number | null>(null);
  const [hoveredPlanetName, setHoveredPlanetName] = useState<string | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'circle' | 'north-indian'>(
    // Default to the North Indian kundali on mobile (< lg), circle sky map on desktop.
    () => (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'north-indian' : 'circle')
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [isYogasExpanded, setIsYogasExpanded] = useState(false);
  const [isTransitsExpanded, setIsTransitsExpanded] = useState(false);
  const [isUpcomingTransitsExpanded, setIsUpcomingTransitsExpanded] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'yogas' | 'transits' | 'natal' | 'upcoming' | 'panchang' | 'ashtakavarga' | 'muhurta' | 'dashas' | 'impacts' | 'blueprint' | 'rectify' | 'vargas'>('overview');
  const [apiError, setApiError] = useState<{ error: any; title: string; retry?: () => void } | null>(null);
  const { theme, toggleTheme } = useTheme();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  /** Set when URL→tab sync updates activeTab so tab→URL sync does not fight back. */
  const skipNextPathSyncRef = useRef(false);

  const canUseAppPaths = Boolean(isAuthReady && user && userProfile?.onboardingCompleted);

  // Logged-out (or not yet onboarded) users stay on `/` with hash anchors; block deep links to app tabs.
  useEffect(() => {
    if (!isAuthReady || !isProtectedAppPath(routerLocation.pathname)) return;
    if (!user) {
      navigate({ pathname: '/', search: routerLocation.search }, { replace: true });
      return;
    }
    if (userProfile === null) return;
    if (!userProfile.onboardingCompleted) {
      navigate({ pathname: '/', search: routerLocation.search }, { replace: true });
    }
  }, [isAuthReady, user, userProfile, routerLocation.pathname, routerLocation.search, navigate]);

  // URL → activeTab (back/forward, deep links) — reacts to pathname only
  useEffect(() => {
    if (!canUseAppPaths) return;
    const id = pathToNavId(routerLocation.pathname);
    if (!id) return;
    setActiveTab((prev) => {
      if (prev === id) return prev;
      skipNextPathSyncRef.current = true;
      return id;
    });
  }, [routerLocation.pathname, canUseAppPaths]);

  // activeTab → URL (nav clicks) — reacts to activeTab only
  useEffect(() => {
    if (!canUseAppPaths) return;
    if (skipNextPathSyncRef.current) {
      skipNextPathSyncRef.current = false;
      return;
    }
    const desiredPath = navIdToPath(activeTab);
    if (routerLocation.pathname !== desiredPath) {
      navigate(desiredPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname is read, not watched; watching it causes ping-pong with URL→tab sync
  }, [activeTab, canUseAppPaths, navigate]);

  // Keep chart geometry coupled to Sky / Kundli destinations (URL + nav)
  useEffect(() => {
    if (activeTab === 'sky') setChartType('circle');
    if (activeTab === 'chart') setChartType('north-indian');
  }, [activeTab]);

  const [selectedTransitForAI, setSelectedTransitForAI] = useState<TransitEvent | null>(null);
  const [transitInterpretation, setTransitInterpretation] = useState<string | null>(null);
  const [isInterpretingTransit, setIsInterpretingTransit] = useState(false);

  // Auth & Persistence
  useEffect(() => {
    debugLog('auth', 'Initializing auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      debugLog('auth', 'Auth state changed', currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous,
      } : { authenticated: false });
      setUser(currentUser);
      setAuthProfileError(null);
      if (currentUser) {
        // Load user settings with retry
        try {
          debugLog('auth', 'Loading user profile', { uid: currentUser.uid });
          const userDoc = await fetchWithRetry(() => getDoc(doc(db, 'users', currentUser.uid)));
          if (userDoc.exists()) {
            const data = userDoc.data();
            debugLog('auth', 'User profile loaded', {
              uid: currentUser.uid,
              onboardingCompleted: Boolean(data.onboardingCompleted),
              savedCharts: Array.isArray(data.savedCharts) ? data.savedCharts.length : 0,
            });
            setUserProfile(data);
            
            // Load child profiles (activeChildProfileId is session-only — always default to own profile)
            if (Array.isArray(data.childProfiles)) {
              setChildProfiles(data.childProfiles);
            }
            
            // Only set birth details if onboarding is completed
            if (data.onboardingCompleted) {
              // Always load own account birth data from birthDetails first (canonical source).
              // savedCharts[activeChartId] is kept as a fallback only, since birthDetails
              // can be corrupted if a child profile was active when saveBirthDetails ran.
              const ownBirth = data.birthDetails || (() => {
                if (data.activeChartId && Array.isArray(data.savedCharts)) {
                  return data.savedCharts.find((c: any) => c.id === data.activeChartId) || data.savedCharts[0] || null;
                }
                return Array.isArray(data.savedCharts) && data.savedCharts.length > 0 ? data.savedCharts[0] : null;
              })();

              if (ownBirth) {
                setBirthTime(new Date(ownBirth.time));
                setBirthLocation({ lat: ownBirth.lat, lon: ownBirth.lon });
                applyStoredBirthCity(ownBirth.city);
                setIsBirthMode(true);
                setViewMode('natal');
                setDashboardTab('natal');
              }

              if (data.defaultLocation) {
                setLocation({ lat: data.defaultLocation.lat, lon: data.defaultLocation.lon });
                setCity(data.defaultLocation.city);
              }
            }
          } else {
            // Create initial profile (onboarding not completed), pending admin approval
            const initialProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || '',
              email: currentUser.email,
              photoURL: currentUser.photoURL || '',
              onboardingCompleted: false,
              approvalStatus: 'pending',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            };
            await setDoc(doc(db, 'users', currentUser.uid), initialProfile);
            setUserProfile(initialProfile);
            // Write to pending queue so admins can see and approve this registration
            try {
              await createPendingRegistration(currentUser.uid, currentUser.email, currentUser.displayName);
            } catch (regErr) {
              debugWarn('auth', 'createPendingRegistration failed (non-fatal)', regErr);
            }
          }
        } catch (error) {
          debugError('auth', 'Unable to load user profile', error);
          setAuthProfileError('We signed you in, but could not load your profile. Check your connection and try again.');
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (onboardingData: any) => {
    if (!user) return;
    
    try {
      const birthTimeObj = new Date(onboardingData.birthTime);
      const birthDetails = {
        time: onboardingData.birthTime,
        lat: onboardingData.lat,
        lon: onboardingData.lon,
        city: onboardingData.birthCity,
        timezone: onboardingData.timezone || null
      };

      const initialChart = {
        id: Date.now().toString(),
        name: 'My Birth Chart',
        time: onboardingData.birthTime,
        lat: onboardingData.lat,
        lon: onboardingData.lon,
        city: onboardingData.birthCity,
        timezone: onboardingData.timezone || null,
        createdAt: Timestamp.now()
      };

      const updatedProfile = {
        ...userProfile,
        firstName: onboardingData.firstName,
        lastName: onboardingData.lastName,
        gender: onboardingData.gender,
        displayName: `${onboardingData.firstName} ${onboardingData.lastName}`,
        birthDetails,
        savedCharts: [initialChart],
        activeChartId: initialChart.id,
        onboardingCompleted: true,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, 'users', user.uid), updatedProfile);
      setUserProfile(updatedProfile);
      
      // Update local state
      setBirthTime(birthTimeObj);
      setBirthLocation({ lat: onboardingData.lat, lon: onboardingData.lon });
      applyStoredBirthCity(onboardingData.birthCity);
      setIsBirthMode(true);
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAutoSelectNatal = () => {
    if (userProfile?.savedCharts && userProfile.savedCharts.length > 0) {
      const firstChart = userProfile.savedCharts[0];
      // Only rewrite birth state when the chart actually differs — recreating
      // Date/location on every Birth-tab click churns birthFingerprint and
      // forces natal AI reports (planet insights, etc.) to clear + regenerate.
      const nextTime = new Date(firstChart.time);
      const timeChanged = !birthTime || birthTime.getTime() !== nextTime.getTime();
      const locChanged =
        !birthLocation ||
        birthLocation.lat !== firstChart.lat ||
        birthLocation.lon !== firstChart.lon;
      if (timeChanged) setBirthTime(nextTime);
      if (locChanged) setBirthLocation({ lat: firstChart.lat, lon: firstChart.lon });
      if (birthCity !== firstChart.city) applyStoredBirthCity(firstChart.city);
      setIsBirthMode(true);
      setViewMode('natal');
      setDashboardTab('natal');
    } else {
      setViewMode('natal');
      setDashboardTab('natal');
      setIsBirthMode(true);
      if (!birthTime) {
        setActiveTab('profile');
      }
    }
  };

  const switchToTransitMode = () => {
    setViewMode('transit');
    setIsBirthMode(false);
  };

  const saveBirthDetails = async () => {
    // Never save when viewing a child profile — would corrupt the user's own birth data
    if (!user || !birthTime || !birthLocation || activeChildProfileId) return;
    try {
      let updatedCharts;
      let targetId;

      if (editingChartId) {
        // Update existing chart
        updatedCharts = (userProfile?.savedCharts || []).map((chart: any) => 
          chart.id === editingChartId 
            ? { ...chart, name: `Chart - ${birthCity}`, time: birthTime.toISOString(), lat: birthLocation.lat, lon: birthLocation.lon, city: birthCity }
            : chart
        );
        targetId = editingChartId;
      } else {
        // Create new chart
        const newChart = {
          id: Date.now().toString(),
          name: `Chart - ${birthCity}`,
          time: birthTime.toISOString(),
          lat: birthLocation.lat,
          lon: birthLocation.lon,
          city: birthCity
        };
        updatedCharts = [...(userProfile?.savedCharts || []), newChart];
        targetId = newChart.id;
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        savedCharts: updatedCharts,
        activeChartId: targetId,
        birthDetails: {
          time: birthTime.toISOString(),
          city: birthCity,
          lat: birthLocation.lat,
          lon: birthLocation.lon
        },
        updatedAt: Timestamp.now()
      });
      
      setUserProfile({
        ...userProfile,
        savedCharts: updatedCharts,
        activeChartId: targetId,
        birthDetails: {
          time: birthTime.toISOString(),
          city: birthCity,
          lat: birthLocation.lat,
          lon: birthLocation.lon
        }
      });
      
      setEditingChartId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const saveDefaultLocation = async () => {
    if (!user || !location) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        defaultLocation: {
          lat: location.lat,
          lon: location.lon,
          city: city
        },
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // ── Child Profiles CRUD ────────────────────────────────────────────────────
  const saveChildProfile = async (profile: Omit<ChildProfile, 'id' | 'createdAt'> & { id?: string }) => {
    if (!user) return;
    const existing = childProfiles.find(p => p.id === profile.id);
    let updated: ChildProfile[];

    if (existing) {
      updated = childProfiles.map(p =>
        p.id === profile.id
          ? { ...p, name: profile.name, birthTime: profile.birthTime, lat: profile.lat, lon: profile.lon, city: profile.city }
          : p
      );
    } else {
      if (childProfiles.length >= 5) return;
      const newProfile: ChildProfile = {
        ...profile,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      } as ChildProfile;
      updated = [...childProfiles, newProfile];
    }

    await updateDoc(doc(db, 'users', user.uid), { childProfiles: updated, updatedAt: Timestamp.now() });
    setChildProfiles(updated);
  };

  const deleteChildProfile = async (id: string) => {
    if (!user) return;
    const updated = childProfiles.filter(p => p.id !== id);
    const wasActive = activeChildProfileId === id;

    await updateDoc(doc(db, 'users', user.uid), {
      childProfiles: updated,
      updatedAt: Timestamp.now()
    });
    setChildProfiles(updated);

    if (wasActive) {
      setActiveChildProfileId(null);
      // Restore own chart
      const bd = userProfile?.birthDetails;
      if (bd) {
        setBirthTime(new Date(bd.time));
        setBirthLocation({ lat: bd.lat, lon: bd.lon });
        applyStoredBirthCity(bd.city);
      }
    }
  };

  const loadChildProfile = async (id: string) => {
    const profile = childProfiles.find(p => p.id === id);
    if (!profile) return;

    setActiveChildProfileId(id);
    setBirthTime(new Date(profile.birthTime));
    setBirthLocation({ lat: profile.lat, lon: profile.lon });
    applyStoredBirthCity(profile.city);
    setIsBirthMode(true);
    setViewMode('natal');
    setDashboardTab('natal');
    setActiveTab('overview');

    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { updatedAt: Timestamp.now() });
    }
  };

  const clearChildProfile = async () => {
    setActiveChildProfileId(null);

    const bd = userProfile?.birthDetails;
    const savedCharts = userProfile?.savedCharts;
    if (bd) {
      setBirthTime(new Date(bd.time));
      setBirthLocation({ lat: bd.lat, lon: bd.lon });
      applyStoredBirthCity(bd.city);
    } else if (savedCharts && savedCharts.length > 0) {
      const chart = savedCharts[0];
      setBirthTime(new Date(chart.time));
      setBirthLocation({ lat: chart.lat, lon: chart.lon });
      applyStoredBirthCity(chart.city);
    }

    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { updatedAt: Timestamp.now() });
    }
  };
  // ── /Child Profiles ────────────────────────────────────────────────────────

  const saveProfile = async (data: any) => {
    if (!user) return;
    try {
      // Geocode default location if it changed
      let defLoc = location;

      if (data.defaultLocation?.city && data.defaultLocation.city !== userProfile?.defaultLocation?.city) {
        const coords = await geocode(data.defaultLocation.city);
        if (coords) {
          defLoc = coords;
        }
      }

      // Handle birth details geocoding if provided
      let bDetails = userProfile?.birthDetails;
      if (data.birthDetails) {
        bDetails = { ...data.birthDetails };
        // Only auto-geocode if the city name has changed
        if (data.birthDetails.city && data.birthDetails.city !== userProfile?.birthDetails?.city) {
          const coords = await geocode(data.birthDetails.city);
          if (coords) {
            bDetails.lat = coords.lat;
            bDetails.lon = coords.lon;
          }
        }
        // If city is the same, we trust the lat/lon provided in data (manual edit or existing profile)
      }

      // Geocode new saved charts - fall back to existing charts if not provided in data
      const chartsToProcess = data.savedCharts || userProfile?.savedCharts || [];
      const updatedSavedCharts = await Promise.all(
        chartsToProcess.map(async (chart: any) => {
          if (chart.lat && chart.lon) return chart; // Already geocoded
          
          try {
            const coords = await geocode(chart.city);
            if (coords) {
              return {
                ...chart,
                lat: coords.lat,
                lon: coords.lon
              };
            }
          } catch (e) {
            console.error("Geocoding failed for", chart.city, e);
          }
          return chart;
        })
      );

      const updatedProfile = {
        ...userProfile,
        displayName: data.displayName || userProfile?.displayName,
        firstName: data.firstName || userProfile?.firstName,
        lastName: data.lastName || userProfile?.lastName,
        savedCharts: updatedSavedCharts,
        activeChartId: data.activeChartId || userProfile?.activeChartId || null,
        birthDetails: bDetails,
        gender: data.gender || userProfile?.gender,
        defaultLocation: {
          city: data.defaultLocation?.city || userProfile?.defaultLocation?.city || "",
          lat: defLoc?.lat || 0,
          lon: defLoc?.lon || 0
        },
        notifications: data.notifications || userProfile?.notifications || {
          majorTransits: true,
          significantYogas: true,
          planetaryConjunctions: true
        },
        updatedAt: Timestamp.now()
      };

      // Ensure no undefined values are sent to Firestore
      const cleanProfile = JSON.parse(JSON.stringify(updatedProfile));

      await updateDoc(doc(db, 'users', user.uid), cleanProfile);
      setUserProfile(updatedProfile);
      
      // Update local state
      const targetActiveId = data.activeChartId || userProfile?.activeChartId;
      const activeChart = updatedSavedCharts.find(c => c.id === targetActiveId);
      
      if (activeChart && activeChart.time) {
        setBirthTime(new Date(activeChart.time));
        setBirthLocation({ lat: activeChart.lat, lon: activeChart.lon });
        applyStoredBirthCity(activeChart.city);
        setIsBirthMode(true);
      } else if (updatedProfile.birthDetails && updatedProfile.birthDetails.time) {
        // Fallback to birthDetails if no active chart is selected or found
        setBirthTime(new Date(updatedProfile.birthDetails.time));
        setBirthLocation({ lat: updatedProfile.birthDetails.lat, lon: updatedProfile.birthDetails.lon });
        applyStoredBirthCity(updatedProfile.birthDetails.city);
        setIsBirthMode(true);
      } else {
        setIsBirthMode(false);
      }
      
      if (updatedProfile.defaultLocation.city) {
        setLocation(updatedProfile.defaultLocation);
        setCity(updatedProfile.defaultLocation.city);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const interpretTransit = async (transit: TransitEvent) => {
    setSelectedTransitForAI(transit);
    setIsInterpretingTransit(true);
    setTransitInterpretation(null);

    try {
      const formatPositions = (pos: PlanetPosition[]) =>
        pos.map(p => {
          const nakData = NAKSHATRA_DATA[p.nakshatra];
          return {
            name: p.name,
            rashi: p.rashi,
            nakshatra: p.nakshatra,
            nakshatraLord: nakData?.lord,
            nakshatraDeity: nakData?.deity,
            pada: p.pada,
            degree: `${p.degree}°${p.minute}'`,
            house: p.house,
            isRetrograde: p.isRetrograde,
            isCombust: p.isCombust,
            dignity: p.dignity
          };
        });

      const systemInstruction = `You are an expert Vedic Astrologer (Jyotishi).
Your goal is to provide a deep, insightful interpretation of a specific transit event.
Be professional, compassionate, and use traditional Vedic concepts (Lagna, Rashi, Nakshatra, Bhava).

DATA CONTEXT:
1. TRANSIT CHART (Current Sky):
${JSON.stringify(formatPositions(positions), null, 2)}

2. BIRTH CHART (Natal):
${birthPositions ? JSON.stringify(formatPositions(birthPositions), null, 2) : 'No birth data provided. Focus on current transits.'}

THE SPECIFIC TRANSIT TO INTERPRET:
Title: ${transit.title}
Type: ${transit.type}
Description: ${transit.description}
Planets Involved: ${transit.planets.join(', ')}

INTERPRETATION GUIDELINES:
- Explain the significance of this transit in detail.
- How does it affect the specific houses and planets involved?
- What are the potential real-world manifestations?
- Provide practical advice.
- Use markdown for structure (headings, bullet points, bold text).`;

      const text = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: 'Please provide a detailed Vedic interpretation of this transit.' }] },
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      setTransitInterpretation(text || "I apologize, but I'm having trouble interpreting this transit at the moment.");
    } catch (error) {
      console.error("Transit Interpretation Error:", error);
      setApiError({
        error: error,
        title: "Transit Interpretation Failed",
        retry: () => interpretTransit(transit)
      });
    } finally {
      setIsInterpretingTransit(false);
    }
  };

  const interpretPrediction = async (prediction: TransitPrediction) => {
    const title = prediction.type === 'Natal Conjunction' 
      ? `${prediction.planet} conjoins Natal ${prediction.to}`
      : prediction.type === 'House Change'
      ? `${prediction.planet} enters ${prediction.to}`
      : `${prediction.planet} enters ${prediction.to}`;

    const mockEvent: TransitEvent = {
      title,
      description: `Predicted for ${format(prediction.date, 'MMMM d, yyyy')}. ${prediction.isImportant ? 'This is a significant event.' : ''}`,
      type: 'neutral',
      planets: [prediction.planet],
      startDate: prediction.date,
      endDate: prediction.date
    };

    setSelectedTransitForAI(mockEvent);
    setIsInterpretingTransit(true);
    setTransitInterpretation("");

    try {
      const formatPositions = (pos: PlanetPosition[]) =>
        pos.map(p => {
          const nakData = NAKSHATRA_DATA[p.nakshatra];
          return {
            name: p.name,
            rashi: p.rashi,
            nakshatra: p.nakshatra,
            nakshatraLord: nakData?.lord,
            nakshatraDeity: nakData?.deity,
            pada: p.pada,
            degree: `${p.degree}°${p.minute}'`,
            house: p.house,
            isRetrograde: p.isRetrograde,
            isCombust: p.isCombust,
            dignity: p.dignity
          };
        });

      const title = prediction.type === 'Natal Conjunction'
        ? `${prediction.planet} conjoins Natal ${prediction.to}`
        : prediction.type === 'House Change'
        ? `${prediction.planet} enters ${prediction.to}`
        : `${prediction.planet} enters ${prediction.to}`;

      const systemInstruction = `You are an expert Vedic Astrologer (Jyotishi).
Your goal is to provide a predictive interpretation of an upcoming transit event.
Be professional, foresightful, and use traditional Vedic concepts (Lagna, Rashi, Nakshatra, Bhava).

DATA CONTEXT:
1. TRANSIT DATE: ${format(prediction.date, 'MMMM d, yyyy')}
2. BIRTH CHART (Natal):
${birthPositions ? JSON.stringify(formatPositions(birthPositions), null, 2) : 'No birth data provided.'}

THE UPCOMING TRANSIT TO INTERPRET:
Planet: ${prediction.planet}
Event Type: ${prediction.type}
Move: From ${prediction.from} to ${prediction.to}
Date: ${format(prediction.date, 'MMMM d, yyyy')}

INTERPRETATION GUIDELINES:
- Explain what this upcoming transit means for the individual.
- Focus on the specific ${prediction.type} and the transition involved.
- How should the user prepare for this date?
- What are the potential opportunities or challenges?
- Use markdown for structure.`;

      const text = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: 'Please provide a detailed Vedic interpretation of this upcoming transit.' }] },
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      setTransitInterpretation(text || "I apologize, but I'm having trouble interpreting this upcoming transit at the moment.");
    } catch (error) {
      console.error("Prediction Interpretation Error:", error);
      setApiError({
        error: error,
        title: "Prediction Interpretation Failed",
        retry: () => interpretPrediction(prediction)
      });
    } finally {
      setIsInterpretingTransit(false);
    }
  };
  
  // Birth Chart State
  const [birthTime, setBirthTime] = useState<Date | null>(null);
  const [rectifyTime, setRectifyTime] = useState<Date | null>(null); 
  const [isRectifying, setIsRectifying] = useState(false);
  const [birthLocation, setBirthLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [birthCity, setBirthCityState] = useState<string>("");
  /**
   * Geocoding may only run for a city the user typed. A city restored from
   * Firestore already carries its authoritative coordinates; re-resolving it
   * returns a slightly different centroid (providers disagree, and the fallback
   * chain can answer instead of the proxy), which shifts `birthFingerprint` a
   * second after load and invalidates every cached natal AI report.
   */
  const isBirthCityUserEditedRef = useRef(false);
  const setBirthCity = useCallback((cityName: string) => {
    isBirthCityUserEditedRef.current = true;
    setBirthCityState(cityName);
  }, []);
  /** Restores a city whose coordinates are already known — never geocoded. */
  const applyStoredBirthCity = useCallback((cityName: string) => {
    isBirthCityUserEditedRef.current = false;
    setBirthCityState(cityName);
  }, []);
  const [isBirthMode, setIsBirthMode] = useState(false);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  
  // Child profiles state (family & friends, up to 5)
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [activeChildProfileId, setActiveChildProfileId] = useState<string | null>(null);
  
  // Ephemeris Export State
  const [showEphemerisModal, setShowEphemerisModal] = useState(false);
  const [ephemerisStart, setEphemerisStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [ephemerisEnd, setEphemerisEnd] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [ephemerisFreq, setEphemerisFreq] = useState<'daily' | 'weekly'>('daily');

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(addDays(new Date(), 30))
  });

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>({ lat: 23.1765, lon: 75.7885 });
  const [city, setCity] = useState<string | null>("Ujjain, India (Default)");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locateMe = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon });
        
        try {
          const cityName = await reverseGeocode(lat, lon);
          if (cityName) setCity(cityName);
          else setCity(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        } catch (err) {
          setCity(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
          setApiError({ 
            error: err, 
            title: "Reverse Geocoding Failed", 
            retry: locateMe 
          });
        }
        setIsLocating(false);
      },
      (err) => {
        setLocationError(err.message);
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    locateMe();
  }, []);

  useEffect(() => {
    if (!isLive) return;
    // Calculation timer: every 10s to reduce expensive recalculations
    const calcTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    // Display timer: every 1s so the clock stays accurate
    const displayTimer = setInterval(() => {
      setDisplayTime(new Date());
    }, 1000);
    return () => {
      clearInterval(calcTimer);
      clearInterval(displayTimer);
    };
  }, [isLive]);

  const adjustTime = (days: number) => {
    setIsLive(false);
    setCurrentTime(prev => new Date(prev.getTime() + days * 86400000));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    setIsLive(false);
    setCurrentTime(new Date(e.target.value));
  };

  // Geocode birth city
  useEffect(() => {
    if (!isBirthCityUserEditedRef.current) return;
    if (!birthCity || birthCity.length < 3) return;
    
    const timer = setTimeout(async () => {
      try {
        setApiError(null);
        const coords = await geocode(birthCity);
        if (coords) {
          // Sub-100 m differences are below the fingerprint's precision, so
          // keeping the previous object avoids pointless natal recalculation.
          setBirthLocation(prev =>
            prev &&
            Math.abs(prev.lat - coords.lat) < 0.0005 &&
            Math.abs(prev.lon - coords.lon) < 0.0005
              ? prev
              : coords,
          );
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setApiError({ 
          error: error, 
          title: "Birth City Geocoding Failed",
          retry: () => setBirthCity(birthCity) // This will trigger the effect again
        });
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [birthCity]);

  // ---------------------------------------------------------------------------
  // High-precision planet positions via Swiss Ephemeris (server-side)
  // Transit positions: refetch every minute (planets don't visibly shift per-second)
  // ---------------------------------------------------------------------------

  const [transitPositions, setTransitPositions] = useState<PlanetPosition[]>(() =>
    calculatePositions(new Date(), undefined, undefined)
  );
  const transitMinuteKey = Math.floor(currentTime.getTime() / 60000);

  useEffect(() => {
    let cancelled = false;

    fetchPlanetPositions(currentTime, location?.lat, location?.lon)
      .then(pos => { if (!cancelled) setTransitPositions(pos); })
      .catch(() => {
        // On failure keep previous positions; fall back to local calculation
        if (!cancelled) setTransitPositions(calculatePositions(currentTime, location?.lat, location?.lon));
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitMinuteKey, location?.lat, location?.lon]);

  // Exact sign-ingress events from the Swiss Ephemeris transit engine, covering
  // a window wide enough for both current-transit windows (getTransitWindow)
  // and the 90-day upcoming-transits prediction. Refetched once per day.
  const [transitIngresses, setTransitIngresses] = useState<TransitIngress[]>([]);
  const ingressDayKey = format(currentTime, 'yyyy-MM-dd');

  useEffect(() => {
    let cancelled = false;
    const windowStart = subDays(startOfDay(currentTime), 30);
    const windowEnd = addDays(startOfDay(currentTime), 90);

    fetchTransitIngresses(windowStart, windowEnd)
      .then(ingresses => { if (!cancelled) setTransitIngresses(ingresses); })
      .catch(() => {
        // Keep previous ingress data; getTransitWindow()/predictTransits() fall
        // back to the PLANET_SPEEDS estimate when no ingress covers a date.
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingressDayKey]);

  const [birthPositions, setBirthPositions] = useState<PlanetPosition[] | null>(null);

  useEffect(() => {
    if (!birthTime) {
      setBirthPositions(null);
      return;
    }
    let cancelled = false;

    fetchPlanetPositions(birthTime, birthLocation?.lat, birthLocation?.lon)
      .then(pos => { if (!cancelled) setBirthPositions(pos); })
      .catch(() => {
        if (!cancelled) setBirthPositions(calculatePositions(birthTime, birthLocation?.lat, birthLocation?.lon));
      });

    return () => { cancelled = true; };
  }, [birthTime, birthLocation?.lat, birthLocation?.lon]);

  const [rectifiedPositions, setRectifiedPositions] = useState<PlanetPosition[] | null>(null);

  useEffect(() => {
    if (!rectifyTime) {
      setRectifiedPositions(null);
      return;
    }
    let cancelled = false;

    fetchPlanetPositions(rectifyTime, birthLocation?.lat, birthLocation?.lon)
      .then(pos => { if (!cancelled) setRectifiedPositions(pos); })
      .catch(() => {
        if (!cancelled) setRectifiedPositions(calculatePositions(rectifyTime, birthLocation?.lat, birthLocation?.lon));
      });

    return () => { cancelled = true; };
  }, [rectifyTime, birthLocation?.lat, birthLocation?.lon]);

  const positions = useMemo(() => {
    if (isRectifying && rectifiedPositions) return rectifiedPositions;
    if (viewMode === 'natal' && birthPositions) return birthPositions;
    return transitPositions;
  }, [viewMode, transitPositions, birthPositions, isRectifying, rectifiedPositions]);

  const comparisonPositions = useMemo(() => {
    if (viewMode === 'natal') return transitPositions;
    return birthPositions;
  }, [viewMode, transitPositions, birthPositions]);

  const yogas = useMemo(() => detectYogas(positions), [positions]);
  const birthYogas = useMemo(() => birthPositions ? detectYogas(birthPositions) : [], [birthPositions]);
  const ashtakavarga = useMemo(() => calculateAshtakavarga(positions), [positions]);
  const natalAshtakavarga = useMemo(() => birthPositions ? calculateAshtakavarga(birthPositions) : null, [birthPositions]);

  // Gate panchang on a 10-minute granularity key to avoid recalculating every 10s
  const panchangKey = useMemo(() => Math.floor(currentTime.getTime() / 600000), [currentTime]);
  const panchang = useMemo(() => calculatePanchang(currentTime, positions), [panchangKey, positions]);
  const birthPanchang = useMemo(() => {
    if (!birthTime || !birthPositions) return null;
    return calculatePanchang(birthTime, birthPositions);
  }, [birthTime, birthPositions]);

  const birthFingerprint = useMemo(() => {
    if (!birthTime || !birthLocation) return null;
    return `${birthTime.toISOString()}_${birthLocation.lat.toFixed(3)}_${birthLocation.lon.toFixed(3)}`;
  }, [birthTime, birthLocation?.lat, birthLocation?.lon]);
  const transits = useMemo(() => analyzeTransits(positions, currentTime, transitIngresses), [positions, currentTime, transitIngresses]);
  const upcomingTransits = useMemo(() => {
    if (dashboardTab !== 'upcoming') return null;
    // Always use transitPositions (current sky) as the starting point for predictions.
    // Using `positions` in natal mode would pass birthPositions, causing the function to
    // compare natal planet positions against future transits — producing false sign-ingress events.
    return predictTransits(startOfDay(currentTime), transitPositions, birthPositions || undefined, transitIngresses);
  }, [dashboardTab, format(currentTime, 'yyyy-MM-dd'), transitPositions, birthPositions, transitIngresses]);

  const natalComparisons = useMemo(() => {
    if (!birthPositions || !transitPositions) return [];
    return analyzeNatalComparison(transitPositions, birthPositions, currentTime, transitIngresses);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthPositions, transitPositions, transitMinuteKey, transitIngresses]);

  const birthSpecialPoints = useMemo(() => {
    if (!birthTime || !birthPositions || !birthLocation) return null;
    const info = getBirthInfo(birthTime, birthLocation.lat, birthLocation.lon);
    
    const asc = birthPositions.find(p => p.name === "Ascendant");
    if (!asc) return null;
    
    return calculateSpecialPointsV2(
      (RASHIS.indexOf(asc.rashi) + 1) as any,
      asc.siderealLongitude,
      birthPositions,
      info.sunAbsoluteLongitudeAtSunrise,
      info.minutesSinceSunrise,
      info.isDayBirth,
      info.daytimeDurationMinutes,
      info.dayOfWeek,
      birthTime,
      birthLocation.lat,
      birthLocation.lon,
      info.sunrise,
      info.sunset
    );
  }, [birthTime, birthPositions, birthLocation]);

  // Gate sunTimes on date string — no need to recalculate multiple times per day
  const currentDateStr = useMemo(() => format(currentTime, 'yyyy-MM-dd'), [currentTime]);
  const sunTimes = useMemo(() => {
    if (!location) return null;
    return SunCalc.getTimes(currentTime, location.lat, location.lon);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDateStr, location]);

  const exportData = () => {
    const data = {
      timestamp: currentTime.toISOString(),
      location: {
        lat: location?.lat,
        lon: location?.lon,
        city: city
      },
      sunTimes: sunTimes ? {
        sunrise: sunTimes.sunrise.toISOString(),
        sunset: sunTimes.sunset.toISOString()
      } : null,
      planetaryPositions: positions.map(p => ({
        name: p.name,
        longitude: p.longitude,
        siderealLongitude: p.siderealLongitude,
        isRetrograde: p.isRetrograde,
        isCombust: p.isCombust,
        rashi: p.rashi,
        nakshatra: p.nakshatra,
        pada: p.pada,
        dignity: p.dignity,
        degree: p.degree,
        minute: p.minute,
      })),
      yogas: yogas,
      ashtakavarga: ashtakavarga,
      transits: transits,
      rashiData: RASHI_DATA
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedic-sky-data-${format(currentTime, 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSV = () => {
    const startDate = new Date(ephemerisStart);
    const endDate = new Date(ephemerisEnd);
    const frequency = ephemerisFreq;
    const lat = location?.lat;
    const lon = location?.lon;

    const rows = [];
    // Header
    rows.push([
      'Date', 'Planet', 'Tropical Longitude', 'Sidereal Longitude', 'Rashi', 'Nakshatra', 'Pada', 'Dignity', 'Retrograde', 'Combust'
    ].join(','));

    let current = new Date(startDate);
    const step = frequency === 'daily' ? 1 : 7;

    while (current <= endDate) {
      const positions = calculatePositions(current, lat, lon);
      positions.forEach(p => {
        rows.push([
          format(current, 'yyyy-MM-dd'),
          p.name,
          p.longitude.toFixed(4),
          p.siderealLongitude.toFixed(4),
          p.rashi,
          p.nakshatra,
          p.pada,
          p.dignity || 'Normal',
          p.isRetrograde ? 'Yes' : 'No',
          p.isCombust ? 'Yes' : 'No'
        ].join(','));
      });
      current.setDate(current.getDate() + step);
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ephemeris-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowEphemerisModal(false);
  };

  const activePlanet = useMemo(() =>
    positions.find(p => p.name === selectedPlanet) || positions[0],
    [positions, selectedPlanet]
  );

  // Stable fingerprint to avoid recalculating drishti when positions array reference changes
  // but planetary longitudes haven't meaningfully shifted (less than 1 degree)
  const positionsKey = useMemo(
    () => positions.map(p => `${p.name}:${Math.round(p.siderealLongitude)}`).join(','),
    [positions]
  );

  const activePlanetDrishti = useMemo(() =>
    calculateDrishti(activePlanet.name, positions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePlanet.name, positionsKey]
  );

  const natalPlanet = useMemo(() => 
    isBirthMode && birthPositions ? birthPositions.find(p => p.name === selectedPlanet) : null,
    [isBirthMode, birthPositions, selectedPlanet]
  );

  const isConjunctWithNatal = useMemo(() => {
    if (!isBirthMode || !birthPositions || activePlanet.name === "Ascendant") return false;
    return birthPositions.some(bp => bp.name !== "Ascendant" && isConjunct(activePlanet, bp));
  }, [isBirthMode, birthPositions, activePlanet]);

  const ascendant = useMemo(() => positions.find(p => p.name === "Ascendant"), [positions]);
  const mapOffset = ascendant ? -ascendant.siderealLongitude - 90 : 0;

  if (!isAuthReady) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-500",
        theme === 'dark' ? "bg-[#050505]" : "bg-surface-base"
      )}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-jyotish-gold"
        >
          <Sparkles className="w-12 h-12" />
        </motion.div>
      </div>
    );
  }

  if (isAuthReady && !user) {
    return <Navigate to="/" replace />;
  }

  if (authProfileError) {
    return (
      <main className="min-h-screen bg-[#08060d] px-6 text-white">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center">
          <div className="w-full rounded-3xl border border-red-400/20 bg-white/[0.03] p-8 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-red-300" />
            <h1 className="mt-5 font-serif text-3xl font-medium italic">Your profile is temporarily out of reach.</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">{authProfileError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-jyotish-gold px-6 py-3 text-sm font-semibold text-black"
            >
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !userProfile || !userProfile.onboardingCompleted) {
    return <OnboardingFlow theme={theme} user={user} onComplete={handleOnboardingComplete} />;
  }

  const isPendingApproval = userProfile?.approvalStatus === 'pending';

  const pageSuspenseFallback = (
    <div className="flex-1 flex items-center justify-center min-h-[12rem]">
      <Loader2 className="w-10 h-10 text-jyotish-gold animate-spin" />
    </div>
  );

  return (
    <div className={cn(
      "h-[100dvh] font-sans selection:bg-jyotish-gold/30 overflow-hidden flex flex-col transition-colors duration-500 universe-bg",
      theme === 'dark' ? "dark text-white" : "light bg-surface-base text-ink-primary"
    )}>
      {/* Atmospheric Background */}
      <CelestialBackground />

      {isPendingApproval && <PendingApprovalBanner />}

      <Header 
        isLocating={isLocating}
        locateMe={locateMe}
        city={city}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isBirthMode={isBirthMode}
        setIsBirthMode={setIsBirthMode}
        setDashboardTab={setDashboardTab}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        birthTime={birthTime}
        currentTime={displayTime}
        user={user}
        signInWithGoogle={signInWithGoogle}
        logout={logout}
        handleAutoSelectNatal={handleAutoSelectNatal}
        isAdmin={userProfile?.role === 'admin'}
      />

      <SectionNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Row 3 — dashboard section tabs (desktop only; mobile uses Insights modules sheet) */}
      {(activeTab === 'overview' || activeTab === 'stats') && (
        <TabGroup
          className="hidden lg:block"
          activeId={dashboardTab}
          onChange={(id) => {
            const tabDef = DASHBOARD_TABS.find((t) => t.id === id);
            if (tabDef?.requiredMode && tabDef.requiredMode !== viewMode) {
              if (tabDef.requiredMode === 'natal') {
                handleAutoSelectNatal();
              } else {
                switchToTransitMode();
              }
            }
            setDashboardTab(id as typeof dashboardTab);
          }}
          items={DASHBOARD_TABS.map((tab): TabGroupItem => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            group: tab.group,
            badge: tab.requiredMode && tab.requiredMode !== viewMode
              ? (tab.requiredMode === 'natal'
                  ? <Sparkles className="w-3 h-3 opacity-50" />
                  : <Compass className="w-3 h-3 opacity-50" />)
              : undefined,
          }))}
        />
      )}

      <AnimatePresence>
        {apiError && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <APIErrorMessage 
              error={apiError.error}
              title={apiError.title}
              onRetry={() => {
                const retryFn = apiError.retry;
                setApiError(null);
                retryFn?.();
              }}
              onClear={() => setApiError(null)}
            />
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 flex flex-col overflow-hidden custom-scrollbar pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
        {/* Kundli: D1 Vargas module (locked, no selector) */}
        {activeTab === 'chart' && (
          <div className={cn(
            "flex-1 overflow-y-auto px-4 pt-4 pb-6 lg:px-8 lg:pt-6",
            theme === 'dark' ? "bg-white/[0.02]" : "bg-white"
          )}>
            <div className="max-w-2xl mx-auto w-full">
              {birthPositions && birthPositions.length > 0 ? (
                <DivisionalCharts
                  birthPositions={birthPositions}
                  user={user}
                  userProfile={userProfile}
                  birthFingerprint={birthFingerprint}
                  lockedChart="D1"
                  footerLink={{
                    label: 'View divisional charts',
                    onClick: () => {
                      handleAutoSelectNatal();
                      setDashboardTab('vargas');
                      setActiveTab('stats');
                    },
                  }}
                />
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center py-24 gap-3",
                  theme === 'dark' ? "text-white/30" : "text-ink-faint"
                )}>
                  <Layers className="w-10 h-10 opacity-40" />
                  <p className="text-sm">Enter birth details to view your kundli</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Views Grid — Sky + Insights (dashboard tabs only) */}
        {isDashboardView(activeTab) && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden">
            {/* Left Panel: Sky Map — exclusive on mobile for sky */}
            <SkyMap
              chartType={chartType}
              setChartType={setChartType}
              activeTab={activeTab}
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
              selectedPlanet={selectedPlanet}
              setSelectedPlanet={setSelectedPlanet}
              hoveredPlanetName={hoveredPlanetName}
              setHoveredPlanetName={setHoveredPlanetName}
              selectedZodiac={selectedZodiac}
              setSelectedZodiac={setSelectedZodiac}
              positions={positions}
              comparisonPositions={comparisonPositions}
              isBirthMode={isBirthMode}
              viewMode={viewMode}
              setViewMode={setViewMode}
              hoveredHouse={hoveredHouse}
              setHoveredHouse={setHoveredHouse}
              location={location}
              mapOffset={mapOffset}
              birthTime={birthTime}
              setBirthTime={setBirthTime}
              birthCity={birthCity}
              setBirthCity={setBirthCity}
              birthLocation={birthLocation}
              saveBirthDetails={saveBirthDetails}
            />

            {/* Right Panel: Data Dashboard — exclusive on mobile for stats */}
            <div className={cn(
              "flex flex-col min-h-0 min-w-0 border-t lg:border-t-0 transition-colors duration-500 lg:col-span-6",
              theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-surface-card border-border-gold",
              activeTab === 'sky' ? "hidden lg:flex" : "flex"
            )}>
              <DataDashboard
                activeTab={dashboardTab}
                setActiveTab={setDashboardTab as any}
                currentTime={currentTime}
                isLive={isLive}
                setIsLive={setIsLive}
                handleDateChange={handleDateChange}
                adjustTime={adjustTime}
                isBirthMode={isBirthMode}
                setIsBirthMode={setIsBirthMode}
                editingChartId={editingChartId}
                setEditingChartId={setEditingChartId}
                user={user}
                birthTime={birthTime}
                setBirthTime={setBirthTime}
                birthCity={birthCity}
                setBirthCity={setBirthCity}
                saveBirthDetails={saveBirthDetails}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                positions={positions}
                birthSpecialPoints={birthSpecialPoints}
                comparisonPositions={comparisonPositions}
                selectedZodiac={selectedZodiac}
                setSelectedZodiac={setSelectedZodiac}
                selectedPlanet={selectedPlanet}
                setSelectedPlanet={setSelectedPlanet}
                activePlanet={activePlanet}
                activePlanetDrishti={activePlanetDrishti}
                isConjunctWithNatal={isConjunctWithNatal}
                natalPlanet={natalPlanet}
                transits={transits}
                upcomingTransits={upcomingTransits}
                natalComparisons={natalComparisons}
                yogas={yogas}
                panchang={panchang}
                birthPanchang={birthPanchang}
                sunTimes={sunTimes}
                ashtakavarga={ashtakavarga}
                viewMode={viewMode}
                dateRange={dateRange}
                setDateRange={setDateRange}
                handleAutoSelectNatal={handleAutoSelectNatal}
                switchToTransitMode={switchToTransitMode}
                interpretTransit={interpretTransit}
                interpretPrediction={interpretPrediction}
                isYogasExpanded={isYogasExpanded}
                setIsYogasExpanded={setIsYogasExpanded}
                isTransitsExpanded={isTransitsExpanded}
                setIsTransitsExpanded={setIsTransitsExpanded}
                isUpcomingTransitsExpanded={isUpcomingTransitsExpanded}
                setIsUpcomingTransitsExpanded={setIsUpcomingTransitsExpanded}
                setMainTab={setActiveTab as any}
                location={location}
                birthPositions={birthPositions}
                rectifyTime={rectifyTime}
                setRectifyTime={setRectifyTime}
                isRectifying={isRectifying}
                setIsRectifying={setIsRectifying}
                rectifiedPositions={rectifiedPositions}
                natalAshtakavarga={natalAshtakavarga}
                birthFingerprint={birthFingerprint}
                childProfiles={childProfiles}
                activeChildProfileId={activeChildProfileId}
                onLoadChildProfile={loadChildProfile}
                onClearChildProfile={clearChildProfile}
                onNavigateToProfiles={() => setActiveTab('profiles')}
              />
            </div>
          </div>
        )}

        {/* Admin */}
        {activeTab === 'admin' && user && userProfile && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <React.Suspense fallback={pageSuspenseFallback}>
              <AdminPage
                user={user}
                userProfile={userProfile}
                theme={theme}
                onClose={() => setActiveTab(DEFAULT_NAV_ID)}
              />
            </React.Suspense>
          </div>
        )}

        {/* Sudarshana Chakra */}
        {activeTab === 'sudarshana' && user && userProfile && (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {birthPositions ? (
              <React.Suspense fallback={pageSuspenseFallback}>
                <SudarshanaChakraPage
                  birthPositions={birthPositions}
                  birthTime={birthTime}
                  user={user}
                  userProfile={userProfile}
                  birthFingerprint={birthFingerprint}
                  childProfiles={childProfiles}
                  onClose={() => setActiveTab(DEFAULT_NAV_ID)}
                />
              </React.Suspense>
            ) : (
              <div className={cn(
                "flex flex-col items-center justify-center flex-1 gap-3",
                theme === 'dark' ? "text-white/30" : "text-ink-faint"
              )}>
                <CircleDot className="w-10 h-10 opacity-40" />
                <p className="text-sm">Enter birth details to view Sudarshana Chakra</p>
              </div>
            )}
          </div>
        )}

        {/* Full Cosmic Report */}
        {activeTab === 'report' && user && userProfile && (
          <div className={cn(
            "flex-1 min-h-0 overflow-y-auto font-sans selection:bg-jyotish-gold/30 transition-colors duration-500",
            theme === 'dark' ? "bg-[#050505] text-white" : "bg-surface-card text-ink-primary"
          )}>
            <React.Suspense fallback={pageSuspenseFallback}>
              <CosmicReport
                user={user}
                profile={userProfile}
                birthPositions={birthPositions}
                yogas={birthYogas}
                panchang={birthPanchang}
                blueprint={birthSpecialPoints}
                theme={theme}
                onClose={() => setActiveTab(DEFAULT_NAV_ID)}
                transitPositions={transitPositions}
                transits={transits}
                birthFingerprint={birthFingerprint}
              />
            </React.Suspense>
          </div>
        )}

        {/* Jyotish AI Chat */}
        {activeTab === 'chat' && user && userProfile && (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <React.Suspense fallback={pageSuspenseFallback}>
              <AIChatPage
                user={user}
                userProfile={userProfile}
                childProfiles={childProfiles}
                referenceDate={currentTime}
                locationLabel={city ?? undefined}
                transitPositions={transitPositions}
                birthPositions={birthPositions}
                birthYogas={birthYogas}
                yogas={yogas}
                transits={transits}
                birthPanchang={birthPanchang}
                panchang={panchang}
                birthSpecialPoints={birthSpecialPoints}
                onClose={() => setActiveTab(DEFAULT_NAV_ID)}
              />
            </React.Suspense>
          </div>
        )}

        {/* People / Child Profiles */}
        {activeTab === 'profiles' && user && userProfile && (
          <div className={cn(
            "flex-1 min-h-0 overflow-hidden flex flex-col font-sans selection:bg-jyotish-gold/30 transition-colors duration-500",
            theme === 'dark' ? "bg-[#050505] text-white" : "bg-surface-card text-ink-primary"
          )}>
            <React.Suspense fallback={pageSuspenseFallback}>
              <ProfilesPage
                user={user}
                userProfile={userProfile}
                childProfiles={childProfiles}
                activeChildProfileId={activeChildProfileId}
                onSaveProfile={saveChildProfile}
                onDeleteProfile={deleteChildProfile}
                onLoadProfile={loadChildProfile}
                onClearProfile={clearChildProfile}
                geocode={geocode}
                onClose={() => setActiveTab(DEFAULT_NAV_ID)}
              />
            </React.Suspense>
          </div>
        )}

        {/* Archives View */}
        {activeTab === 'archives' && user && (
          <div className={cn(
            "flex-1 min-h-0",
            theme === 'dark' ? "bg-black/20" : "bg-surface-base"
          )}>
            <Archives uid={user.uid} />
          </div>
        )}

        {/* Profile View */}
        {activeTab === 'profile' && user && (
          <div className="flex-1 min-h-0">
            <UserProfile 
              user={user} 
              profile={userProfile} 
              onSave={saveProfile} 
              onGeocode={geocode}
              onClose={() => setActiveTab(DEFAULT_NAV_ID)}
            />
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .safe-area-bottom {
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
        }
        .safe-area-pb {
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
        }
      `}} />
      {/* Modals */}
      <AnimatePresence>
        <EphemerisModal 
          isOpen={showEphemerisModal}
          onClose={() => setShowEphemerisModal(false)}
          onExport={generateCSV}
          start={ephemerisStart}
          setStart={setEphemerisStart}
          end={ephemerisEnd}
          setEnd={setEphemerisEnd}
          freq={ephemerisFreq}
          setFreq={setEphemerisFreq}
          theme={theme}
        />
      </AnimatePresence>
      {/* AI Assistant */}
      <AIAssistant
        user={user}
        userProfile={userProfile}
        referenceDate={currentTime}
        locationLabel={city ?? undefined}
        positions={positions}
        birthPositions={birthPositions}
        birthYogas={birthYogas}
        yogas={yogas}
        transits={transits}
        birthPanchang={birthPanchang}
        panchang={panchang}
        birthSpecialPoints={birthSpecialPoints}
      />

      <TransitInterpretationModal 
        isOpen={!!selectedTransitForAI}
        onClose={() => setSelectedTransitForAI(null)}
        transit={selectedTransitForAI}
        interpretation={transitInterpretation}
        isLoading={isInterpretingTransit}
        user={user}
      />

      {/* Transit Interpretation Modal - Moved after profile logic or kept here if still useful */}

      <MobileNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setChartType={setChartType}
        onMoreClick={() => setIsMoreSheetOpen(true)}
        isMoreActive={MORE_SHEET_IDS.has(activeTab)}
      />

      {/* Floating status pill — mobile sky/chart only */}
      {CONTROLS_HUD_IDS.has(activeTab) && (
        <div
          onClick={() => setIsControlsOpen(true)}
          className={cn(
            "lg:hidden fixed bottom-[5.5rem] left-1/2 -translate-x-1/2 z-40 border backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer active:scale-95 transition-transform duration-300",
            theme === 'dark'
              ? "bg-[#0b0c10]/90 border-jyotish-gold/25"
              : "bg-surface-card/90 border-border-gold"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
          <span className="text-[10px] uppercase tracking-widest font-mono font-bold leading-none select-none text-jyotish-gold">
            {viewMode === 'natal' ? "Natal" : "Transit"} • {city?.split(',')[0]} • {format(viewMode === 'natal' && birthTime ? birthTime : currentTime, 'HH:mm')}
          </span>
          <Settings className="w-3.5 h-3.5 text-jyotish-gold shrink-0 ml-1 hover:rotate-45 transition-transform duration-300" />
        </div>
      )}

      {/* Celestial Matrix Controls bottom sheet */}
      <AnimatePresence>
        {isControlsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsControlsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-all"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={cn(
                "lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t px-6 pt-4 flex flex-col gap-5 shadow-3xl max-h-[85vh] overflow-y-auto custom-scrollbar transition-all font-sans",
                "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
                theme === 'dark'
                  ? "bg-[#090a0f]/98 border-white/5 text-white shadow-black/80"
                  : "bg-[#fcfdfe]/98 border-slate-200 text-slate-800 shadow-slate-200/50"
              )}
            >
              <div
                className={cn(
                  "w-12 h-1 rounded-full mx-auto mb-2 cursor-pointer",
                  theme === 'dark' ? "bg-white/10" : "bg-slate-300"
                )}
                onClick={() => setIsControlsOpen(false)}
              />

              <div className={cn(
                "flex items-center justify-between pb-3 border-b",
                theme === 'dark' ? "border-white/5" : "border-border-gold"
              )}>
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-jyotish-gold animate-spin-slow" />
                  <p className="text-xs font-bold font-mono tracking-[0.2em] uppercase text-jyotish-gold">Celestial Matrix Controls</p>
                </div>
                <button
                  onClick={() => setIsControlsOpen(false)}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    theme === 'dark' ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-mono text-jyotish-gold/70 font-bold">Chart Focus Mode</label>
                <div className={cn(
                  "flex p-1 rounded-xl border transition-all",
                  theme === 'dark' ? "bg-black/30 border-white/5" : "bg-slate-100 border-slate-200"
                )}>
                  <button
                    onClick={() => handleAutoSelectNatal()}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                      viewMode === 'natal'
                        ? "bg-jyotish-gold text-black shadow-sm"
                        : "text-slate-400 dark:text-white/40"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Natal Chart
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('transit');
                      setIsBirthMode(false);
                      setDashboardTab('overview');
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                      viewMode === 'transit'
                        ? "bg-jyotish-gold text-black shadow-sm"
                        : "text-slate-400 dark:text-white/40"
                    )}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Live Transits
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-mono text-jyotish-gold/70 font-bold">Observer Location</label>
                <div className={cn(
                  "p-4 rounded-xl border flex items-center justify-between gap-3",
                  theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-surface-card border-border-gold shadow-sm"
                )}>
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-jyotish-gold shrink-0" />
                    {isLocating ? (
                      <span className="text-xs font-mono text-jyotish-gold flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Georeferencing...
                      </span>
                    ) : (
                      <span className="text-xs font-bold font-mono text-jyotish-gold truncate">{city || "Unknown Location"}</span>
                    )}
                  </div>
                  <button
                    onClick={locateMe}
                    disabled={isLocating}
                    className="px-3 py-2 bg-jyotish-gold/10 text-jyotish-gold hover:bg-jyotish-gold/20 text-[9px] font-bold font-mono uppercase tracking-widest rounded-lg transition-colors shadow-sm"
                  >
                    Locate Me
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-mono text-jyotish-gold/70 font-bold">Epoch Setup</label>
                <div className={cn(
                  "p-4 rounded-xl border flex flex-col gap-4",
                  theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-surface-card border-border-gold shadow-sm"
                )}>
                  <DateTimePicker
                    label={viewMode === 'natal' ? 'Date & time of birth' : 'Observation moment'}
                    placeholder={viewMode === 'natal' ? 'Select birth moment' : 'Select date & time'}
                    value={viewMode === 'natal' && birthTime ? birthTime : currentTime}
                    onChange={(date) => {
                      if (viewMode === 'natal') {
                        setBirthTime(date);
                      } else {
                        handleDateChange({
                          target: { value: toDateTimeLocalValue(date) },
                        } as React.ChangeEvent<HTMLInputElement>);
                      }
                    }}
                    theme={theme}
                    maxDate={viewMode === 'natal' ? new Date() : undefined}
                    showNowButton={viewMode !== 'natal'}
                  />

                  {viewMode === 'transit' && (
                    <div className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between border-t pt-4 gap-3",
                      theme === 'dark' ? "border-white/5" : "border-border-gold"
                    )}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsLive(!isLive)}
                          className={cn(
                            "p-2 rounded-lg transition-all flex items-center justify-center",
                            isLive
                              ? "bg-jyotish-gold/20 text-jyotish-gold scale-105"
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
                          )}
                        >
                          {isLive ? <Pause className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                        </button>
                        <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-[#FF5A0F]">
                          {isLive ? "REALTIME TRACKING" : "TIMELINE PAUSED"}
                        </span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => adjustTime(-1)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-wider transition-all border active:scale-95",
                            theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white/60 border-white/10" : "bg-surface-card hover:bg-surface-muted text-ink-muted border-border-gold shadow-sm"
                          )}
                        >
                          <Rewind className="w-3.5 h-3.5" /> -1 Day
                        </button>
                        <button
                          onClick={() => adjustTime(1)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-wider transition-all border active:scale-95",
                            theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white/60 border-white/10" : "bg-surface-card hover:bg-surface-muted text-ink-muted border-border-gold shadow-sm"
                          )}
                        >
                          +1 Day <FastForward className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsControlsOpen(false)}
                className="w-full bg-jyotish-gold hover:bg-celestial-gold text-black font-extrabold py-3.5 rounded-xl text-center text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-jyotish-gold/15 mt-2"
              >
                Apply Epoch Matrix
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={userProfile?.role === 'admin'}
        user={user}
        logout={logout}
      />

    </div>
  );
}
