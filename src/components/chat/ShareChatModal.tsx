import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, Link2, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ShareChatModalProps {
  theme: 'dark' | 'light';
  /** Existing share id for this chat, or null if not shared yet. */
  shareId: string | null;
  isCreating: boolean;
  isRevoking: boolean;
  error: string | null;
  onCreate: () => void;
  onRevoke: () => void;
  onClose: () => void;
}

function ShareChatModal({
  theme,
  shareId,
  isCreating,
  isRevoking,
  error,
  onCreate,
  onRevoke,
  onClose,
}: ShareChatModalProps) {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const shareUrl = shareId ? `${window.location.origin}/shared/${shareId}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); the link is still
      // visible in the field for manual copy.
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative w-full max-w-md rounded-2xl border shadow-2xl p-6',
          isDark ? 'bg-[#0f0f1a] border-jyotish-gold/20 text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 p-1.5 rounded-lg transition-colors',
            isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          )}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/30 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-jyotish-gold" />
          </div>
          <h2 className="text-base font-bold uppercase tracking-widest gold-gradient-text">Share this chat</h2>
        </div>

        <div
          className={cn(
            'flex items-start gap-2 text-xs rounded-xl p-3 mb-4',
            isDark ? 'bg-white/5 text-white/60' : 'bg-slate-50 text-slate-600'
          )}
        >
          <ShieldCheck className="w-4 h-4 text-jyotish-gold flex-shrink-0 mt-0.5" />
          <p>
            A read-only snapshot of this conversation is published to a private link. Only people you send it to can
            view it, messages you send later won't appear, and you can stop sharing anytime.
          </p>
        </div>

        {error && (
          <div
            className={cn(
              'text-xs rounded-lg px-3 py-2 mb-3',
              isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
            )}
          >
            {error}
          </div>
        )}

        {shareId ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className={cn(
                  'flex-1 min-w-0 text-xs rounded-lg px-3 py-2.5 border font-mono',
                  isDark ? 'bg-black/40 border-white/10 text-white/80' : 'bg-slate-50 border-slate-200 text-slate-700'
                )}
              />
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0',
                  copied
                    ? 'bg-green-500/15 text-green-500'
                    : 'bg-jyotish-gold/10 border border-jyotish-gold/20 text-jyotish-gold hover:bg-jyotish-gold/20'
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={onRevoke}
              disabled={isRevoking}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors',
                isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
              )}
            >
              {isRevoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Stop sharing
            </button>
          </>
        ) : (
          <button
            onClick={onCreate}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-jyotish-gold/10 border border-jyotish-gold/20 text-jyotish-gold hover:bg-jyotish-gold/20 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-60"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {isCreating ? 'Creating link…' : 'Create shareable link'}
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default ShareChatModal;
