import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeClasses } from '../../lib/themeClasses';

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
  const tc = useThemeClasses();
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
        tc.isDark ? 'border-white/10 bg-black/40' : 'border-border-gold bg-surface-card/80',
        className
      )}
    >
      <div className="md:hidden relative px-3 py-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'w-full min-h-[44px] px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors',
            tc.surface,
            tc.textPrimary
          )}
        >
          {ActiveIcon && <ActiveIcon className="w-4 h-4 shrink-0 text-jyotish-gold" />}
          <span className="flex-1 text-left text-label font-medium truncate">{active?.label ?? 'Section'}</span>
          {active?.badge}
          <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-180', tc.textFaint)} />
        </button>
        {open && (
          <div
            role="listbox"
            className={cn(
              'absolute left-3 right-3 mt-1 max-h-[60vh] overflow-y-auto custom-scrollbar rounded-xl border shadow-2xl z-50 py-1',
              tc.isDark ? 'bg-mystic-purple/95 border-white/10 backdrop-blur-xl' : 'bg-surface-card border-border-gold'
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
                    isActive ? tc.btnActive : tc.tabInactive
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

      <div className="hidden md:flex flex-wrap px-2 py-2 gap-x-3 gap-y-2 items-center">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-wrap items-center gap-1">
            {gi > 0 && (
              <div className={cn('w-px h-6 mx-1', tc.isDark ? 'bg-white/10' : 'bg-border-gold')} />
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
                      isActive ? tc.btnActive : tc.tabInactive
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
