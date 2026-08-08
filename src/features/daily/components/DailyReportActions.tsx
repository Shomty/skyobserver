import { useCallback, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { reportGlassButtonClass } from '../../../lib/reportGlassStyles';
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

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const btnClass = reportGlassButtonClass(theme);

  return (
    <>
      <button type="button" onClick={() => void handleShare()} className={btnClass}>
        <Share2 className="h-4 w-4" />
        {t('actions.share')}
      </button>
      <button type="button" onClick={() => void handleCopyLink()} className={btnClass} title={shareUrl}>
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
        {copied ? t('actions.copied') : t('actions.copyLink')}
      </button>
    </>
  );
}
