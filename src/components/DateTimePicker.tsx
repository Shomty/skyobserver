import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, Clock, X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  clampHours,
  clampMinutes,
  fromDateTimeLocalValue,
  mergeDatePart,
  mergeTimePart,
  toDateTimeLocalValue,
} from '../lib/dateInputUtils';

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  theme: 'light' | 'dark';
  className?: string;
  label?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  showNowButton?: boolean;
  disabled?: boolean;
  error?: boolean;
}

type PickStep = 'year' | 'month' | 'day';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DEFAULT_BIRTH_DRAFT = new Date(1990, 5, 15, 12, 0);

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function firstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function isDayDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
  const day = startOfDay(date).getTime();
  if (minDate && day < startOfDay(minDate).getTime()) return true;
  if (maxDate && day > startOfDay(maxDate).getTime()) return true;
  return false;
}

function initialDraft(value: Date | null, maxDate?: Date): Date {
  if (value) return new Date(value);
  if (maxDate) {
    const draft = new Date(DEFAULT_BIRTH_DRAFT);
    return draft.getTime() > maxDate.getTime() ? new Date(maxDate) : draft;
  }
  return new Date();
}

function initialStep(value: Date | null, birthMode: boolean): PickStep {
  if (birthMode && !value) return 'year';
  return 'day';
}

function monthIsDisabled(year: number, monthIndex: number, minDate?: Date, maxDate?: Date): boolean {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  if (maxDate && first.getTime() > startOfDay(maxDate).getTime()) return true;
  if (minDate && last.getTime() < startOfDay(minDate).getTime()) return true;
  return false;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  theme,
  className,
  label = 'Date & time',
  placeholder = 'Select date & time',
  maxDate,
  minDate,
  showNowButton = true,
  disabled = false,
  error = false,
}) => {
  const isDark = theme === 'dark';
  const birthMode = !showNowButton;
  const [isOpen, setIsOpen] = useState(false);
  const [pickStep, setPickStep] = useState<PickStep>(() => initialStep(value, birthMode));
  const [viewDate, setViewDate] = useState(() => initialDraft(value, maxDate));
  const [draft, setDraft] = useState(() => initialDraft(value, maxDate));
  const containerRef = useRef<HTMLDivElement>(null);

  const maxYear = maxDate?.getFullYear() ?? new Date().getFullYear();
  const minYear = minDate?.getFullYear() ?? maxYear - 120;

  const years = useMemo(() => {
    const list: number[] = [];
    for (let year = maxYear; year >= minYear; year -= 1) {
      list.push(year);
    }
    return list;
  }, [maxYear, minYear]);

  useEffect(() => {
    if (!isOpen) {
      const next = initialDraft(value, maxDate);
      setDraft(next);
      setViewDate(next);
      setPickStep(initialStep(value, birthMode));
    }
  }, [value, isOpen, maxDate, birthMode]);

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

  const exceedsMax = maxDate ? draft.getTime() > maxDate.getTime() : false;
  const belowMin = minDate ? draft.getTime() < minDate.getTime() : false;
  const canApply = !exceedsMax && !belowMin;

  const applyDraft = () => {
    if (!canApply) return;
    onChange(new Date(draft));
    setIsOpen(false);
  };

  const handleTypedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!raw) {
      onChange(null);
      return;
    }
    const parsed = fromDateTimeLocalValue(raw);
    if (!parsed) return;
    if (maxDate && parsed.getTime() > maxDate.getTime()) return;
    if (minDate && parsed.getTime() < minDate.getTime()) return;
    onChange(parsed);
    setDraft(parsed);
    setViewDate(parsed);
    setPickStep('day');
  };

  const openPicker = () => {
    if (disabled) return;
    const base = value ?? initialDraft(null, maxDate);
    setDraft(base);
    setViewDate(base);
    setPickStep(initialStep(value, birthMode));
    setIsOpen(true);
  };

  const inputClassName = cn(
    'flex-1 min-w-0 bg-transparent border-none text-sm font-mono focus:ring-0 outline-none p-0',
    isDark ? 'text-white [color-scheme:dark]' : 'text-slate-900 [color-scheme:light]',
  );

  const fieldShellClassName = cn(
    'w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all',
    'backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    isOpen && 'ring-2 ring-jyotish-gold/30',
    disabled && 'opacity-50',
    error && 'border-red-500/40 ring-1 ring-red-500/20',
    isDark
      ? 'bg-white/[0.06] border-white/10'
      : 'bg-white/70 border-slate-200/80 shadow-sm',
  );

  const syncViewYear = (year: number) => {
    const nextView = new Date(viewDate);
    nextView.setFullYear(year);
    const dim = daysInMonth(nextView);
    if (nextView.getDate() > dim) nextView.setDate(dim);
    setViewDate(nextView);

    const nextDraft = new Date(draft);
    nextDraft.setFullYear(year);
    if (nextDraft.getDate() > dim) nextDraft.setDate(dim);
    setDraft(nextDraft);
  };

  const syncViewMonth = (monthIndex: number) => {
    const nextView = new Date(viewDate.getFullYear(), monthIndex, 1);
    const dim = daysInMonth(nextView);
    const day = Math.min(draft.getDate(), dim);
    nextView.setDate(day);
    setViewDate(nextView);
    setDraft(mergeDatePart(draft, nextView.getFullYear(), monthIndex, day));
  };

  const selectDay = (day: number) => {
    const candidate = mergeDatePart(
      draft,
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    );
    if (isDayDisabled(candidate, minDate, maxDate)) return;
    setDraft(candidate);
  };

  const adjustTime = (field: 'hours' | 'minutes', delta: number) => {
    setDraft((current) => {
      const next = field === 'hours'
        ? mergeTimePart(current, clampHours(current.getHours() + delta), current.getMinutes())
        : mergeTimePart(current, current.getHours(), clampMinutes(current.getMinutes() + delta));

      if (maxDate && next.getTime() > maxDate.getTime()) return current;
      if (minDate && next.getTime() < minDate.getTime()) return current;
      return next;
    });
  };

  const stepTitle = pickStep === 'year'
    ? 'Select year'
    : pickStep === 'month'
      ? `Select month · ${viewDate.getFullYear()}`
      : format(viewDate, 'MMMM yyyy');

  const goBack = () => {
    if (pickStep === 'day') setPickStep('month');
    else if (pickStep === 'month') setPickStep('year');
  };

  const selectStyles = cn(
    'flex-1 min-w-0 rounded-xl border px-2.5 py-2 text-xs font-mono font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-jyotish-gold/30 outline-none',
    isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
  );

  const renderYearStep = () => (
    <div className="max-h-44 overflow-y-auto custom-scrollbar pr-1 mb-4">
      <div className="grid grid-cols-4 gap-1.5">
        {years.map((year) => {
          const selected = viewDate.getFullYear() === year;
          return (
            <button
              key={year}
              type="button"
              onClick={() => {
                syncViewYear(year);
                setPickStep('month');
              }}
              className={cn(
                'py-2 rounded-xl text-[11px] font-mono font-bold transition-all',
                selected
                  ? 'bg-jyotish-gold text-black shadow-md shadow-jyotish-gold/20'
                  : isDark
                    ? 'text-white/70 hover:bg-white/10'
                    : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderMonthStep = () => (
    <div className="grid grid-cols-3 gap-1.5 mb-4">
      {MONTHS.map((month, index) => {
        const disabledMonth = monthIsDisabled(viewDate.getFullYear(), index, minDate, maxDate);
        const selected = viewDate.getMonth() === index;
        return (
          <button
            key={month}
            type="button"
            disabled={disabledMonth}
            onClick={() => {
              syncViewMonth(index);
              setPickStep('day');
            }}
            className={cn(
              'py-2 px-1 rounded-xl text-[10px] font-mono font-bold transition-all',
              disabledMonth && 'opacity-25 cursor-not-allowed',
              selected
                ? 'bg-jyotish-gold text-black shadow-md shadow-jyotish-gold/20'
                : isDark
                  ? 'text-white/70 hover:bg-white/10'
                  : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {format(new Date(2024, index, 1), 'MMM')}
          </button>
        );
      })}
    </div>
  );

  const renderDayStep = () => {
    const cells: React.ReactNode[] = [];
    const totalDays = daysInMonth(viewDate);
    const startDay = firstDayOfMonth(viewDate);

    for (let i = 0; i < startDay; i += 1) {
      cells.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
      const isSelected = date.getTime() === startOfDay(draft).getTime();
      const isToday = date.getTime() === startOfDay(new Date()).getTime();
      const dayDisabled = isDayDisabled(date, minDate, maxDate);

      cells.push(
        <button
          key={day}
          type="button"
          disabled={dayDisabled}
          onClick={() => selectDay(day)}
          className={cn(
            'h-9 w-9 rounded-xl text-[11px] font-mono transition-all flex items-center justify-center',
            dayDisabled && 'opacity-25 cursor-not-allowed',
            isSelected
              ? 'bg-jyotish-gold text-black font-bold shadow-lg shadow-jyotish-gold/25'
              : isDark
                ? 'text-white/70 hover:bg-white/10'
                : 'text-slate-600 hover:bg-white/80',
            isToday && !isSelected && !dayDisabled && 'ring-1 ring-jyotish-gold/40',
          )}
        >
          {day}
        </button>,
      );
    }

    return (
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
        {cells}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn('relative min-w-0', className)}>
      <div className="space-y-1.5">
        <div className={cn('text-[10px] uppercase tracking-widest font-mono ml-0.5', isDark ? 'text-white/35' : 'text-slate-400')}>
          {label}
        </div>
        <div className={fieldShellClassName}>
          <input
            type="datetime-local"
            disabled={disabled}
            value={value ? toDateTimeLocalValue(value) : ''}
            onChange={handleTypedChange}
            max={maxDate ? toDateTimeLocalValue(maxDate) : undefined}
            min={minDate ? toDateTimeLocalValue(minDate) : undefined}
            placeholder={placeholder}
            className={inputClassName}
            aria-label={label}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={openPicker}
            title="Open calendar picker"
            className={cn(
              'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all border',
              isOpen
                ? 'bg-jyotish-gold/20 border-jyotish-gold/40 text-jyotish-gold'
                : isDark
                  ? 'bg-jyotish-gold/10 border-jyotish-gold/25 text-jyotish-gold hover:bg-jyotish-gold/20'
                  : 'bg-amber-50 border-amber-200/70 text-amber-700 hover:bg-amber-100',
            )}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 right-0 mt-2 p-4 rounded-3xl border z-[120]',
          'backdrop-blur-2xl shadow-2xl',
          isDark
            ? 'bg-[#0c0d12]/90 border-white/10 shadow-black/40'
            : 'bg-white/90 border-slate-200/80 shadow-slate-300/30',
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('text-[10px] font-bold uppercase tracking-widest font-mono', isDark ? 'text-jyotish-gold/70' : 'text-amber-700/80')}>
              {label}
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

          {/* Quick jump — year & month dropdowns */}
          <div className="flex gap-2 mb-3">
            <select
              aria-label="Year"
              value={viewDate.getFullYear()}
              onChange={(e) => {
                syncViewYear(Number(e.target.value));
                if (pickStep === 'year') setPickStep('month');
              }}
              className={selectStyles}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              aria-label="Month"
              value={viewDate.getMonth()}
              onChange={(e) => {
                syncViewMonth(Number(e.target.value));
                if (pickStep !== 'day') setPickStep('day');
              }}
              className={selectStyles}
            >
              {MONTHS.map((month, index) => (
                <option
                  key={month}
                  value={index}
                  disabled={monthIsDisabled(viewDate.getFullYear(), index, minDate, maxDate)}
                >
                  {format(new Date(2024, index, 1), 'MMM')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {pickStep !== 'year' && (
              <button
                type="button"
                onClick={goBack}
                className={cn(
                  'p-1.5 rounded-lg transition-colors shrink-0',
                  isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-slate-100 text-slate-500',
                )}
                aria-label="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className={cn('text-[10px] font-mono uppercase tracking-widest', isDark ? 'text-white/35' : 'text-slate-400')}>
                {pickStep === 'year' ? 'Step 1 of 3' : pickStep === 'month' ? 'Step 2 of 3' : 'Step 3 of 3'}
              </p>
              <p className={cn('text-xs font-bold truncate', isDark ? 'text-white/85' : 'text-slate-800')}>
                {stepTitle}
              </p>
            </div>
            {pickStep !== 'year' && (
              <button
                type="button"
                onClick={() => setPickStep(pickStep === 'day' ? 'month' : 'year')}
                className={cn(
                  'text-[9px] font-bold uppercase tracking-wider font-mono px-2 py-1 rounded-lg shrink-0',
                  isDark ? 'text-jyotish-gold/70 hover:bg-white/5' : 'text-amber-700 hover:bg-amber-50',
                )}
              >
                Change
              </button>
            )}
          </div>

          {pickStep === 'year' && renderYearStep()}
          {pickStep === 'month' && renderMonthStep()}
          {pickStep === 'day' && renderDayStep()}

          <div className={cn(
            'rounded-2xl border p-3 mb-4',
            isDark ? 'bg-white/[0.03] border-white/8' : 'bg-slate-50/80 border-slate-200/80',
          )}>
            <div className={cn('flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest font-mono', isDark ? 'text-white/35' : 'text-slate-400')}>
              <Clock className="w-3.5 h-3.5 text-jyotish-gold" />
              Local time
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => adjustTime('hours', 1)} className={cn('px-3 py-1 rounded-lg text-xs', isDark ? 'hover:bg-white/10' : 'hover:bg-white')}>▲</button>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={draft.getHours()}
                  onChange={(e) => {
                    const hours = clampHours(Number(e.target.value) || 0);
                    setDraft((current) => {
                      const next = mergeTimePart(current, hours, current.getMinutes());
                      if (maxDate && next.getTime() > maxDate.getTime()) return current;
                      if (minDate && next.getTime() < minDate.getTime()) return current;
                      return next;
                    });
                  }}
                  className={cn(
                    'w-14 text-center text-lg font-mono font-bold rounded-xl border py-2',
                    isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
                  )}
                />
                <button type="button" onClick={() => adjustTime('hours', -1)} className={cn('px-3 py-1 rounded-lg text-xs', isDark ? 'hover:bg-white/10' : 'hover:bg-white')}>▼</button>
              </div>

              <span className={cn('text-2xl font-mono font-bold pb-1', isDark ? 'text-jyotish-gold' : 'text-amber-700')}>:</span>

              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => adjustTime('minutes', 1)} className={cn('px-3 py-1 rounded-lg text-xs', isDark ? 'hover:bg-white/10' : 'hover:bg-white')}>▲</button>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={draft.getMinutes()}
                  onChange={(e) => {
                    const minutes = clampMinutes(Number(e.target.value) || 0);
                    setDraft((current) => {
                      const next = mergeTimePart(current, current.getHours(), minutes);
                      if (maxDate && next.getTime() > maxDate.getTime()) return current;
                      if (minDate && next.getTime() < minDate.getTime()) return current;
                      return next;
                    });
                  }}
                  className={cn(
                    'w-14 text-center text-lg font-mono font-bold rounded-xl border py-2',
                    isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900',
                  )}
                />
                <button type="button" onClick={() => adjustTime('minutes', -1)} className={cn('px-3 py-1 rounded-lg text-xs', isDark ? 'hover:bg-white/10' : 'hover:bg-white')}>▼</button>
              </div>
            </div>
          </div>

          {!canApply && (
            <p className="text-[10px] font-mono text-red-400 mb-3 text-center">
              {exceedsMax ? 'Birth time cannot be in the future.' : 'Selected time is out of range.'}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {showNowButton ? (
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setDraft(now);
                  setViewDate(now);
                  setPickStep('day');
                }}
                className={cn(
                  'px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest font-mono transition-colors',
                  isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
                )}
              >
                Now
              </button>
            ) : (
              <span className={cn('text-[9px] font-mono px-1', isDark ? 'text-white/30' : 'text-slate-400')}>
                Local birth time
              </span>
            )}
            <button
              type="button"
              onClick={applyDraft}
              disabled={!canApply}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest font-mono transition-colors',
                canApply
                  ? 'bg-jyotish-gold text-black hover:bg-jyotish-gold/90'
                  : 'bg-white/10 text-white/30 cursor-not-allowed',
              )}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
