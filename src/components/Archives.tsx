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

const TYPE_BADGE_STYLES: Record<string, string> = {
  'transit-impact': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'daily-insights': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'yoga-interpretation': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  'muhurta-analysis': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'natal-planet-insights': 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  cosmic_analysis: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  general: 'bg-jyotish-gold/10 border-jyotish-gold/20 text-jyotish-gold',
  transit: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

function typeBadgeClass(type: string): string {
  return TYPE_BADGE_STYLES[type] ?? 'bg-jyotish-gold/10 border-jyotish-gold/20 text-jyotish-gold';
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

  return (
    <div className={cn(
      'flex flex-col h-full overflow-hidden',
      isDark ? 'text-white' : 'text-slate-900',
    )}>
      <div className={cn(
        'p-6 border-b flex flex-col gap-4',
        isDark ? 'border-white/10 bg-mystic-purple/20' : 'border-slate-200 bg-white',
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight gold-gradient-text font-serif">Journal</h2>
              <p className={cn(
                'text-[10px] uppercase tracking-widest font-mono',
                isDark ? 'text-white/40' : 'text-slate-400',
              )}>
                Saved insights & notes
              </p>
            </div>
          </div>
          <p className={cn('text-[10px] font-mono', isDark ? 'opacity-40' : 'text-slate-400')}>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'Entry' : 'Entries'}
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input
              type="text"
              placeholder="Search titles and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-jyotish-gold/50 outline-none transition-all',
                isDark ? 'bg-black/40 border-white/10 text-white font-mono' : 'bg-slate-50 border-slate-200 text-slate-800',
              )}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={cn(
                'pl-10 pr-8 py-2.5 rounded-xl border text-sm appearance-none focus:ring-2 focus:ring-jyotish-gold/50 outline-none transition-all',
                isDark ? 'bg-black/40 border-white/10 text-white font-mono' : 'bg-slate-50 border-slate-200 text-slate-800',
              )}
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All types' : getJournalTypeLabel(type)}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className={cn(
          'w-full lg:w-[400px] flex flex-col border-r overflow-y-auto no-scrollbar',
          isDark ? 'border-white/10' : 'border-slate-200',
          selectedEntry ? 'hidden lg:flex' : 'flex',
        )}>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-jyotish-gold/40">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <span className="text-[10px] uppercase mt-2 tracking-widest font-mono">Opening journal...</span>
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
              {filteredEntries.map((entry) => (
                <div
                  key={`${entry.source}-${entry.id}`}
                  onClick={() => setSelectedEntry(entry)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedEntry(entry);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'w-full text-left p-5 flex flex-col gap-2 transition-all hover:bg-jyotish-gold/5 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-jyotish-gold/50',
                    selectedEntry?.id === entry.id && selectedEntry?.source === entry.source
                      ? 'bg-jyotish-gold/10'
                      : '',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={cn(
                      'px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border shrink-0',
                      typeBadgeClass(entry.type),
                    )}>
                      {getJournalTypeLabel(entry.type)}
                    </div>
                    <span className={cn('text-[9px] font-mono shrink-0', isDark ? 'opacity-40' : 'text-slate-400')}>
                      {formatJournalDate(entry)}
                    </span>
                  </div>

                  <h3 className={cn(
                    'text-sm font-semibold line-clamp-2 leading-snug',
                    isDark ? 'text-white/90' : 'text-slate-900',
                  )}>
                    {entry.title}
                  </h3>

                  <p className={cn(
                    'text-[13px] line-clamp-2 leading-relaxed',
                    isDark ? 'text-white/50' : 'text-slate-500',
                  )}>
                    {entry.preview}
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <div className={cn(
                      'flex items-center gap-1.5 text-[9px] font-mono',
                      isDark ? 'opacity-30' : 'text-slate-400',
                    )}>
                      <Bookmark className="w-3 h-3" />
                      {entry.source === 'interpretation' ? 'Saved note' : 'AI insight'}
                    </div>
                    <button
                      onClick={(e) => handleDelete(entry, e)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isDark
                          ? 'hover:bg-red-500/20 text-white/20 hover:text-red-500'
                          : 'hover:bg-red-50 text-slate-300 hover:text-red-500',
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(
              'flex flex-col items-center justify-center p-20 text-center',
              isDark ? 'text-white/20' : 'text-slate-300',
            )}>
              <Bookmark className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-sm">No journal entries yet.</p>
              <p className={cn('text-xs mt-2 max-w-xs', isDark ? 'text-white/30' : 'text-slate-400')}>
                Save insights from AI Chat or generate daily readings to build your journal.
              </p>
            </div>
          )}
        </div>

        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          isDark ? 'bg-black/20' : 'bg-slate-50',
          !selectedEntry ? 'hidden lg:flex' : 'flex',
        )}>
          {selectedEntry ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col"
            >
              <div className={cn(
                'p-4 border-b flex items-center gap-3 lg:hidden',
                isDark ? 'border-white/10' : 'border-slate-200 bg-white',
              )}>
                <button onClick={() => setSelectedEntry(null)} className="p-2 -ml-2">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="font-bold text-sm">Back to list</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                        typeBadgeClass(selectedEntry.type),
                      )}>
                        {getJournalTypeLabel(selectedEntry.type)}
                      </div>
                      <div className={cn('h-px flex-1', isDark ? 'bg-white/5' : 'bg-slate-200')} />
                    </div>

                    <h1 className={cn(
                      'text-2xl lg:text-3xl font-serif leading-tight',
                      isDark ? 'text-jyotish-gold' : 'text-amber-800',
                    )}>
                      {selectedEntry.title}
                    </h1>

                    <div className={cn(
                      'flex flex-wrap items-center gap-4 text-[13px] font-mono',
                      isDark ? 'text-white/40' : 'text-slate-400',
                    )}>
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
                    'rounded-2xl border px-5 py-6 lg:px-8 lg:py-8',
                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm',
                  )}>
                    <div className={cn(
                      'prose prose-sm lg:prose-base max-w-none leading-relaxed',
                      isDark
                        ? 'prose-invert prose-headings:text-jyotish-gold prose-strong:text-jyotish-gold/90 prose-p:text-white/80 prose-li:text-white/75 prose-blockquote:border-jyotish-gold/30 prose-blockquote:text-white/60'
                        : 'prose-headings:text-amber-800 prose-strong:text-amber-800/90 prose-p:text-slate-700 prose-li:text-slate-700 prose-blockquote:border-amber-300 prose-blockquote:text-slate-600',
                    )}>
                      <ReactMarkdown>{selectedEntry.markdown}</ReactMarkdown>
                    </div>
                  </article>

                  <div className={cn(
                    'pt-6 border-t flex items-center justify-end',
                    isDark ? 'border-white/5' : 'border-slate-200',
                  )}>
                    <button
                      onClick={(e) => handleDelete(selectedEntry, e)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] uppercase font-bold tracking-widest transition-all',
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
              'flex-1 flex flex-col items-center justify-center p-20 text-center',
              isDark ? 'opacity-20' : 'text-slate-300',
            )}>
              <BookOpen className="w-20 h-20 mb-6 stroke-1 animate-pulse" />
              <h2 className={cn('text-xl font-serif italic mb-2', isDark ? 'text-white' : 'text-slate-700')}>
                Select an entry
              </h2>
              <p className={cn('text-sm max-w-xs', isDark ? 'text-white/60' : 'text-slate-500')}>
                Your saved readings and notes live here. Choose an entry on the left to read the full insight.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
