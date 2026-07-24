import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export interface TabGroupItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  hidden?: boolean;
  group?: string;
  /** Rendered next to the label when the tab belongs to a mode the user isn't currently in. */
  badge?: ReactNode;
}

interface TabGroupProps {
  items: TabGroupItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Dashboard section switcher.
 * - Desktop / tablet (md+): grouped pills that WRAP onto as many rows as needed
 *   (never a horizontal scroller), so every destination is always visible.
 * - Mobile (< md): a compact dropdown — the trigger shows the active tab, tapping
 *   reveals the full list. No horizontal scroll anywhere.
 */
export function TabGroup({ items, activeId, onChange, className }: TabGroupProps) {
  const { theme } = useTheme();
  const visible = items.filter((t) => !t.hidden);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const active = visible.find((t) => t.id === activeId) ?? visible[0];
  const ActiveIcon = active?.icon;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Cluster consecutive items that share a `group` so desktop can show a small
  // heading + divider between clusters ("Now", "Birth Chart", "Timing"…).
  const groups: { name: string | null; tabs: TabGroupItem[] }[] = [];
  for (const tab of visible) {
    const name = tab.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === name) {
      last.tabs.push(tab);
    } else {
      groups.push({ name, tabs: [tab] });
    }
  }

  return (
    <div
      className={cn(
        'border-b z-20 backdrop-blur-md',
        theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-white/80',
        className
      )}
    >
      {/* Mobile: dropdown (App chrome only — DataDashboard hides this breakpoint) */}
      <div className="md:hidden relative px-3 py-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'w-full min-h-[44px] px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors',
            theme === 'dark' ? 'bg-white/[0.03] border-white/10 text-white/90' : 'bg-white border-slate-200 text-slate-900'
          )}
        >
          {ActiveIcon && <ActiveIcon className="w-4 h-4 shrink-0 text-jyotish-gold" />}
          <span className="flex-1 text-left text-label font-medium truncate">{active?.label ?? 'Section'}</span>
          {active?.badge}
          <ChevronDown
            className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-180', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}
          />
        </button>
        {open && (
          <div
            role="listbox"
            className={cn(
              'absolute left-3 right-3 mt-1 max-h-[60vh] overflow-y-auto custom-scrollbar rounded-xl border shadow-2xl z-50 py-1',
              theme === 'dark' ? 'bg-mystic-purple/95 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200'
            )}
          >
            {visible.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(tab.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full min-h-[44px] px-4 py-2.5 flex items-center gap-2.5 text-left transition-colors',
                    isActive
                      ? theme === 'dark'
                        ? 'bg-jyotish-gold/15 text-jyotish-gold'
                        : 'bg-orange-50 text-orange-600'
                      : theme === 'dark'
                        ? 'text-white/70 hover:bg-white/5'
                        : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span className="flex-1 text-label font-medium truncate">{tab.label}</span>
                  {tab.badge}
                  {isActive && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop / tablet: grouped pills that wrap onto multiple rows */}
      <div className="hidden md:flex flex-wrap px-2 py-2 gap-x-3 gap-y-2 items-center">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-wrap items-center gap-1">
            {gi > 0 && (
              <div className={cn('w-px h-6 mx-1', theme === 'dark' ? 'bg-white/10' : 'bg-slate-200')} />
            )}
            <div className="flex flex-wrap gap-1">
              {group.tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={cn(
                      'min-h-[40px] px-4 py-2 flex items-center gap-2 transition-all rounded-full whitespace-nowrap',
                      isActive
                        ? theme === 'dark'
                          ? 'bg-jyotish-gold/20 text-jyotish-gold'
                          : 'bg-orange-100 text-orange-600 font-medium'
                        : theme === 'dark'
                          ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    )}
                  >
                    {Icon && <Icon className={cn('w-4 h-4', isActive ? 'scale-110' : 'scale-100')} />}
                    <span className="text-label font-medium">{tab.label}</span>
                    {tab.badge}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
