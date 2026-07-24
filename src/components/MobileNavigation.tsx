import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { navItemsFor, type NavId } from '../lib/navigation';

interface MobileNavigationProps {
  activeTab: NavId;
  setActiveTab: (tab: NavId) => void;
  setChartType: (type: 'circle' | 'north-indian') => void;
  onMoreClick: () => void;
  isMoreActive: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  setChartType,
  onMoreClick,
  isMoreActive,
}) => {
  const { theme } = useTheme();
  const items = navItemsFor('mobileBar', false);

  const handleNav = (id: NavId) => {
    setActiveTab(id);
    if (id === 'sky') setChartType('circle');
    if (id === 'chart') setChartType('north-indian');
  };

  return (
    <nav className={cn(
      "lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around px-1 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-colors duration-300",
      theme === 'dark'
        ? "bg-[#090a0e]/95 border-white/10 text-white"
        : "bg-[#fcfdfe]/95 border-slate-200/90 text-slate-800"
    )}>
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => handleNav(id)}
            className="flex-1 min-h-[52px] flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer active:scale-90 select-none"
          >
            <div className="relative flex items-center justify-center">
              {isActive && (
                <motion.div
                  layoutId="m3-active-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={cn(
                    "absolute inset-0 px-5 py-1.5 rounded-full",
                    theme === 'dark'
                      ? "bg-jyotish-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.25)] border border-jyotish-gold/30"
                      : "bg-jyotish-gold/20 border border-jyotish-gold/40 shadow-sm"
                  )}
                />
              )}
              <div className="relative z-10 px-4 py-1 flex items-center justify-center">
                <Icon className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive
                    ? "scale-110 text-jyotish-gold"
                    : (theme === 'dark' ? "text-white/40 group-hover:text-white/70" : "text-slate-400 group-hover:text-slate-700")
                )} />
              </div>
            </div>
            <span className={cn(
              "text-[9px] font-sans font-bold tracking-tight transition-colors duration-300 leading-none",
              isActive
                ? "text-jyotish-gold"
                : (theme === 'dark' ? "text-white/40" : "text-slate-400")
            )}>
              {label}
            </span>
          </button>
        );
      })}
      <button
        onClick={onMoreClick}
        className="flex-1 min-h-[52px] flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer active:scale-90 select-none"
      >
        <div className="relative flex items-center justify-center">
          {isMoreActive && (
            <motion.div
              layoutId="m3-active-pill"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "absolute inset-0 px-5 py-1.5 rounded-full",
                theme === 'dark'
                  ? "bg-jyotish-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.25)] border border-jyotish-gold/30"
                  : "bg-jyotish-gold/20 border border-jyotish-gold/40 shadow-sm"
              )}
            />
          )}
          <div className="relative z-10 px-4 py-1 flex items-center justify-center">
            <MoreHorizontal className={cn(
              "w-5 h-5 transition-transform duration-300",
              isMoreActive
                ? "scale-110 text-jyotish-gold"
                : (theme === 'dark' ? "text-white/40 group-hover:text-white/70" : "text-slate-400 group-hover:text-slate-700")
            )} />
          </div>
        </div>
        <span className={cn(
          "text-[9px] font-sans font-bold tracking-tight transition-colors duration-300 leading-none",
          isMoreActive
            ? "text-jyotish-gold"
            : (theme === 'dark' ? "text-white/40" : "text-slate-400")
        )}>
          More
        </span>
      </button>
    </nav>
  );
};
