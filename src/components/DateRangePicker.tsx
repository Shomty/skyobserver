import React, { useState } from 'react';
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

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ range, onChange, theme, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(range.from));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const daysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    
    if (range.from && range.to && startOfDay(range.from).getTime() !== startOfDay(range.to).getTime()) {
      onChange({ from: clickedDate, to: clickedDate });
    } else if (clickedDate < range.from) {
      onChange({ from: clickedDate, to: range.to });
    } else {
      onChange({ from: range.from, to: endOfDay(clickedDate) });
    }
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(viewDate);
    const startDay = firstDayOfMonth(viewDate);

    // Empty cells for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
      const isStart = date.getTime() === startOfDay(range.from).getTime();
      const isEnd = date.getTime() === startOfDay(range.to).getTime();
      const isInRange = isWithinInterval(date, { start: startOfDay(range.from), end: startOfDay(range.to) });
      const isToday = date.getTime() === startOfDay(new Date()).getTime();

      days.push(
        <button
          key={d}
          onClick={() => handleDateClick(d)}
          onMouseEnter={() => setHoverDate(date)}
          onMouseLeave={() => setHoverDate(null)}
          className={cn(
            "h-8 w-8 rounded-full text-[10px] font-mono transition-all flex items-center justify-center relative",
            isInRange && !isStart && !isEnd && (theme === 'dark' ? "bg-jyotish-gold/10 text-jyotish-gold" : "bg-orange-50 text-orange-600"),
            isStart || isEnd ? "bg-jyotish-gold text-black font-bold z-10" : (theme === 'dark' ? "text-white/60 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"),
            isToday && !isStart && !isEnd && "border border-jyotish-gold/50"
          )}
        >
          {d}
          {isStart && startOfDay(range.from).getTime() !== startOfDay(range.to).getTime() && (
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-jyotish-gold/10 -z-10" />
          )}
          {isEnd && startOfDay(range.from).getTime() !== startOfDay(range.to).getTime() && (
            <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-jyotish-gold/10 -z-10" />
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-mono uppercase tracking-wider transition-all",
          theme === 'dark' ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
        )}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-jyotish-gold" />
        <span>
          {format(range.from, 'MMM d')} - {format(range.to, 'MMM d, yyyy')}
        </span>
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 mt-2 p-4 rounded-2xl border shadow-2xl z-50 w-64 backdrop-blur-xl",
          theme === 'dark' ? "bg-black/90 border-white/10" : "bg-white/95 border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest font-mono">
              {format(viewDate, 'MMMM yyyy')}
            </div>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="h-8 w-8 flex items-center justify-center text-[8px] font-mono text-white/30 uppercase">
                {d}
              </div>
            ))}
            {renderCalendar()}
          </div>

          <div className="flex justify-end pt-2 border-t border-white/5">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold uppercase tracking-widest text-jyotish-gold hover:text-jyotish-gold/80"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
