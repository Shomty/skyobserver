import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

const STARTER_PROMPTS = [
  'What are my dominant yogas and how do they manifest?',
  'Which house is most active in my chart right now?',
  'What major transits am I currently experiencing?',
  'Tell me about my Lagna and its significance.',
];

interface EmptyStateProps {
  theme: 'dark' | 'light';
  onSelectPrompt: (prompt: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ theme, onSelectPrompt }) => {
  const isDark = theme === 'dark';
  return (
    <div className={cn(
      'flex flex-col items-center justify-center h-full text-center px-6 py-12',
      isDark ? '' : 'bg-surface-base'
    )}>
      <div className="w-16 h-16 rounded-2xl bg-jyotish-gold/10 border border-jyotish-gold/25 flex items-center justify-center mb-4 shadow-sm">
        <Sparkles className="w-8 h-8 text-jyotish-gold" />
      </div>
      <h2 className="text-xl font-bold mb-2 gold-gradient-text font-serif">Jyotish AI</h2>
      <p className={cn('text-sm max-w-sm mb-8 leading-relaxed', isDark ? 'text-white/50' : 'text-ink-muted')}>
        Your personal Vedic Astrology guide. Ask anything about your natal chart, current transits, yogas, or life themes.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
        {STARTER_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => onSelectPrompt(prompt)}
            className={cn(
              'text-left px-4 py-3.5 rounded-xl text-xs border transition-all shadow-sm',
              isDark
                ? 'bg-white/5 border-white/10 text-white/60 hover:border-jyotish-gold/30 hover:text-white/80 hover:bg-white/[0.08]'
                : 'bg-surface-card border-border-gold text-ink-secondary hover:border-jyotish-gold/40 hover:bg-jyotish-gold/5 hover:text-ink-primary'
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;
