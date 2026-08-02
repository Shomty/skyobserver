import { useCallback, useState } from 'react';
import { Check, Link2, Printer, Share2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { trackCareerEvent } from '../lib/analytics';
import { t } from '../copy/t';

interface Props {
  shareUrl: string;
  onPrint: () => void;
  className?: string;
}

export function CareerReportActions({ shareUrl, onPrint, className }: Props) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: t('share.title'),
          text: t('share.text'),
          url: shareUrl,
        });
        trackCareerEvent('career_report_shared', { method: 'native' });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackCareerEvent('career_report_shared', { method: 'copy' });
      window.setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      trackCareerEvent('career_error', { message: String(err), phase: 'share' });
    }
  }, [shareUrl]);

  const btnClass = cn(
    'inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-label font-medium transition active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
    theme === 'dark'
      ? 'border-white/15 text-white/80 hover:bg-white/5'
      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
  );

  return (
    <div className={cn('flex flex-wrap items-center gap-2 print:hidden', className)}>
      <button type="button" onClick={() => void handleShare()} className={btnClass}>
        {copied ? <Check className="h-4 w-4 text-jyotish-gold" /> : <Share2 className="h-4 w-4" />}
        {copied ? t('actions.copied') : t('actions.share')}
      </button>
      <button type="button" onClick={onPrint} className={btnClass}>
        <Printer className="h-4 w-4" />
        {t('actions.print')}
      </button>
      <a
        href={shareUrl}
        className={cn(btnClass, 'font-mono text-caption max-w-full truncate sm:max-w-[280px]')}
        title={shareUrl}
        onClick={(e) => e.preventDefault()}
      >
        <Link2 className="h-4 w-4 shrink-0" />
        <span className="truncate">{shareUrl.replace(/^https?:\/\//, '')}</span>
      </a>
    </div>
  );
}
