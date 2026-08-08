import { useCallback, useState } from 'react';
import { Check, Link2, Printer, Share2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { reportGlassButtonClass } from '../../../lib/reportGlassStyles';
import { trackPersonalEvent } from '../lib/analytics';
import { t } from '../copy/t';

interface Props {
  shareUrl: string;
  onPrint: () => void;
  className?: string;
}

export function PersonalReportActions({ shareUrl, onPrint, className }: Props) {
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
        trackPersonalEvent('personal_report_shared', { method: 'native' });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackPersonalEvent('personal_report_shared', { method: 'copy' });
      window.setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      trackPersonalEvent('personal_error', { message: String(err), phase: 'share' });
    }
  }, [shareUrl]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    trackPersonalEvent('personal_report_shared', { method: 'copy' });
    window.setTimeout(() => setCopied(false), 2500);
  }, [shareUrl]);

  const btnClass = reportGlassButtonClass(theme);

  return (
    <div className={cn('flex flex-wrap items-center gap-2 print:hidden', className)}>
      <button type="button" onClick={() => void handleShare()} className={btnClass}>
        <Share2 className="h-4 w-4" />
        {t('actions.share')}
      </button>
      <button type="button" onClick={onPrint} className={btnClass}>
        <Printer className="h-4 w-4" />
        {t('actions.print')}
      </button>
      <button type="button" onClick={() => void handleCopyLink()} className={btnClass} title={shareUrl}>
        {copied ? <Check className="h-4 w-4 text-jyotish-gold" /> : <Link2 className="h-4 w-4" />}
        {copied ? t('actions.copied') : t('actions.copyLink')}
      </button>
    </div>
  );
}
