import React, { useEffect, useState } from 'react';
import { BookOpen, Trash2, Calendar, Sparkles, ChevronRight, Search, Filter, Loader2, Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { getUserReports, deleteAIReport, AIReport } from '../services/aiReportService';
import { useTheme } from '../context/ThemeContext';

interface ArchivesProps {
  uid: string;
}

export const Archives: React.FC<ArchivesProps> = ({ uid }) => {
  const { theme } = useTheme();
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const data = await getUserReports(uid);
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [uid]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this interpretation?")) {
      await deleteAIReport(uid, id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    }
  };

  const getReportContent = (data: any): string => {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          if (item.topic && item.content) return `### ${item.topic}\n\n${item.content}`;
          return JSON.stringify(item);
        }
        return String(item);
      }).join('\n\n');
    }
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data);
    }
    return String(data || '');
  };

  const filteredReports = reports.filter(report => {
    const content = getReportContent(report.data);
    const matchesSearch = 
      content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.cacheKey || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'All' || report.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const types = ['All', ...new Set(reports.map(r => r.type))];

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden",
      theme === 'dark' ? "text-white" : "text-slate-900"
    )}>
      {/* Header */}
      <div className={cn(
        "p-6 border-b flex flex-col gap-4",
        theme === 'dark' ? "border-white/10 bg-mystic-purple/20" : "border-slate-200 bg-white"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jyotish-gold/20 flex items-center justify-center text-jyotish-gold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight gold-gradient-text uppercase italic font-serif">Astrological Journal</h2>
              <p className={cn("text-[10px] uppercase tracking-widest font-mono", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Saved AI Interpretations</p>
            </div>
          </div>
          <p className="text-[10px] font-mono opacity-40">{filteredReports.length} Entries</p>
        </div>

        <div className="flex gap-3 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input 
              type="text" 
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono focus:ring-2 focus:ring-jyotish-gold/50 outline-none transition-all",
                theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              )}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={cn(
                "pl-10 pr-8 py-2.5 rounded-xl border text-sm font-mono appearance-none focus:ring-2 focus:ring-jyotish-gold/50 outline-none transition-all",
                theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              )}
            >
              {types.map(t => <option key={t} value={t}>{t === 'All' ? 'Sort: All' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* List */}
        <div className={cn(
          "w-full lg:w-[400px] flex flex-col border-r overflow-y-auto no-scrollbar",
          theme === 'dark' ? "border-white/10" : "border-slate-200",
          selectedReport ? "hidden lg:flex" : "flex"
        )}>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-jyotish-gold/40">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <span className="text-[10px] uppercase mt-2 tracking-widest font-mono">Opening vault...</span>
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedReport(report);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "w-full text-left p-5 flex flex-col gap-2 transition-all hover:bg-jyotish-gold/5 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-jyotish-gold/50",
                    selectedReport?.id === report.id ? "bg-jyotish-gold/10" : ""
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                      report.type === 'transit' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                      report.type === 'prediction' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                      "bg-jyotish-gold/10 border-jyotish-gold/20 text-jyotish-gold"
                    )}>
                      {report.type}
                    </div>
                    <span className="text-[9px] font-mono opacity-40">
                      {report.createdAt?.toDate ? format(report.createdAt.toDate(), 'MMM d, yyyy') : 'Unknown Date'}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-bold line-clamp-1 opacity-90">
                    {report.cacheKey.split('|').pop()}
                  </h3>
                  
                  <p className="text-[13px] opacity-40 line-clamp-2 leading-relaxed">
                    {getReportContent(report.data).replace(/[#*`]/g, '').slice(0, 100)}...
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 opacity-30 text-[9px] font-mono">
                      <Bookmark className="w-3 h-3" />
                      Recorded Entry
                    </div>
                    <button 
                      onClick={(e) => handleDelete(report.id!, e)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center text-white/20">
              <Bookmark className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-sm">No interpretations found in your archives.</p>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-black/20",
          !selectedReport ? "hidden lg:flex" : "flex"
        )}>
          {selectedReport ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col"
            >
              <div className="p-4 border-b flex items-center gap-3 lg:hidden">
                <button onClick={() => setSelectedReport(null)} className="p-2 -ml-2">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="font-bold text-sm">Return to List</div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                        selectedReport.type === 'transit' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                        selectedReport.type === 'prediction' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                        "bg-jyotish-gold/10 border-jyotish-gold/20 text-jyotish-gold"
                      )}>
                        {selectedReport.type} Analysis
                      </div>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <h1 className="text-3xl font-serif italic text-jyotish-gold">
                      {selectedReport.cacheKey.split('|').pop()}
                    </h1>
                    <div className="flex items-center gap-6 text-[13px] font-mono opacity-40">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {selectedReport.createdAt?.toDate ? format(selectedReport.createdAt.toDate(), 'EEEE, MMMM d, yyyy') : 'Unknown Date'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Generated
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-jyotish-gold prose-p:text-white/70 prose-strong:text-jyotish-gold prose-ul:text-white/60">
                    <ReactMarkdown>{getReportContent(selectedReport.data)}</ReactMarkdown>
                  </div>

                  <div className="pt-12 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-all">
                        Archive Entry
                       </button>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(selectedReport.id!, e)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] uppercase font-bold tracking-widest text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Entry
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
              <BookOpen className="w-20 h-20 mb-6 stroke-1 animate-pulse" />
              <h2 className="text-xl font-serif italic mb-2">Select an interpretation</h2>
              <p className="text-sm max-w-xs">Your personal journey recorded through the stars. Select an entry on the left to read the full insight.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
