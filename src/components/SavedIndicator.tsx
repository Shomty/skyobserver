import React from 'react';
import { Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface SavedIndicatorProps {
  /** Renders nothing when false — an unsaved report carries no badge at all. */
  saved: boolean;
  isDark: boolean;
  className?: string;
}

/**
 * Mini badge marking a report as persisted to the user's account, meaning it
 * will be reused on the next load instead of costing another Gemini call.
 */
export const SavedIndicator: React.FC<SavedIndicatorProps> = ({ saved, isDark, className }) => {
  if (!saved) return null;

  return (
    <span
      title="Saved to your account — reused on your next visit"
      aria-label="Report saved"
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-lg border shrink-0',
        isDark
          ? 'text-jyotish-gold/60 border-jyotish-gold/20 bg-jyotish-gold/5'
          : 'text-jyotish-gold border-orange-200 bg-orange-50',
        className,
      )}
    >
      <Save className="w-3 h-3" />
    </span>
  );
};

export default SavedIndicator;
