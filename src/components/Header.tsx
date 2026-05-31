import React, { useState, useRef, useEffect } from 'react';
import { Compass, MapPin, Loader2, Moon, Sun, User as UserIcon, LogIn, Sparkles, BookOpen, LayoutGrid, Grid, LogOut, Settings, ChevronDown, MessageSquare, Users, CircleDot, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import type { User } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  isLocating: boolean;
  locateMe: () => void;
  city: string;
  viewMode: 'transit' | 'natal';
  setViewMode: (mode: 'transit' | 'natal') => void;
  isBirthMode: boolean;
  setIsBirthMode: (mode: boolean) => void;
  setDashboardTab: (tab: 'overview' | 'yogas' | 'transits' | 'natal' | 'upcoming' | 'panchang' | 'ashtakavarga' | 'muhurta' | 'dashas' | 'impacts' | 'blueprint' | 'rectify') => void;
  activeTab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana' | 'admin';
  setActiveTab: (tab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana' | 'admin') => void;
  birthTime: Date | null;
  currentTime: Date;
  user: User | null;
  signInWithGoogle: () => void;
  logout: () => void;
  handleAutoSelectNatal: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isLocating,
  locateMe,
  city,
  viewMode,
  setViewMode,
  isBirthMode,
  setIsBirthMode,
  setDashboardTab,
  activeTab,
  setActiveTab,
  birthTime,
  currentTime,
  user,
  signInWithGoogle,
  logout,
  handleAutoSelectNatal,
  isAdmin = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isBirthModeActive = viewMode === 'natal';

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={cn(
      "relative z-40 px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between border-b backdrop-blur-xl sticky top-0 transition-colors duration-500",
      theme === 'dark' ? "border-jyotish-gold/10 bg-mystic-purple/60" : "border-slate-200 bg-white/80"
    )}>
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl border border-jyotish-gold/30 flex items-center justify-center bg-jyotish-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          <Compass className="w-4 h-4 lg:w-6 lg:h-6 text-jyotish-gold animate-pulse" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm lg:text-xl font-bold tracking-tighter uppercase italic font-serif leading-none gold-gradient-text">Vedic Sky</h1>
          <p className={cn("text-[6px] lg:text-[10px] uppercase tracking-[0.2em] font-mono mt-0.5 lg:mt-1", theme === 'dark' ? "text-jyotish-gold/40" : "text-slate-400")}>Sidereal Engine</p>
        </div>
        {/* V2 Preview link */}
        <a
          href="/v2"
          className={cn(
            "hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest font-bold transition-all",
            theme === 'dark'
              ? "border-jyotish-gold/30 text-jyotish-gold/70 hover:text-jyotish-gold hover:border-jyotish-gold/60 hover:bg-jyotish-gold/5"
              : "border-orange-300 text-orange-500 hover:border-orange-400 hover:bg-orange-50"
          )}
          title="Try the new v2 design"
        >
          V2 ✦
        </a>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-6">
        {/* Location & Time - Desktop Only */}
        <div className="hidden lg:flex items-center gap-6 font-mono text-sm">
          <div className="flex flex-col items-end">
            <span className={cn("text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Observer</span>
            <div className="flex items-center gap-2">
              {isLocating ? (
                <span className="text-jyotish-gold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Locating...</span>
              ) : (
                <button onClick={locateMe} className="text-jyotish-gold hover:text-celestial-gold flex items-center gap-1 transition-colors">
                  <MapPin className="w-3 h-3" /> {city || "Locate Me"}
                </button>
              )}
            </div>
          </div>
          <div className={cn("w-px h-8", theme === 'dark' ? "bg-jyotish-gold/10" : "bg-slate-200")} />
          <div className="flex flex-col items-end">
            <span className={cn("text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Epoch</span>
            <span className="text-jyotish-gold">{format(viewMode === 'natal' && birthTime ? birthTime : currentTime, 'HH:mm:ss')}</span>
          </div>
          <div className={cn("w-px h-8", theme === 'dark' ? "bg-jyotish-gold/10" : "bg-slate-200")} />
        </div>

        {/* Unified View Mode Toggle */}
        <div className={cn(
          "flex items-center gap-1 rounded-lg p-1 border transition-colors duration-500",
          theme === 'dark' ? "bg-mystic-purple/40 border-jyotish-gold/10" : "bg-slate-100 border-slate-200"
        )}>
          <button 
            onClick={handleAutoSelectNatal}
            className={cn(
              "px-3 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              viewMode === 'natal' 
                ? "bg-jyotish-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
                : theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Sparkles className={cn("w-3 h-3", viewMode === 'natal' && "animate-pulse")} />
            Natal
          </button>
          <button 
            onClick={() => {
              setViewMode('transit');
              setIsBirthMode(false);
              setDashboardTab('overview');
            }}
            className={cn(
              "px-3 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              viewMode === 'transit' 
                ? "bg-jyotish-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
                : theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Compass className={cn("w-3 h-3", viewMode === 'transit' && "animate-spin-slow")} />
            Transit
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('sky')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              activeTab === 'sky' 
                ? "bg-jyotish-gold/10 text-jyotish-gold" 
                : "text-white/40 hover:text-white/60"
            )}
          >
            <Compass className="w-3.5 h-3.5" />
            Sky
          </button>
          <button 
            onClick={() => setActiveTab('chart')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              activeTab === 'chart' 
                ? "bg-jyotish-gold/10 text-jyotish-gold" 
                : "text-white/40 hover:text-white/60"
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            Chart
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              activeTab === 'stats' 
                ? "bg-jyotish-gold/10 text-jyotish-gold" 
                : "text-white/40 hover:text-white/60"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Data
          </button>
          <button 
            onClick={() => setActiveTab('archives')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              activeTab === 'archives' 
                ? "bg-jyotish-gold/10 text-jyotish-gold shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]" 
                : "text-white/40 hover:text-white/60"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Journal
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              activeTab === 'chat' 
                ? "bg-jyotish-gold/10 text-jyotish-gold shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]" 
                : "text-white/40 hover:text-white/60"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI Chat
          </button>
          <button
            onClick={() => setActiveTab('sudarshana')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
              activeTab === 'sudarshana'
                ? "bg-jyotish-gold/10 text-jyotish-gold shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]"
                : "text-white/40 hover:text-white/60"
            )}
          >
            <CircleDot className="w-3.5 h-3.5" />
            Sudarshana
          </button>
        </div>

        <div className={cn("w-px h-8 hidden sm:block", theme === 'dark' ? "bg-jyotish-gold/10" : "bg-slate-200")} />

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className={cn(
            "p-2 rounded-lg border transition-all duration-300",
            theme === 'dark' 
              ? "bg-mystic-purple/40 border-jyotish-gold/20 text-jyotish-gold hover:bg-mystic-purple/60" 
              : "bg-white border-slate-200 text-orange-600 hover:bg-slate-50 shadow-sm"
          )}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        
        {/* Auth & Profile */}
        <div className="relative" ref={dropdownRef}>
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 p-0.5 pr-2 rounded-full border overflow-hidden transition-all",
                  activeTab === 'profile' || isDropdownOpen
                    ? "border-jyotish-gold ring-2 ring-jyotish-gold/20" 
                    : "hover:border-jyotish-gold/50",
                  theme === 'dark' ? "border-jyotish-gold/20 bg-white/5" : "border-slate-200 bg-white shadow-sm"
                )}
              >
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full overflow-hidden border border-white/10 shadow-inner">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold font-bold text-xs">
                      {user.displayName?.[0] || user.email?.[0] || "?"}
                    </div>
                  )}
                </div>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isDropdownOpen ? "rotate-180" : "", theme === 'dark' ? "text-jyotish-gold/50" : "text-slate-400")} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={cn(
                      "absolute right-0 top-full mt-2 w-56 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl",
                      theme === 'dark' ? "bg-mystic-purple/95 border-jyotish-gold/20 shadow-black/50" : "bg-white/95 border-slate-200 shadow-slate-200/50"
                    )}
                  >
                    <div className={cn("p-4 border-b", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
                      <p className={cn("text-xs font-bold truncate", theme === 'dark' ? "text-white/90" : "text-slate-900")}>{user.displayName}</p>
                      <p className={cn("text-[10px] font-mono truncate mt-0.5", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{user.email}</p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('profiles');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                          activeTab === 'profiles' 
                            ? "bg-jyotish-gold/10 text-jyotish-gold" 
                            : theme === 'dark' ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Users className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'profiles' ? "text-jyotish-gold" : "text-white/20")} />
                        <span className="text-[11px] uppercase tracking-widest font-bold">People Profiles</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                          activeTab === 'chat' 
                            ? "bg-jyotish-gold/10 text-jyotish-gold" 
                            : theme === 'dark' ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <MessageSquare className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'chat' ? "text-jyotish-gold" : "text-white/20")} />
                        <span className="text-[11px] uppercase tracking-widest font-bold">AI Chat</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('report');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                          activeTab === 'report' 
                            ? "bg-jyotish-gold/10 text-jyotish-gold" 
                            : theme === 'dark' ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <BookOpen className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'report' ? "text-jyotish-gold" : "text-white/20")} />
                        <span className="text-[11px] uppercase tracking-widest font-bold">Full Report</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                          activeTab === 'profile' 
                            ? "bg-jyotish-gold/10 text-jyotish-gold" 
                            : theme === 'dark' ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Settings className={cn("w-4 h-4 transition-transform group-hover:rotate-45", activeTab === 'profile' ? "text-jyotish-gold" : "text-white/20")} />
                        <span className="text-[11px] uppercase tracking-widest font-bold">Settings</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                            activeTab === 'admin'
                              ? "bg-jyotish-gold/10 text-jyotish-gold"
                              : theme === 'dark' ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <ShieldAlert className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'admin' ? "text-jyotish-gold" : "text-white/20")} />
                          <span className="text-[11px] uppercase tracking-widest font-bold">Admin Panel</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                          theme === 'dark' ? "text-red-400/60 hover:bg-red-500/10 hover:text-red-400" : "text-red-500/60 hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-[11px] uppercase tracking-widest font-bold">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-jyotish-gold text-black rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-widest hover:bg-celestial-gold transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <LogIn className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
