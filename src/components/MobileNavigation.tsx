import React from 'react';
import { Compass, Grid, LayoutGrid, User as UserIcon, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface MobileNavigationProps {
  activeTab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana' | 'admin';
  setActiveTab: (tab: 'sky' | 'chart' | 'stats' | 'archives' | 'profile' | 'report' | 'chat' | 'profiles' | 'sudarshana' | 'admin') => void;
  setChartType: (type: 'circle' | 'north-indian') => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  setChartType
}) => {
  const { theme } = useTheme();
  return (
    <nav className={cn(
      "lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl border-t px-2 py-1.5 flex items-stretch justify-around transition-all duration-500 h-[calc(56px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]",
      theme === 'dark' 
        ? "bg-black/85 border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]" 
        : "bg-white/90 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    )}>
      <button 
        onClick={() => { setActiveTab('sky'); setChartType('circle'); }}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1",
          activeTab === 'sky' 
            ? "text-jyotish-gold scale-105" 
            : theme === 'dark' ? "text-white/35 hover:text-white/50" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <Compass className={cn("w-5 h-5", activeTab === 'sky' && "fill-jyotish-gold/15")} />
        <span className="text-[9px] uppercase tracking-[0.1em] font-extrabold font-mono">Sky</span>
      </button>
      <button
        onClick={() => { setActiveTab('chart'); setChartType('north-indian'); }}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1",
          activeTab === 'chart'
            ? "text-jyotish-gold scale-105"
            : theme === 'dark' ? "text-white/35 hover:text-white/50" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <Grid className={cn("w-5 h-5", activeTab === 'chart' && "fill-jyotish-gold/15")} />
        <span className="text-[9px] uppercase tracking-[0.1em] font-extrabold font-mono">Chart</span>
      </button>
      <button
        onClick={() => setActiveTab('stats')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1",
          activeTab === 'stats'
            ? "text-jyotish-gold scale-105"
            : theme === 'dark' ? "text-white/35 hover:text-white/50" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <LayoutGrid className={cn("w-5 h-5", activeTab === 'stats' && "fill-jyotish-gold/15")} />
        <span className="text-[9px] uppercase tracking-[0.1em] font-extrabold font-mono">Data</span>
      </button>
      {/* Journal (archives) and Chakra (sudarshana) removed from mobile nav — accessible via desktop header */}
      <button
        onClick={() => setActiveTab('chat')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1",
          activeTab === 'chat'
            ? "text-jyotish-gold scale-105"
            : theme === 'dark' ? "text-white/35 hover:text-white/50" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <MessageSquare className={cn("w-5 h-5", activeTab === 'chat' && "fill-jyotish-gold/15")} />
        <span className="text-[9px] uppercase tracking-[0.1em] font-extrabold font-mono">AI Chat</span>
      </button>
      <button
        onClick={() => setActiveTab('profile')}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1",
          activeTab === 'profile'
            ? "text-jyotish-gold scale-105"
            : theme === 'dark' ? "text-white/35 hover:text-white/50" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <UserIcon className={cn("w-5 h-5", activeTab === 'profile' && "fill-jyotish-gold/15")} />
        <span className="text-[9px] uppercase tracking-[0.1em] font-extrabold font-mono">Profile</span>
      </button>
    </nav>
  );
};
