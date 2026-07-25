import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { GiftShell } from '../components/GiftShell';
import { t } from '../copy/t';
import { trackGiftEvent } from '../lib/analytics';
import { verifyGiftToken } from '../lib/giftApi';

type Result = 'loading' | 'ok' | 'expired' | 'invalid' | 'network';

export default function GiftVerifyPage() {
  const { theme } = useTheme();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [result, setResult] = useState<Result>('loading');

  const run = async () => {
    setResult('loading');
    try {
      const res = await verifyGiftToken(token);
      setResult(res.status);
      trackGiftEvent('gift_verify_landed', { result: res.status });
    } catch {
      setResult('network');
      trackGiftEvent('gift_verify_landed', { result: 'network' });
    }
  };

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const copy =
    result === 'ok'
      ? { title: t('verify.ok.title'), body: t('verify.ok.body'), cta: t('verify.ok.cta'), href: '/' }
      : result === 'expired'
        ? {
            title: t('verify.expired.title'),
            body: t('verify.expired.body'),
            cta: t('verify.expired.cta'),
            href: '/gift',
          }
        : result === 'invalid'
          ? {
              title: t('verify.invalid.title'),
              body: t('verify.invalid.body'),
              cta: t('verify.invalid.cta'),
              href: '/gift',
            }
          : result === 'network'
            ? {
                title: t('verify.network.title'),
                body: t('verify.network.body'),
                cta: t('verify.network.cta'),
                href: null,
              }
            : null;

  return (
    <GiftShell>
      <section
        className={cn(
          'rounded-2xl border p-6 sm:p-8',
          theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        {result === 'loading' ? (
          <p role="status" className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
            {t('verify.loading')}
          </p>
        ) : copy ? (
          <>
            <h1 className="font-serif text-heading">{copy.title}</h1>
            <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
              {copy.body}
            </p>
            {copy.href ? (
              <Link
                to={copy.href}
                className="inline-flex mt-6 min-h-[44px] items-center rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
              >
                {copy.cta}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void run()}
                className="mt-6 min-h-[44px] rounded-xl bg-jyotish-gold px-5 text-label font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
              >
                {copy.cta}
              </button>
            )}
          </>
        ) : null}
      </section>
    </GiftShell>
  );
}
