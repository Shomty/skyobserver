import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Moon, Sun, LogIn, Sparkles, BookOpen, LayoutGrid, Grid, LogOut, Settings, ChevronDown, MessageSquare, Users, CircleDot, Compass } from 'lucide-react';
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
  activeTab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana';
  setActiveTab: (tab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana') => void;
  birthTime: Date | null;
  currentTime: Date;
  user: User | null;
  signInWithGoogle: () => void;
  logout: () => void;
  handleAutoSelectNatal: () => void;
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
  handleAutoSelectNatal
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chartLabel = viewMode === 'natal' && user?.displayName
    ? user.displayName
    : 'Live Sky';
  const chartMeta = viewMode === 'natal' && birthTime
    ? format(birthTime, 'MMM d yyyy · HH:mm')
    : format(currentTime, 'MMM d yyyy · HH:mm:ss');

  const desktopNavItems: Array<{ id: typeof activeTab; label: string; icon: React.ReactNode }> = [
    { id: 'sky', label: 'Sky', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'chart', label: 'Chart', icon: <Grid className="w-3.5 h-3.5" /> },
    { id: 'stats', label: 'Data', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'archives', label: 'Journal', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'sudarshana', label: 'Sudarshana', icon: <CircleDot className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="sticky top-0 z-40">
      {/* Main header bar */}
      <header style={{
        flexShrink: 0,
        background: 'var(--bg1)',
        borderBottom: '1px solid var(--sep)',
        padding: '10px 14px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Left: logo + chart identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(232,184,75,0.1)',
            border: '1.5px solid rgba(232,184,75,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: 'var(--gold)', fontSize: 15, lineHeight: 1 }}>ॐ</span>
          </div>
          <div>
            <div style={{ color: 'var(--text0)', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
              {chartLabel}
            </div>
            <div className="font-space-mono" style={{ color: 'var(--text2)', fontSize: 10 }}>
              {chartMeta}{city ? ` · ${city}` : ''}
            </div>
            {viewMode === 'natal' && (
              <div style={{ color: 'var(--gold)', fontSize: 9, fontWeight: 700, letterSpacing: '.07em', marginTop: 2, textTransform: 'uppercase' }}>
                Natal Mode
              </div>
            )}
          </div>
          {/* Back to Classic link */}
          <a
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 99,
              border: '1px solid var(--sep2)',
              color: 'var(--text3)',
              fontSize: 9, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em',
              textDecoration: 'none',
              transition: 'color .15s, border-color .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text1)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--sep)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--sep2)'; }}
            title="Back to classic design"
          >
            ← Classic
          </a>
        </div>

        {/* Right: nav + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View mode toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            background: 'var(--bg3)', borderRadius: 10, padding: 3,
          }}>
            <button
              onClick={handleAutoSelectNatal}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: viewMode === 'natal' ? 'rgba(232,184,75,0.12)' : 'transparent',
                color: viewMode === 'natal' ? 'var(--gold)' : 'var(--text3)',
                fontSize: 10, fontWeight: 600, letterSpacing: '.05em', transition: 'all .15s',
              }}
            >
              <Sparkles className="w-3 h-3" />
              Natal
            </button>
            <button
              onClick={() => { setViewMode('transit'); setIsBirthMode(false); setDashboardTab('overview'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: viewMode === 'transit' ? 'rgba(232,184,75,0.12)' : 'transparent',
                color: viewMode === 'transit' ? 'var(--gold)' : 'var(--text3)',
                fontSize: 10, fontWeight: 600, letterSpacing: '.05em', transition: 'all .15s',
              }}
            >
              <Compass className="w-3 h-3" />
              Transit
            </button>
          </div>

          {/* Desktop inline nav */}
          <div className="hidden lg:flex" style={{ gap: 2, background: 'var(--bg3)', borderRadius: 10, padding: 3 }}>
            {desktopNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: activeTab === item.id ? 'rgba(232,184,75,0.12)' : 'transparent',
                  color: activeTab === item.id ? 'var(--gold)' : 'var(--text3)',
                  fontSize: 11, fontWeight: 600, letterSpacing: '.04em', transition: 'all .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* LIVE badge */}
          <div style={{
            background: 'rgba(0,205,176,0.1)', border: '1px solid rgba(0,205,176,0.25)',
            borderRadius: 20, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)',
            }} />
            <span className="font-space-mono" style={{ color: 'var(--teal)', fontSize: 10, fontWeight: 600 }}>LIVE</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg3)', border: '1px solid var(--sep)',
              color: 'var(--text2)', transition: 'all .15s',
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Location button */}
          <button
            onClick={locateMe}
            className="hidden sm:flex items-center gap-1.5"
            style={{
              padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg3)', border: '1px solid var(--sep)',
              color: 'var(--text2)', fontSize: 11, fontWeight: 500, transition: 'all .15s',
            }}
          >
            {isLocating ? (
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--gold)' }} />
            ) : (
              <MapPin className="w-3 h-3" style={{ color: 'var(--teal)' }} />
            )}
            <span className="hidden lg:inline font-space-mono" style={{ color: 'var(--text1)', fontSize: 10 }}>
              {isLocating ? 'Locating…' : (city || 'Locate')}
            </span>
          </button>

          {/* Auth & Profile */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '2px 8px 2px 2px', borderRadius: 20, cursor: 'pointer',
                    border: activeTab === 'profile' || isDropdownOpen
                      ? '1.5px solid var(--gold)' : '1.5px solid var(--sep)',
                    background: 'var(--bg3)', transition: 'all .15s',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                    border: '1px solid var(--sep2)', flexShrink: 0,
                  }}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'rgba(232,184,75,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gold)', fontWeight: 700, fontSize: 12,
                      }}>
                        {user.displayName?.[0] || user.email?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={cn('w-3 h-3 transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')} style={{ color: 'var(--text3)' }} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                        width: 224, borderRadius: 14,
                        border: '1px solid var(--sep2)',
                        background: 'var(--bg2)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        overflow: 'hidden', zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--sep)' }}>
                        <p style={{ color: 'var(--text0)', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</p>
                        <p className="font-space-mono" style={{ color: 'var(--text3)', fontSize: 10, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                      </div>
                      <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[
                          { id: 'profiles' as typeof activeTab, icon: <Users className="w-4 h-4" />, label: 'People Profiles' },
                          { id: 'chat' as typeof activeTab, icon: <MessageSquare className="w-4 h-4" />, label: 'AI Chat' },
                          { id: 'report' as typeof activeTab, icon: <BookOpen className="w-4 h-4" />, label: 'Full Report' },
                          { id: 'profile' as typeof activeTab, icon: <Settings className="w-4 h-4" />, label: 'Settings' },
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setIsDropdownOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                              background: activeTab === item.id ? 'rgba(232,184,75,0.08)' : 'transparent',
                              color: activeTab === item.id ? 'var(--gold)' : 'var(--text1)',
                              fontSize: 11, fontWeight: 600, letterSpacing: '.06em',
                              textTransform: 'uppercase', transition: 'all .15s',
                              textAlign: 'left',
                            }}
                          >
                            <span style={{ color: activeTab === item.id ? 'var(--gold)' : 'var(--text3)', flexShrink: 0 }}>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                        <div style={{ height: 1, background: 'var(--sep)', margin: '4px 0' }} />
                        <button
                          onClick={() => { logout(); setIsDropdownOpen(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'transparent',
                            color: 'rgba(248,113,113,0.7)',
                            fontSize: 11, fontWeight: 600, letterSpacing: '.06em',
                            textTransform: 'uppercase', transition: 'all .15s',
                            textAlign: 'left',
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--gold)', border: 'none',
                  color: '#080616', fontSize: 11, fontWeight: 700,
                  letterSpacing: '.06em', textTransform: 'uppercase',
                  boxShadow: '0 0 20px rgba(232,184,75,0.25)',
                  transition: 'all .15s',
                }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Meta strip */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(13,10,30,0.85)',
        borderBottom: '1px solid var(--sep)',
        padding: '5px 14px',
        display: 'flex',
        gap: 20,
        overflowX: 'auto',
        backdropFilter: 'blur(8px)',
      }} className="no-scrollbar">
        {[
          { l: 'Ayanamsa', v: 'Lahiri · Sidereal' },
          { l: 'Observer', v: city || '—' },
          { l: 'Epoch', v: format(viewMode === 'natal' && birthTime ? birthTime : currentTime, 'HH:mm:ss') },
          { l: 'Mode', v: viewMode === 'natal' ? 'Natal Chart' : 'Live Transit' },
        ].map(({ l, v }) => (
          <div key={l} style={{ flexShrink: 0, display: 'flex', gap: 6, alignItems: 'baseline' }}>
            <span style={{ color: 'var(--text3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.07em' }}>{l}</span>
            <span className="font-space-mono" style={{ color: 'var(--teal)', fontSize: 10 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
