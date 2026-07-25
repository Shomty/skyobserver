import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { trackGiftEvent } from '../lib/analytics';
import { t } from '../copy/t';
import type { GiftSlug } from '../types';

interface Props {
  gift: GiftSlug;
}

export function ShareRow({ gift }: Props) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/gift` : '/gift';
  const text = encodeURIComponent('Get a free Vedic reading — Natal, Solar, or Annual Code.');

  const channels = [
    {
      id: 'whatsapp',
      label: t('share.whatsapp'),
      href: `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
    },
    {
      id: 'viber',
      label: t('share.viber'),
      href: `viber://forward?text=${text}%20${encodeURIComponent(url)}`,
    },
    {
      id: 'facebook',
      label: t('share.facebook'),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: 'telegram',
      label: t('share.telegram'),
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`,
    },
  ] as const;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackGiftEvent('gift_share_clicked', { gift, channel: 'copy' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <p className={cn('text-label mb-3', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
        {t('sent.share')}
      </p>
      <div className="flex flex-wrap gap-2">
        {channels.map((c) => (
          <a
            key={c.id}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGiftEvent('gift_share_clicked', { gift, channel: c.id })}
            className={cn(
              'min-h-[44px] inline-flex items-center rounded-xl border px-3 text-label focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
              theme === 'dark'
                ? 'border-white/15 text-white/80 hover:border-jyotish-gold/40'
                : 'border-slate-200 text-slate-700 hover:border-jyotish-gold/50'
            )}
          >
            {c.label}
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            'min-h-[44px] inline-flex items-center rounded-xl border px-3 text-label focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50',
            theme === 'dark'
              ? 'border-white/15 text-white/80'
              : 'border-slate-200 text-slate-700'
          )}
        >
          {copied ? t('share.copied') : t('share.copy')}
        </button>
      </div>
    </div>
  );
}
