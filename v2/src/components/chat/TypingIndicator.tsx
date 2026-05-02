import React from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TypingIndicatorProps {
  theme: 'dark' | 'light';
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-lg bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-jyotish-gold" />
      </div>
      <div className={cn(
        'rounded-2xl px-4 py-3 border flex items-center gap-2',
        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
      )}>
        <Loader2 className="w-4 h-4 animate-spin text-jyotish-gold" />
        <span className={cn('text-xs', isDark ? 'text-white/40' : 'text-slate-400')}>Consulting the stars…</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
