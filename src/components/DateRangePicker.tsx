import React, { useEffect, useRef, useState } from 'react';
import { format, addDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  theme: 'light' | 'dark';
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const PRESETS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '14d', label: '14 days', days: 14 },
  { id: '30d', label: '30 days', days: 30 },
] as const;

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function firstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  range,
  onChange,
  theme,
  className,
}) => {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(range.from));
  const [draftFrom, setDraftFrom] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setDraftFrom(null);
      setViewDate(new Date(range.from));
    }
  }, [isOpen, range.from]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleDateClick = (day: number) => {
    const clickedDate = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));

    if (!draftFrom) {
      setDraftFrom(clickedDate);
      onChange({ from: clickedDate, to: endOfDay(clickedDate) });
      return;
    }

    if (clickedDate.getTime() < draftFrom.getTime()) {
      onChange({ from: clickedDate, to: endOfDay(draftFrom) });
    } else {
      onChange({ from: draftFrom, to: endOfDay(clickedDate) });
    }
    setDraftFrom(null);
  };

  const applyPreset = (days: number) => {
    const from = startOfDay(new Date());
    const to = endOfDay(addDays(from, days - 1));
    onChange({ from, to });
    setDraftFrom(null);
    setViewDate(from);
  };

  const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
  const isRangeComplete = !draftFrom && !isSameDay(range.from, range.to);

  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];
    const totalDays = daysInMonth(viewDate);
    const startDay = firstDayOfMonth(viewDate);

    for (let i = 0; i < startDay; i += 1) {
      cells.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
      const isStart = isSameDay(date, range.from);
      const isEnd = isSameDay(date, range.to);
      const isInRange = isWithinInterval(date, {
        start: startOfDay(range.from),
        end: startOfDay(range.to),
      });
      const isToday = isSameDay(date, new Date());

      cells.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={cn(
            'h-9 w-9 rounded-xl text-[11px] font-mono transition-all flex items-center justify-center relative',
            isStart || isEnd
              ? 'bg-jyotish-gold text-black font-bold z-10 shadow-lg shadow-jyotish-gold/20'
              : isInRange
                ? isDark
                  ? 'bg-jyotish-gold/15 text-jyotish-gold'
                  : 'bg-amber-50 text-amber-700'
                : isDark
                  ? 'text-white/70 hover:bg-white/10'
                  : 'text-slate-600 hover:bg-white/80',
            isToday && !isStart && !isEnd && 'ring-1 ring-jyotish-gold/40',
          )}
        >
          {day}
        </button>,
      );
    }

    return cells;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all text-left',
          'backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
          isOpen && 'ring-2 ring-jyotish-gold/30',
          isDark
            ? 'bg-white/[0.06] border-white/10 hover:bg-white/[0.09] hover:border-white/15'
            : 'bg-white/70 border-slate-200/80 hover:bg-white/90 hover:border-slate-300 shadow-sm',
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
          isDark ? 'bg-jyotish-gold/15 border border-jyotish-gold/25' : 'bg-amber-50 border border-amber-200/70',
        )}>
          <CalendarIcon className="w-4 h-4 text-jyotish-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('text-[10px] uppercase tracking-widest font-mono', isDark ? 'text-white/35' : 'text-slate-400')}>
            Custom range
          </div>
          <div className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>
            {format(range.from, 'MMM d')} – {format(range.to, 'MMM d, yyyy')}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-2 p-4 rounded-3xl border shadow-2xl z-50 w-[min(100vw-2rem,18rem)]',
          'backdrop-blur-2xl',
          isDark
            ? 'bg-[#0c0d12]/85 border-white/10 shadow-black/40'
            : 'bg-white/85 border-slate-200/80 shadow-slate-300/30',
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('text-[10px] font-bold uppercase tracking-widest font-mono', isDark ? 'text-jyotish-gold/70' : 'text-amber-700/80')}>
              Select range
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-slate-100 text-slate-400',
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className={cn('text-[10px] font-mono mb-3', isDark ? 'text-white/40' : 'text-slate-500')}>
            {draftFrom
              ? 'Tap the end date to complete the range'
              : isRangeComplete
                ? 'Tap any date to start a new range'
                : 'Tap start date, then end date'}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.days)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono border transition-all',
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-jyotish-gold/10 hover:border-jyotish-gold/30 hover:text-jyotish-gold'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className={cn('p-2 rounded-xl transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className={cn('text-xs font-bold uppercase tracking-widest font-mono', isDark ? 'text-white/80' : 'text-slate-700')}>
              {format(viewDate, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className={cn('p-2 rounded-xl transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className={cn(
                  'h-9 w-9 flex items-center justify-center text-[9px] font-mono uppercase',
                  isDark ? 'text-white/30' : 'text-slate-400',
                )}
              >
                {day}
              </div>
            ))}
            {renderCalendar()}
          </div>

          <div className={cn(
            'rounded-xl border px-3 py-2 mb-3 text-[10px] font-mono',
            isDark ? 'bg-white/[0.03] border-white/8 text-white/50' : 'bg-slate-50/80 border-slate-200/80 text-slate-500',
          )}>
            <span className={isDark ? 'text-jyotish-gold' : 'text-amber-700'}>{format(range.from, 'MMM d, yyyy')}</span>
            {' → '}
            <span className={isDark ? 'text-jyotish-gold' : 'text-amber-700'}>{format(range.to, 'MMM d, yyyy')}</span>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl bg-jyotish-gold text-black text-[10px] font-bold uppercase tracking-widest font-mono hover:bg-jyotish-gold/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
