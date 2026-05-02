import React from 'react';
import { Compass, Grid, LayoutGrid, User as UserIcon, BookOpen, MessageSquare, CircleDot } from 'lucide-react';

interface MobileNavigationProps {
  activeTab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana';
  setActiveTab: (tab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana') => void;
  setChartType: (type: 'circle' | 'north-indian') => void;
}

const TABS: Array<{ id: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana'; label: string; icon: React.ReactNode; onClick?: (setChartType: (type: 'circle' | 'north-indian') => void) => void }> = [
  { id: 'sky',        label: 'Sky',     icon: <Compass className="w-5 h-5" />,     onClick: (s) => s('circle') },
  { id: 'chart',      label: 'Chart',   icon: <Grid className="w-5 h-5" />,         onClick: (s) => s('north-indian') },
  { id: 'stats',      label: 'Data',    icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'archives',   label: 'Journal', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'chat',       label: 'AI',      icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'sudarshana', label: 'Chakra',  icon: <CircleDot className="w-5 h-5" /> },
  { id: 'profile',    label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  setChartType
}) => {
  return (
    <nav
      className="lg:hidden"
      style={{
        flexShrink: 0,
        height: 56,
        background: 'rgba(13,10,30,0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--sep)',
        display: 'flex',
        zIndex: 50,
      }}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.onClick) tab.onClick(setChartType);
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'opacity .15s',
            }}
          >
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '25%', right: '25%',
                height: 2,
                background: 'var(--gold)',
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <span style={{ fontSize: 18, color: active ? 'var(--gold)' : 'var(--text3)', transition: 'color .15s', display: 'flex' }}>
              {tab.icon}
            </span>
            <span
              className="font-space-mono"
              style={{
                fontSize: 9,
                fontWeight: active ? 700 : 400,
                letterSpacing: '.06em',
                color: active ? 'var(--gold)' : 'var(--text3)',
                textTransform: 'uppercase',
                transition: 'color .15s',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
