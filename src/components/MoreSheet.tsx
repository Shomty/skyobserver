import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Moon, Sun, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { navItemsFor, type NavId } from '../lib/navigation';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavId;
  setActiveTab: (tab: NavId) => void;
  isAdmin: boolean;
  user: User | null;
  logout: () => void;
}

/**
 * Mobile "More" destination sheet — everything that doesn't fit the 5-item
 * bottom bar (Sudarshana, Full Report, People, Settings, Admin) lives here
 * with full labels, plus the theme toggle and sign out.
 */
export const MoreSheet: React.FC<MoreSheetProps> = ({ isOpen, onClose, activeTab, setActiveTab, isAdmin, user, logout }) => {
  const { theme, toggleTheme } = useTheme();
  const items = navItemsFor('moreSheet', isAdmin);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              "lg:hidden fixed left-0 right-0 bottom-0 z-[70] rounded-t-3xl border-t px-4 pt-3 backdrop-blur-xl",
              "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
              theme === 'dark' ? "bg-mystic-purple/95 border-jyotish-gold/20 shadow-black/50" : "bg-white/95 border-slate-200 shadow-slate-200/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn("w-10 h-1 rounded-full mx-auto", theme === 'dark' ? "bg-white/20" : "bg-slate-300")} />
              <button
                onClick={onClose}
                className={cn("absolute right-4 top-3 p-1.5 rounded-lg", theme === 'dark' ? "text-white/40 hover:text-white/70" : "text-slate-400 hover:text-slate-600")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user && (
              <div className={cn("px-2 py-3 border-b mb-2", theme === 'dark' ? "border-white/5" : "border-border-gold")}>
                <p className={cn("text-body font-semibold truncate", theme === 'dark' ? "text-white/90" : "text-ink-primary")}>{user.displayName}</p>
                <p className={cn("text-caption font-mono truncate mt-0.5", theme === 'dark' ? "text-white/40" : "text-ink-faint")}>{user.email}</p>
              </div>
            )}

            <div className="space-y-1 pb-2">
              {items.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => { setActiveTab(id); onClose(); }}
                    className={cn(
                      "w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                      isActive
                        ? "bg-jyotish-gold/10 text-jyotish-gold"
                        : theme === 'dark' ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-jyotish-gold" : theme === 'dark' ? "text-white/30" : "text-ink-faint")} />
                    <span className="text-body font-medium">{label}</span>
                  </button>
                );
              })}

              <button
                onClick={toggleTheme}
                className={cn(
                  "w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  theme === 'dark' ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-white/30" /> : <Moon className="w-5 h-5 text-slate-400" />}
                <span className="text-body font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {user && (
                <button
                  onClick={() => { logout(); onClose(); }}
                  className={cn(
                    "w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                    theme === 'dark' ? "text-red-400/70 hover:bg-red-500/10 hover:text-red-400" : "text-red-500/70 hover:bg-red-50 hover:text-red-600"
                  )}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-body font-medium">Sign Out</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
