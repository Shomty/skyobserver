import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { getErrorMessage } from '../lib/api-utils';
import { useTheme } from '../context/ThemeContext';

interface APIErrorMessageProps {
  error: any;
  onRetry?: () => void;
  onClear?: () => void;
  className?: string;
  title?: string;
}

export const APIErrorMessage: React.FC<APIErrorMessageProps> = ({ 
  error, 
  onRetry, 
  onClear,
  className,
  title = "Update Failed"
}) => {
  const { theme } = useTheme();
  if (!error) return null;

  const message = getErrorMessage(error);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border flex flex-col gap-3 shadow-lg",
        theme === 'dark' 
          ? "bg-red-500/10 border-red-500/20 text-red-200" 
          : "bg-red-50 border-red-100 text-red-800",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        {onClear && (
          <button 
            onClick={onClear}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
      
      <p className="text-[11px] leading-relaxed opacity-80 font-mono">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
            theme === 'dark'
              ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/20"
              : "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200"
          )}
        >
          <RefreshCw className="w-3 h-3" />
          Retry Connection
        </button>
      )}
    </motion.div>
  );
};
