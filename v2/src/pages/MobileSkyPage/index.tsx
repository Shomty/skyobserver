/**
 * MobileSkyPage — mobile-first Vedic Sky Observer
 *
 * Design tokens: dark navy + gold + orange accents (matches vedic-sky-mobile.html prototype)
 * Tabs: SKY · CHART · DATA · JOURNAL · AI CHAT · CHAKRA · PROFILE
 */

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import type { User } from 'firebase/auth';
import {
  Compass, Grid, LayoutGrid, BookOpen, MessageSquare,
  CircleDot, User as UserIcon, ZoomIn, ZoomOut, RotateCcw,
  Sun, Moon, Loader2, LogOut, Settings,
} from 'lucide-react';
import { format } from 'date-fns';

import { auth, onAuthStateChanged, signInWithGoogle, logout } from '../../firebase';
import { calculatePositions, PlanetPosition, calculatePanchang, PanchangData } from '../../vedic-utils';
import MobileSkyChart from './MobileSkyChart';
import MobileJournal from './MobileJournal';
import { usePlanetData, ViewMode } from './usePlanetData';

// Lazy-loaded heavy tabs
const NorthIndianChart = lazy(() => import('../../components/NorthIndianChart'));
const AIChatPage = lazy(() => import('../AIChatPage'));
const SudarshanaChakraPage = lazy(() => import('../SudarshanaChakraPage'));

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'sky' | 'chart' | 'data' | 'journal' | 'chat' | 'chakra' | 'profile';
type ChartType = 'circle' | 'north-indian' | 'south-indian';

// ── Design tokens (matching prototype CSS vars) ───────────────────────────────
// Injected as data attribute on the root div; CSS vars scoped to .ms-root

const MS_STYLES = `
.ms-root {
  --ms-bg:       #060511;
  --ms-surface:  #0d0b20;
  --ms-s2:       #161235;
  --ms-s3:       #1e194a;
  --ms-fg:       #e8dcff;
  --ms-muted:    #675890;
  --ms-border:   #201945;
  --ms-gold:     #d4a020;
  --ms-gold-dim: #7a5c12;
  --ms-orange:   #e85d04;
  --ms-teal:     #00b89c;
  --ms-nav-h:    60px;
}

.ms-root * {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

.ms-root button { cursor: pointer; }

/* Bottom sheet */
.ms-sheet {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: var(--ms-surface);
  border-radius: 20px 20px 0 0;
  border-top: 1px solid var(--ms-border);
  transform: translateY(100%);
  transition: transform .3s cubic-bezier(.32,.72,0,1);
  z-index: 25;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
.ms-sheet.open { transform: translateY(0); }

.ms-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0);
  pointer-events: none;
  transition: background .25s;
  z-index: 20;
}
.ms-backdrop.on { background: rgba(0,0,0,.65); pointer-events: all; }

/* Data grid inside sheet */
.ms-data-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1px; background: var(--ms-border);
  margin: 0 20px 4px; border-radius: 12px; overflow: hidden;
}
.ms-dcell { background: var(--ms-s2); padding: 12px 14px; }
.ms-clabel { font-size: 9px; color: var(--ms-muted); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 4px; }
.ms-cval   { font-size: 15px; font-weight: 600; color: var(--ms-fg); font-variant-numeric: tabular-nums; }
.ms-csub   { font-size: 11px; color: var(--ms-muted); margin-top: 2px; }

/* Scrollable tab content */
.ms-tab-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; }

/* Auth screen */
.ms-auth {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex: 1; gap: 24px; padding: 32px;
}

/* Spinner */
.ms-spinner { animation: ms-spin 1s linear infinite; }
@keyframes ms-spin { to { transform: rotate(360deg); } }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function dignityLabel(d?: string): string {
  if (!d) return '—';
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function houseOrdinal(h?: number): string {
  if (!h) return '—';
  const s = ['','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
  return s[h] ?? `${h}th`;
}

const HOUSE_NAMES: Record<number, string> = {
  1:'Tanu Bhava', 2:'Dhana Bhava', 3:'Sahaja Bhava', 4:'Sukha Bhava',
  5:'Putra Bhava', 6:'Ripu Bhava', 7:'Kalatra Bhava', 8:'Mrityu Bhava',
  9:'Dharma Bhava', 10:'Karma Bhava', 11:'Labha Bhava', 12:'Vyaya Bhava',
};

// ── Navigation tabs ───────────────────────────────────────────────────────────

const NAV_TABS: Array<{ id: Tab; label: string; Icon: React.ElementType }> = [
  { id: 'sky',     label: 'SKY',     Icon: Compass },
  { id: 'chart',   label: 'CHART',   Icon: Grid },
  { id: 'data',    label: 'DATA',    Icon: LayoutGrid },
  { id: 'journal', label: 'JOURNAL', Icon: BookOpen },
  { id: 'chat',    label: 'AI CHAT', Icon: MessageSquare },
  { id: 'chakra',  label: 'CHAKRA',  Icon: CircleDot },
  { id: 'profile', label: 'PROFILE', Icon: UserIcon },
];

// ── Auth screen ───────────────────────────────────────────────────────────────

function AuthScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="ms-auth">
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        border: '1.5px solid var(--ms-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ms-gold)',
      }}>
        <Compass size={24} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ms-fg)', letterSpacing: '.1em' }}>VEDIC SKY</p>
        <p style={{ fontSize: 11, color: 'var(--ms-muted)', marginTop: 4, letterSpacing: '.1em' }}>SIDEREAL ENGINE</p>
      </div>
      <button
        onClick={onSignIn}
        style={{
          padding: '12px 28px',
          background: 'var(--ms-orange)',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: 12, fontWeight: 700, letterSpacing: '.09em',
        }}
      >
        SIGN IN WITH GOOGLE
      </button>
    </div>
  );
}

// ── Planet Bottom Sheet ───────────────────────────────────────────────────────

interface PlanetSheetProps {
  planet: PlanetPosition | null;
  open: boolean;
  onClose: () => void;
}

function PlanetSheet({ planet, open, onClose }: PlanetSheetProps) {
  if (!planet) return null;

  return (
    <>
      <div className={`ms-backdrop${open ? ' on' : ''}`} onClick={onClose} />
      <div className={`ms-sheet${open ? ' open' : ''}`}>
        {/* Knob */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--ms-border)', borderRadius: 2 }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 20px 16px' }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: planet.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: 'white', flexShrink: 0,
          }}>
            {planet.symbol}
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ms-fg)', marginBottom: 2 }}>{planet.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--ms-muted)' }}>
              {planet.isRetrograde ? `${planet.name} · Retrograde ℞` : planet.name}
            </p>
          </div>
        </div>
        {/* Data grid */}
        <div className="ms-data-grid">
          <div className="ms-dcell">
            <div className="ms-clabel">POSITION</div>
            <div className="ms-cval">{planet.degree}°{String(planet.minute).padStart(2,'0')}'</div>
            <div className="ms-csub">{planet.rashi}</div>
          </div>
          <div className="ms-dcell">
            <div className="ms-clabel">HOUSE</div>
            <div className="ms-cval">{houseOrdinal(planet.house)}</div>
            <div className="ms-csub">{planet.house ? HOUSE_NAMES[planet.house] ?? '' : '—'}</div>
          </div>
          <div className="ms-dcell">
            <div className="ms-clabel">DIGNITY</div>
            <div className="ms-cval">{dignityLabel(planet.dignity)}</div>
            <div className="ms-csub">{planet.isCombust ? 'Combust' : ''}</div>
          </div>
          <div className="ms-dcell">
            <div className="ms-clabel">NAKSHATRA</div>
            <div className="ms-cval" style={{ fontSize: 13 }}>{planet.nakshatra}</div>
            <div className="ms-csub">Pada {planet.pada}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'var(--ms-surface)', border: '1px solid var(--ms-border)',
        borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {user.photoURL
          ? <img src={user.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid var(--ms-gold)' }} />
          : (
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--ms-gold-dim)', border: '1.5px solid var(--ms-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ms-gold)', fontSize: 16, fontWeight: 700,
            }}>
              {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
            </div>
          )
        }
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ms-fg)' }}>{user.displayName ?? 'User'}</p>
          <p style={{ fontSize: 11, color: 'var(--ms-muted)', marginTop: 2 }}>{user.email}</p>
        </div>
      </div>

      <button
        onClick={onSignOut}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 16px',
          background: 'var(--ms-s2)', border: '1px solid var(--ms-border)',
          borderRadius: 10, color: 'var(--ms-muted)',
          fontSize: 12, fontWeight: 700, letterSpacing: '.07em',
          width: '100%',
        }}
      >
        <LogOut size={14} />
        SIGN OUT
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const MobileSkyPage: React.FC = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [activeTab, setActiveTab] = useState<Tab>('sky');
  const [viewMode, setViewMode] = useState<ViewMode>('transit');
  const [chartType, setChartType] = useState<ChartType>('circle');
  const [zoom, setZoom] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [panchang, setPanchang] = useState<PanchangData | null>(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return unsub;
  }, []);

  // Dummy userProfile from user (birth data would come from Firestore in full integration)
  const userProfile = user ? { name: user.displayName ?? '' } : null;

  const { displayPositions, transitPositions, birthPositions, currentTime } = usePlanetData(viewMode, userProfile);

  // Panchang for DATA tab (requires Sun + Moon — use transitPositions so it always works)
  useEffect(() => {
    if (transitPositions.length < 2) return;
    try {
      const p = calculatePanchang(currentTime, transitPositions);
      setPanchang(p);
    } catch { /* positions not yet loaded */ }
  }, [currentTime, transitPositions]);

  function handlePlanetTap(planet: PlanetPosition) {
    setSelectedPlanet(planet);
    setSheetOpen(true);
    setShowHint(false);
    if (navigator.vibrate) navigator.vibrate(12);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  function doZoom(factor: number) {
    setZoom(z => Math.max(0.45, Math.min(4, z * factor)));
  }

  async function handleSignIn() {
    try { await signInWithGoogle(); } catch { /* noop */ }
  }

  async function handleSignOut() {
    await logout();
  }

  // Loading
  if (user === undefined) {
    return (
      <div className="ms-root" style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        background: 'var(--ms-bg)', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{MS_STYLES}</style>
        <Loader2 size={28} color="var(--ms-gold)" className="ms-spinner" />
      </div>
    );
  }

  const ascendant = displayPositions.find(p => p.name === 'Ascendant');
  const planets = displayPositions.filter(p => p.name !== 'Ascendant');

  return (
    <div
      className="ms-root"
      style={{
        height: '100dvh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--ms-bg)',
        color: 'var(--ms-fg)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      <style>{MS_STYLES}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 14px',
        background: 'var(--ms-surface)',
        borderBottom: '1px solid var(--ms-border)',
        flexShrink: 0, zIndex: 5,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            border: '1.5px solid var(--ms-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ms-gold)',
          }}>
            <Compass size={16} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ms-gold)', letterSpacing: '.13em', lineHeight: 1.2 }}>VEDIC SKY</div>
            <div style={{ fontSize: 7, color: 'var(--ms-muted)', letterSpacing: '.14em' }}>SIDEREAL ENGINE</div>
          </div>
        </div>

        {/* Mode pills */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', gap: 2,
            background: 'var(--ms-s2)', border: '1px solid var(--ms-border)',
            borderRadius: 8, padding: 3,
          }}>
            {(['transit', 'natal'] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 13px', borderRadius: 5,
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em',
                  color: viewMode === m ? 'white' : 'var(--ms-muted)',
                  background: viewMode === m ? 'var(--ms-orange)' : 'transparent',
                  border: 'none', whiteSpace: 'nowrap',
                  transition: 'background .15s, color .15s',
                }}
              >
                {m === 'transit' ? <Sun size={9} /> : <Moon size={9} />}
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--ms-gold-dim)', border: '1.5px solid var(--ms-gold)',
          color: 'var(--ms-gold)', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
          onClick={() => setActiveTab('profile')}
        >
          {user
            ? (user.displayName ?? user.email ?? 'U')[0].toUpperCase()
            : <UserIcon size={14} />
          }
        </div>
      </header>

      {/* ── CONTROLS BAR (only on sky tab) ─────────────────────────────── */}
      {activeTab === 'sky' && (
        <div style={{
          height: 44, display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 12px',
          background: 'var(--ms-surface)',
          borderBottom: '1px solid var(--ms-border)',
          flexShrink: 0,
        }}>
          {/* Chart type tabs */}
          <div style={{ display: 'flex', flex: 1, gap: 3 }}>
            {(['circle', 'north-indian', 'south-indian'] as ChartType[]).map(ct => (
              <button
                key={ct}
                onClick={() => setChartType(ct)}
                style={{
                  flex: 1, padding: '5px 6px', borderRadius: 6,
                  fontSize: 9.5, fontWeight: 600, letterSpacing: '.06em',
                  border: `1px solid ${chartType === ct ? 'var(--ms-gold-dim)' : 'var(--ms-border)'}`,
                  background: chartType === ct ? 'var(--ms-s2)' : 'transparent',
                  color: chartType === ct ? 'var(--ms-gold)' : 'var(--ms-muted)',
                  whiteSpace: 'nowrap',
                  transition: 'all .15s',
                }}
              >
                {ct === 'circle' ? 'CIRCLE' : ct === 'north-indian' ? 'N.INDIAN' : 'S.INDIAN'}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--ms-border)', flexShrink: 0 }} />

          {/* Zoom */}
          <div style={{ display: 'flex', gap: 3 }}>
            {[
              { onClick: () => doZoom(1.15), icon: <ZoomIn size={12} />, label: 'Zoom in' },
              { onClick: () => doZoom(0.87), icon: <ZoomOut size={12} />, label: 'Zoom out' },
              { onClick: () => setZoom(1), icon: <RotateCcw size={12} />, label: 'Reset' },
            ].map(({ onClick, icon, label }) => (
              <button key={label} onClick={onClick} aria-label={label} style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'var(--ms-s2)', border: '1px solid var(--ms-border)',
                color: 'var(--ms-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>

        {/* SKY */}
        {activeTab === 'sky' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <MobileSkyChart
                positions={displayPositions}
                ascendantPosition={ascendant}
                onPlanetTap={handlePlanetTap}
                zoom={zoom}
              />
              {showHint && (
                <div style={{
                  position: 'absolute', top: 10, left: 14, right: 14, height: 38,
                  background: 'rgba(13,11,32,.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--ms-border)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0 12px',
                  fontSize: 10, color: 'var(--ms-muted)', letterSpacing: '.06em',
                  pointerEvents: 'none',
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--ms-s2)', border: '1px solid var(--ms-border)', flexShrink: 0 }} />
                  TAP A PLANET TO INSPECT
                </div>
              )}
            </div>
            {/* Legend */}
            <div style={{
              height: 30, display: 'flex', alignItems: 'center', gap: 16,
              padding: '0 14px',
              background: 'var(--ms-surface)', borderTop: '1px solid var(--ms-border)',
              flexShrink: 0,
            }}>
              <LegendItem color="#4499ee" label="EARTH (TOPOCENTRIC)" />
              <LegendItem ring label="ECLIPTIC (SIDEREAL)" />
            </div>
          </div>
        )}

        {/* CHART */}
        {activeTab === 'chart' && (
          <div className="ms-tab-scroll">
            <Suspense fallback={<TabLoader />}>
              {chartType === 'circle' ? (
                <div style={{ width: '100%', height: '100%' }}>
                  <MobileSkyChart
                    positions={displayPositions}
                    ascendantPosition={ascendant}
                    onPlanetTap={handlePlanetTap}
                    zoom={1}
                  />
                </div>
              ) : (
                <div style={{ padding: 14 }}>
                  <NorthIndianChart
                    positions={displayPositions}
                    viewMode={viewMode}
                  />
                </div>
              )}
            </Suspense>
          </div>
        )}

        {/* DATA */}
        {activeTab === 'data' && (
          <div className="ms-tab-scroll">
            <Suspense fallback={<TabLoader />}>
              <PanchangPanel panchang={panchang} positions={displayPositions} />
            </Suspense>
          </div>
        )}

        {/* JOURNAL */}
        {activeTab === 'journal' && (
          user
            ? <MobileJournal user={user} />
            : <AuthScreen onSignIn={handleSignIn} />
        )}

        {/* AI CHAT */}
        {activeTab === 'chat' && (
          user
            ? (
              <Suspense fallback={<TabLoader />}>
                <AIChatPage
                  user={user}
                  userProfile={userProfile as any}
                  transitPositions={transitPositions}
                  birthPositions={birthPositions}
                  birthYogas={[]}
                  yogas={[]}
                  transits={[]}
                  birthPanchang={null}
                  panchang={panchang as any}
                  birthSpecialPoints={null}
                  onClose={() => setActiveTab('sky')}
                />
              </Suspense>
            )
            : <AuthScreen onSignIn={handleSignIn} />
        )}

        {/* CHAKRA */}
        {activeTab === 'chakra' && (
          user
            ? (
              <Suspense fallback={<TabLoader />}>
                <SudarshanaChakraPage
                  user={user}
                  userProfile={userProfile as any}
                  birthPositions={birthPositions ?? []}
                  birthFingerprint={null}
                  onClose={() => setActiveTab('sky')}
                />
              </Suspense>
            )
            : <AuthScreen onSignIn={handleSignIn} />
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          user
            ? <ProfileTab user={user} onSignOut={handleSignOut} />
            : <AuthScreen onSignIn={handleSignIn} />
        )}
      </div>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <nav style={{
        height: 'calc(var(--ms-nav-h) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--ms-surface)',
        borderTop: '1px solid var(--ms-border)',
        display: 'flex', alignItems: 'stretch',
        flexShrink: 0, position: 'relative', zIndex: 5,
      }}>
        {NAV_TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none', padding: '5px 2px',
                color: active ? 'var(--ms-gold)' : 'var(--ms-muted)',
                minWidth: 0, transition: 'color .15s',
                position: 'relative',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '25%', right: '25%',
                  height: 2, background: 'var(--ms-gold)',
                  borderRadius: '0 0 2px 2px',
                }} />
              )}
              <Icon size={22} strokeWidth={active ? 2 : 1.65} />
              <span style={{
                fontSize: 7.5, fontWeight: active ? 700 : 400,
                letterSpacing: '.06em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Planet bottom sheet */}
      <PlanetSheet planet={selectedPlanet} open={sheetOpen} onClose={closeSheet} />
    </div>
  );
};

// ── Micro-components ──────────────────────────────────────────────────────────

function LegendItem({ color, ring, label }: { color?: string; ring?: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: 'var(--ms-muted)', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
      {ring
        ? <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--ms-muted)', flexShrink: 0 }} />
        : <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}88`, flexShrink: 0 }} />
      }
      {label}
    </div>
  );
}

function TabLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <Loader2 size={24} color="var(--ms-gold)" className="ms-spinner" />
    </div>
  );
}

/** Compact panchang + planet dignity table for DATA tab */
function PanchangPanel({ panchang, positions }: { panchang: PanchangData | null; positions: PlanetPosition[] }) {
  const planets = positions.filter(p => !['Ascendant', 'Ketu'].includes(p.name));

  return (
    <div style={{ padding: '14px 14px 24px' }}>
      {/* Panchang */}
      {panchang && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--ms-muted)', marginBottom: 10 }}>PANCHANG</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--ms-border)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { label: 'TITHI',     value: `${panchang.tithi.name} (${panchang.tithi.phase})` },
              { label: 'NAKSHATRA', value: panchang.nakshatra.name },
              { label: 'YOGA',      value: panchang.yoga.name },
              { label: 'KARANA',    value: panchang.karana.name },
              { label: 'VARA',      value: panchang.vara },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--ms-s2)', padding: '11px 14px' }}>
                <div style={{ fontSize: 9, color: 'var(--ms-muted)', letterSpacing: '.1em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ms-fg)' }}>{value ?? '—'}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Planet table */}
      <section>
        <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--ms-muted)', marginBottom: 10 }}>PLANETS</h2>
        <div style={{ background: 'var(--ms-surface)', border: '1px solid var(--ms-border)', borderRadius: 12, overflow: 'hidden' }}>
          {planets.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              borderBottom: i < planets.length - 1 ? '1px solid var(--ms-border)' : 'none',
            }}>
              <span style={{ fontSize: 18, color: p.color, width: 22, textAlign: 'center', flexShrink: 0 }}>{p.symbol}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ms-fg)' }}>{p.name}</span>
                  {p.isRetrograde && <span style={{ fontSize: 9, color: '#e85d04', fontWeight: 700 }}>℞</span>}
                  {p.isCombust && <span style={{ fontSize: 9, color: 'var(--ms-muted)' }}>COMBUST</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ms-muted)', marginTop: 1 }}>
                  {p.rashi} · {p.nakshatra} Pd{p.pada}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--ms-fg)', fontVariantNumeric: 'tabular-nums' }}>
                  {p.degree}°{String(p.minute).padStart(2,'0')}'
                </div>
                <div style={{ fontSize: 10, color: 'var(--ms-muted)', marginTop: 1 }}>
                  {dignityLabel(p.dignity)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MobileSkyPage;
