import React from 'react';
import { Compass, Grid, LayoutGrid, User as UserIcon, Settings, BookOpen, MessageSquare, CircleDot } from 'lucide-react';
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
      "lg:hidden fixed bottom-4 left-4 right-4 z-50 backdrop-blur-2xl border px-6 py-3 flex items-center justify-between rounded-3xl transition-all duration-500",
      theme === 'dark' 
        ? "bg-black/60 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
        : "bg-white/80 border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
    )}>
      <button 
        onClick={() => { setActiveTab('sky'); setChartType('circle'); }}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all active:scale-90",
          activeTab === 'sky' 
            ? "text-jyotish-gold scale-110" 
            : theme === 'dark' ? "text-white/30" : "text-slate-400"
        )}
      >
        <Compass className={cn("w-5 h-5", activeTab === 'sky' && "fill-jyotish-gold/20")} />
        <span className="text-[7px] uppercase tracking-[0.2em] font-bold font-mono">Sky</span>
      </button>
      <button 
        onClick={() => { setActiveTab('chart'); setChartType('north-indian'); }}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all active:scale-90",
          activeTab === 'chart' 
            ? "text-jyotish-gold scale-110" 
            : theme === 'dark' ? "text-white/30" : "text-slate-400"
        )}
      >
        <Grid className={cn("w-5 h-5", activeTab === 'chart' && "fill-jyotish-gold/20")} />
        <span className="text-[7px] uppercase tracking-[0.2em] font-bold font-mono">Chart</span>
      </button>
      <button 
        onClick={() => setActiveTab('stats')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all active:scale-90",
          activeTab === 'stats' 
            ? "text-jyotish-gold scale-110" 
            : theme === 'dark' ? "text-white/30" : "text-slate-400"
        )}
      >
        <LayoutGrid className={cn("w-5 h-5", activeTab === 'stats' && "fill-jyotish-gold/20")} />
        <span className="text-[7px] uppercase tracking-[0.2em] font-bold font-mono">Data</span>
      </button>
      <button 
        onClick={() => setActiveTab('archives')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all active:scale-90",
          activeTab === 'archives' 
            ? "text-jyotish-gold scale-110" 
            : theme === 'dark' ? "text-white/30" : "text-slate-400"
        )}
      >
        <BookOpen className={cn("w-5 h-5", activeTab === 'archives' && "fill-jyotish-gold/20")} />
        <span className="text-[7px] uppercase tracking-[0.2em] font-bold font-mono">Journal</span>
      </button>
      <button 
        onClick={() => setActiveTab('chat')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all active:scale-90",
          activeTab === 'chat' 
            ? "text-jyotish-gold scale-110" 
            : theme === 'dark' ? "text-white/30" : "text-slate-400"
        )}
      >
        <MessageSquare className={cn("w-5 h-5", activeTab === 'chat' && "fill-jyotish-gold/20")} />
        <span className="text-[7px] uppercase tracking-[0.2em] font-bold font-mono">AI Chat</span>
      </button>
      <button
        onClick={() => setActiveTab('sudarshana')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all active:scale-90",
          activeTab === 'sudarshana'
            ? "text-jyotish-gold scale-110"
            : theme === 'dark' ? "text-white/30" : "text-slate-400"
        )}
      >
        <CircleDot className={cn("w-5 h-5", activeTab === 'sudarshana' && "fill-jyotish-gold/20")} />
        <span className="text-[7px] uppercase tracking-[0.2em] font-bold font-mono">Chakra</span>
      </button>
      <button 
        onClick={() => setActiveTab('profile')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all active:scale-90",
          activeTab === 'profile' 
            ? "text-jyotish-gold scale-110" 
            : theme === 'dark' ? "text-white/30" : "text-slate-400"
        )}
      >
        <UserIcon className={cn("w-5 h-5", activeTab === 'profile' && "fill-jyotish-gold/20")} />
        <span className="text-[7px] uppercase tracking-[0.2em] font-bold font-mono">Profile</span>
      </button>
    </nav>
  );
};
