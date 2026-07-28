import React from 'react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { navItemsFor, type NavId } from '../lib/navigation';

interface SectionNavProps {
  activeTab: NavId;
  setActiveTab: (tab: NavId) => void;
}

export const SectionNav: React.FC<SectionNavProps> = ({ activeTab, setActiveTab }) => {
  const { theme } = useTheme();
  const items = navItemsFor('desktopNav', false);

  return (
    <nav className={cn(
      "hidden lg:flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 border-b backdrop-blur-xl relative z-30 transition-colors duration-500 overflow-x-auto no-scrollbar",
      theme === 'dark' ? "border-jyotish-gold/10 bg-mystic-purple/40" : "border-slate-200 bg-white/60"
    )}>
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "min-h-[44px] px-4 md:px-5 py-2 rounded-lg text-label font-semibold transition-all flex items-center gap-2 whitespace-nowrap",
              isActive
                ? "bg-jyotish-gold/10 text-jyotish-gold shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]"
                : theme === 'dark' ? "text-white/50 hover:text-white/70" : "text-ink-muted hover:text-ink-primary"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </nav>
  );
};
