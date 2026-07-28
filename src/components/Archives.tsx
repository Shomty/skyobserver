import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Trash2, Calendar, Sparkles, ChevronRight, Search, Filter, Loader2, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import {
  deleteAIReport,
  deleteInterpretation,
  getUserInterpretations,
  getUserReports,
} from '../services/aiReportService';
import { useTheme } from '../context/ThemeContext';
import {
  formatJournalDate,
  getJournalTypeLabel,
  interpretationToJournalEntry,
  JournalEntry,
  journalEntryTimestamp,
  reportToJournalEntry,
} from '../lib/journalUtils';

interface ArchivesProps {
  uid: string;
}

const TYPE_BADGE_DARK: Record<string, string> = {
  'transit-impact': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'daily-insights': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'yoga-interpretation': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  'muhurta-analysis': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'natal-planet-insights': 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  cosmic_analysis: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  general: 'bg-jyotish-gold/10 border-jyotish-gold/20 text-jyotish-gold',
  transit: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

const TYPE_BADGE_LIGHT: Record<string, string> = {
  'transit-impact': 'bg-blue-500/8 border-blue-600/20 text-blue-700',
  'daily-insights': 'bg-emerald-500/8 border-emerald-600/20 text-emerald-700',
  'yoga-interpretation': 'bg-purple-500/8 border-purple-600/20 text-purple-700',
  'muhurta-analysis': 'bg-amber-500/8 border-amber-600/20 text-amber-800',
  'natal-planet-insights': 'bg-cyan-500/8 border-cyan-600/20 text-cyan-800',
  cosmic_analysis: 'bg-indigo-500/8 border-indigo-600/20 text-indigo-700',
  general: 'bg-jyotish-gold/10 border-jyotish-gold/30 text-jyotish-gold',
  transit: 'bg-blue-500/8 border-blue-600/20 text-blue-700',
};

function typeBadgeClass(type: string, isDark: boolean): string {
  const map = isDark ? TYPE_BADGE_DARK : TYPE_BADGE_LIGHT;
  return map[type] ?? (isDark
    ? 'bg-jyotish-gold/10 border-jyotish-gold/20 text-jyotish-gold'
    : 'bg-jyotish-gold/10 border-jyotish-gold/30 text-jyotish-gold');
}

export const Archives: React.FC<ArchivesProps> = ({ uid }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    const [reports, interpretations] = await Promise.all([
      getUserReports(uid),
      getUserInterpretations(uid),
    ]);

    const merged = [
      ...reports.map(reportToJournalEntry),
      ...interpretations.map(interpretationToJournalEntry),
    ].sort((a, b) => journalEntryTimestamp(b) - journalEntryTimestamp(a));

    setEntries(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [uid]);

  const handleDelete = async (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    if (entry.source === 'interpretation') {
      await deleteInterpretation(uid, entry.id);
    } else {
      await deleteAIReport(uid, entry.id);
    }

    setEntries((prev) => prev.filter((item) => item.id !== entry.id || item.source !== entry.source));
    if (selectedEntry?.id === entry.id && selectedEntry?.source === entry.source) {
      setSelectedEntry(null);
    }
  };

  const types = useMemo(
    () => ['All', ...new Set(entries.map((entry) => entry.type))],
    [entries],
  );

  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      entry.title.toLowerCase().includes(query) ||
      entry.preview.toLowerCase().includes(query) ||
      entry.markdown.toLowerCase().includes(query) ||
      getJournalTypeLabel(entry.type).toLowerCase().includes(query);

    const matchesType = filterType === 'All' || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  const inputClass = cn(
    'w-full rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-jyotish-gold/30',
    isDark
      ? 'bg-black/40 border-white/10 text-white font-mono placeholder:text-white/30'
      : 'bg-surface-card border-border-gold text-ink-primary placeholder:text-ink-faint shadow-sm'
  );

  return (
    <div className={cn(
      'flex flex-col h-full overflow-hidden',
      isDark ? 'text-white bg-[#050505]' : 'text-ink-primary bg-surface-base',
    )}>
      {/* Header */}
      <div className={cn(
        'p-5 lg:p-6 border-b flex flex-col gap-4 flex-shrink-0',
        isDark ? 'border-white/10 bg-mystic-purple/20' : 'border-border-gold bg-surface-card/90 backdrop-blur-sm',
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jyotish-gold/15 border border-jyotish-gold/25 flex items-center justify-center text-jyotish-gold shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight gold-gradient-text font-serif">Journal</h2>
              <p className={cn('text-caption uppercase tracking-widest font-mono', isDark ? 'text-white/40' : 'text-ink-muted')}>
                Saved insights & notes
              </p>
            </div>
          </div>
          <p className={cn('text-caption font-mono shrink-0', isDark ? 'text-white/40' : 'text-ink-muted')}>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'Entry' : 'Entries'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-white/30' : 'text-ink-faint')} />
            <input
              type="text"
              placeholder="Search titles and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(inputClass, 'pl-10 pr-4 py-2.5')}
            />
          </div>
          <div className="relative sm:w-48">
            <Filter className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none', isDark ? 'text-white/30' : 'text-ink-faint')} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={cn(inputClass, 'pl-10 pr-8 py-2.5 appearance-none cursor-pointer')}
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All types' : getJournalTypeLabel(type)}
                </option>
              ))}
            </select>
            <ChevronRight className={cn('absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none', isDark ? 'text-white/30' : 'text-ink-faint')} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Entry list */}
        <div className={cn(
          'w-full lg:w-[380px] flex flex-col border-r overflow-y-auto no-scrollbar flex-shrink-0',
          isDark ? 'border-white/10 bg-black/20' : 'border-border-gold bg-surface-muted/60',
          selectedEntry ? 'hidden lg:flex' : 'flex',
        )}>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-jyotish-gold/50">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <span className="text-caption uppercase tracking-widest font-mono">Opening journal...</span>
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className={cn('p-2 space-y-1', isDark ? '' : '')}>
              {filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id && selectedEntry?.source === entry.source;
                return (
                  <div
                    key={`${entry.source}-${entry.id}`}
                    onClick={() => setSelectedEntry(entry)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedEntry(entry);
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'w-full text-left p-4 rounded-xl flex flex-col gap-2 transition-all cursor-pointer outline-none',
                      'focus-visible:ring-2 focus-visible:ring-jyotish-gold/40',
                      isSelected
                        ? isDark
                          ? 'bg-jyotish-gold/12 border border-jyotish-gold/25 shadow-sm'
                          : 'bg-surface-card border border-jyotish-gold/35 shadow-sm'
                        : isDark
                          ? 'hover:bg-white/[0.04] border border-transparent'
                          : 'hover:bg-surface-card/80 border border-transparent hover:border-border-gold/60',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className={cn('px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border shrink-0', typeBadgeClass(entry.type, isDark))}>
                        {getJournalTypeLabel(entry.type)}
                      </div>
                      <span className={cn('text-[9px] font-mono shrink-0', isDark ? 'text-white/35' : 'text-ink-faint')}>
                        {formatJournalDate(entry)}
                      </span>
                    </div>

                    <h3 className={cn('text-sm font-semibold line-clamp-2 leading-snug font-serif', isDark ? 'text-white/90' : 'text-ink-primary')}>
                      {entry.title}
                    </h3>

                    <p className={cn('text-[13px] line-clamp-2 leading-relaxed', isDark ? 'text-white/50' : 'text-ink-muted')}>
                      {entry.preview}
                    </p>

                    <div className="flex items-center justify-between mt-0.5">
                      <div className={cn('flex items-center gap-1.5 text-[9px] font-mono', isDark ? 'text-white/30' : 'text-ink-faint')}>
                        <Bookmark className="w-3 h-3" />
                        {entry.source === 'interpretation' ? 'Saved note' : 'AI insight'}
                      </div>
                      <button
                        onClick={(e) => handleDelete(entry, e)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isDark
                            ? 'hover:bg-red-500/20 text-white/20 hover:text-red-400'
                            : 'hover:bg-red-50 text-ink-faint hover:text-red-600',
                        )}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={cn('flex flex-col items-center justify-center p-16 text-center', isDark ? 'text-white/25' : 'text-ink-faint')}>
              <Bookmark className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No journal entries yet.</p>
              <p className={cn('text-xs mt-2 max-w-xs leading-relaxed', isDark ? 'text-white/35' : 'text-ink-muted')}>
                Save insights from AI Chat or generate daily readings to build your journal.
              </p>
            </div>
          )}
        </div>

        {/* Detail pane */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          isDark ? 'bg-black/10' : 'bg-surface-base',
          !selectedEntry ? 'hidden lg:flex' : 'flex',
        )}>
          {selectedEntry ? (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col"
            >
              <div className={cn(
                'p-4 border-b flex items-center gap-3 lg:hidden flex-shrink-0',
                isDark ? 'border-white/10 bg-mystic-purple/20' : 'border-border-gold bg-surface-card',
              )}>
                <button onClick={() => setSelectedEntry(null)} className={cn('p-2 -ml-2 rounded-lg', isDark ? 'hover:bg-white/5' : 'hover:bg-surface-muted')}>
                  <ChevronRight className={cn('w-5 h-5', isDark ? 'text-white/70' : 'text-ink-secondary')} />
                </button>
                <div className={cn('font-bold text-sm', isDark ? 'text-white/90' : 'text-ink-primary')}>Back to list</div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 lg:p-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', typeBadgeClass(selectedEntry.type, isDark))}>
                        {getJournalTypeLabel(selectedEntry.type)}
                      </div>
                      <div className={cn('h-px flex-1', isDark ? 'bg-white/5' : 'bg-border-gold')} />
                    </div>

                    <h1 className="text-2xl lg:text-3xl font-serif leading-tight text-jyotish-gold">
                      {selectedEntry.title}
                    </h1>

                    <div className={cn('flex flex-wrap items-center gap-4 text-caption font-mono', isDark ? 'text-white/40' : 'text-ink-muted')}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatJournalDate(selectedEntry, 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        {selectedEntry.source === 'interpretation' ? 'Saved from chat' : 'AI generated'}
                      </div>
                    </div>
                  </div>

                  <article className={cn(
                    'rounded-2xl border px-5 py-6 lg:px-8 lg:py-8 shadow-sm',
                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-surface-card border-border-gold',
                  )}>
                    <div className={cn(
                      'prose prose-sm lg:prose-base max-w-none leading-relaxed',
                      isDark
                        ? 'prose-invert prose-headings:text-jyotish-gold prose-strong:text-jyotish-gold/90 prose-p:text-white/80 prose-li:text-white/75 prose-blockquote:border-jyotish-gold/30 prose-blockquote:text-white/60'
                        : 'prose-headings:text-jyotish-gold prose-strong:text-jyotish-gold prose-p:text-ink-secondary prose-li:text-ink-secondary prose-blockquote:border-jyotish-gold/40 prose-blockquote:text-ink-muted prose-a:text-cosmic-deep',
                    )}>
                      <ReactMarkdown>{selectedEntry.markdown}</ReactMarkdown>
                    </div>
                  </article>

                  <div className={cn('pt-4 border-t flex items-center justify-end', isDark ? 'border-white/5' : 'border-border-gold')}>
                    <button
                      onClick={(e) => handleDelete(selectedEntry, e)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl border text-caption uppercase font-bold tracking-widest transition-all',
                        isDark
                          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                          : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100',
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Entry
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className={cn(
              'flex-1 flex flex-col items-center justify-center p-16 text-center',
              isDark ? 'text-white/20' : 'text-ink-faint',
            )}>
              <div className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border',
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-border-gold bg-surface-card shadow-sm'
              )}>
                <BookOpen className="w-10 h-10 stroke-1 text-jyotish-gold/40" />
              </div>
              <h2 className={cn('text-xl font-serif italic mb-2', isDark ? 'text-white/80' : 'text-ink-primary')}>
                Select an entry
              </h2>
              <p className={cn('text-sm max-w-xs leading-relaxed', isDark ? 'text-white/45' : 'text-ink-muted')}>
                Your saved readings and notes live here. Choose an entry on the left to read the full insight.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
