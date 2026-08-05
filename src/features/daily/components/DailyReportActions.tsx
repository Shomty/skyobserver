import { useCallback, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';

interface Props {
  shareUrl: string;
}

export function DailyReportActions({ shareUrl }: Props) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const payload = { title: t('share.title'), text: t('share.text'), url: shareUrl };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const btnClass = cn(
    'inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-label font-medium transition active:scale-[0.98]',
    theme === 'dark'
      ? 'border-white/10 bg-white/[0.04] text-white/80 hover:border-jyotish-gold/40'
      : 'border-slate-200 bg-white text-slate-700 hover:border-jyotish-gold/50',
  );

  return (
    <button type="button" onClick={() => void handleShare()} className={btnClass}>
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
      {copied ? t('actions.copied') : t('actions.share')}
    </button>
  );
}
