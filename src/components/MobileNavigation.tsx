import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { navItemsFor, type NavId } from '../lib/navigation';

interface MobileNavigationProps {
  activeTab: NavId;
  setActiveTab: (tab: NavId) => void;
  onMoreClick: () => void;
  isMoreActive: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  onMoreClick,
  isMoreActive,
}) => {
  const { theme } = useTheme();
  const items = navItemsFor('mobileBar', false);

  const inactiveClass = theme === 'dark' ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600';

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl border-t px-1 py-1 flex items-stretch justify-around transition-all duration-500 h-[calc(60px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]",
      theme === 'dark'
        ? "bg-black/85 border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]"
        : "bg-white/90 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    )}>
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1",
              isActive ? "text-jyotish-gold scale-105" : inactiveClass
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "fill-jyotish-gold/15")} />
            <span className="text-caption font-medium">{label}</span>
          </button>
        );
      })}
      <button
        onClick={onMoreClick}
        className={cn(
          "flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1",
          isMoreActive ? "text-jyotish-gold scale-105" : inactiveClass
        )}
      >
        <MoreHorizontal className="w-6 h-6" />
        <span className="text-caption font-medium">More</span>
      </button>
    </nav>
  );
};
