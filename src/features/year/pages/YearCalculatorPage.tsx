import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GiftShell } from '../../gift/components/GiftShell';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { secondaryButtonClass } from '../../gift/components/buttonStyles';
import { ReportMetaBadge, ReportResultHeader } from '../../../components/report/ReportResultHeader';
import { reportGlassButtonClass } from '../../../lib/reportGlassStyles';
import { usePageMeta } from '../../../lib/seo';
import { YearExplanation } from '../components/YearExplanation';
import { YearForm } from '../components/YearForm';
import { YearReportBody } from '../components/YearReportBody';
import { t } from '../copy/t';
import { trackYearEvent } from '../lib/analytics';
import { fetchYearReportById } from '../lib/yearReportApi';
import { yearShareUrl } from '../lib/yearShareUrl';
import { useYearCalculator } from '../hooks/useYearCalculator';
import { useYearGuidance } from '../hooks/useYearGuidance';
import { useAuthUser } from '../../auth/useAuthUser';
import type { YearAiSynthesis } from '../lib/yearSynthesisFingerprint';
import { useAccountAiCopy } from '../../auth/useAccountAiCopy';
import { funnelAiDocId } from '../../auth/saveAiToAccount';

type SharedLoadState = 'idle' | 'loading' | 'ready' | 'not-found' | 'error';

export default function YearCalculatorPage() {
  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [sharedState, setSharedState] = useState<SharedLoadState>(urlReportId ? 'loading' : 'idle');
  const [copied, setCopied] = useState(false);

  const {
    form,
    setField,
    setPlace,
    blurField,
    setGeocoderUnavailable,
    setBirthTimeAssumedNoon,
    setHoneypot,
    reading,
    loading,
    error,
    calculate,
    reset,
    reportId,
    cachedAt,
    loadSharedReport,
    reportEmail,
    birthFingerprint,
    aiSynthesis,
    applyCachedSynthesis,
    fullName,
  } = useYearCalculator();

  const activeReportId = urlReportId ?? reportId;
  const { user: authUser, ready: authReady } = useAuthUser();
  const uid = authUser?.uid ?? null;
  const accountSynthesis = useAccountAiCopy<YearAiSynthesis>(uid, activeReportId ? funnelAiDocId('year-horoscope-funnel', activeReportId) : null);
  const guidance = useYearGuidance({
    uid,
    ready: authReady && accountSynthesis.ready,
    // Share records no longer expose the owner's email; a signed-in viewer's own email stands in.
    email: reportEmail ?? authUser?.email ?? null,
    reportFingerprint: birthFingerprint,
    reportId: activeReportId,
    reading,
    fullName,
    cached: aiSynthesis ?? accountSynthesis.data,
    onSaved: applyCachedSynthesis,
  });

  const shareUrl = activeReportId ? yearShareUrl(activeReportId) : '';

  usePageMeta({
    title: urlReportId ? t('meta.sharedTitle') : t('meta.title'),
    description: t('meta.description'),
    path: urlReportId ? `/year/r/${urlReportId}` : '/year',
    noindex: Boolean(urlReportId),
  });

  useEffect(() => {
    trackYearEvent('year_page_viewed', { reportId: urlReportId });
  }, [urlReportId]);

  useEffect(() => {
    if (!urlReportId) {
      setSharedState('idle');
      return;
    }
    let cancelled = false;
    setSharedState('loading');
    fetchYearReportById(urlReportId)
      .then((record) => {
        if (cancelled) return;
        if (!record?.snapshot || !record.reportId) {
          setSharedState('not-found');
          return;
        }
        loadSharedReport({ ...record, reportId: record.reportId });
        setSharedState('ready');
      })
      .catch(() => {
        if (!cancelled) setSharedState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [urlReportId, loadSharedReport]);

  const handleSubmit = useCallback(async () => {
    const savedId = await calculate();
    if (savedId) navigate(`/year/r/${savedId}`, { replace: true });
  }, [calculate, navigate]);

  const handleRecalculate = useCallback(() => {
    reset();
    navigate('/year');
  }, [navigate, reset]);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    trackYearEvent('year_report_shared', { reportId: activeReportId });
    window.setTimeout(() => setCopied(false), 2000);
  }, [activeReportId, shareUrl]);

  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
  );
  const showReport = Boolean(reading && (urlReportId ? sharedState === 'ready' : true));
  const showForm = !urlReportId && !showReport;

  return (
    <GiftShell dimBackground>
      <div className="space-y-8">
        <header className="space-y-3">
          <Link
            to="/"
            className={cn(
              'text-caption',
              theme === 'dark' ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            ← Vedic Sky
          </Link>
          {!showReport ? (
            <>
              <h1 className="font-serif text-display gold-gradient-text">{t('page.title')}</h1>
              <p className={cn('text-body max-w-xl', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
                {t('page.subtitle')}
              </p>
            </>
          ) : null}
        </header>

        {urlReportId && sharedState === 'loading' ? (
          <div className={cn(cardClass, 'flex items-center justify-center gap-3 py-16')} role="status">
            <Loader2 className="h-6 w-6 animate-spin text-jyotish-gold" />
            <span className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
              {t('page.loadingShared')}
            </span>
          </div>
        ) : null}

        {urlReportId && (sharedState === 'not-found' || sharedState === 'error') ? (
          <div className={cn(cardClass, 'space-y-4 text-center py-12')}>
            <h2 className="font-serif text-heading">{t('shared.notFoundTitle')}</h2>
            <p className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
              {sharedState === 'error' ? t('shared.errorBody') : t('shared.notFoundBody')}
            </p>
            <Link to="/year" className={secondaryButtonClass(theme)}>
              {t('page.newReport')}
            </Link>
          </div>
        ) : null}

        {showForm ? (
          <>
            <YearExplanation />
            <YearForm
              form={form}
              loading={loading}
              onChange={setField}
              onBlur={blurField}
              onResolvePlace={setPlace}
              onGeocoderUnavailable={setGeocoderUnavailable}
              onAssumedNoonChange={setBirthTimeAssumedNoon}
              onHoneypot={setHoneypot}
              onSubmit={() => void handleSubmit()}
            />
            {loading ? (
              <div className={cn(cardClass, 'flex items-center justify-center gap-3')} role="status">
                <Loader2 className="h-5 w-5 animate-spin text-jyotish-gold" />
                <span className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
                  {t('page.loading')}
                </span>
              </div>
            ) : null}
            {error ? (
              <p className={cn(cardClass, 'text-body')} role="alert">
                {error}
              </p>
            ) : null}
          </>
        ) : null}

        {showReport && reading ? (
          <div className="space-y-6">
            {!activeReportId ? (
              <div className={cn(cardClass, 'border-amber-500/30 bg-amber-500/10 text-body')} role="status">
                {t('result.noShareLink')}
              </div>
            ) : null}
            <ReportResultHeader
              kicker={t('result.kicker')}
              personName={fullName}
              subtitle={t('result.subtitle', { year: reading.year })}
              meta={
                cachedAt ? (
                  <ReportMetaBadge>
                    {new Date(cachedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </ReportMetaBadge>
                ) : null
              }
              actions={
                <div className="flex flex-wrap gap-2">
                  {shareUrl ? (
                    <button type="button" className={reportGlassButtonClass(theme)} onClick={() => void copyLink()}>
                      {copied ? t('actions.copied') : t('actions.share')}
                    </button>
                  ) : null}
                  <button type="button" className={secondaryButtonClass(theme)} onClick={handleRecalculate}>
                    {t('page.newReport')}
                  </button>
                </div>
              }
            />
            <YearExplanation />
            <YearReportBody
              reading={reading}
              synthesis={guidance.synthesis}
              synthesisLoading={guidance.loading}
              synthesisError={guidance.error}
              synthesisNeedsAuth={guidance.needsAuth}
            />
          </div>
        ) : null}
      </div>
    </GiftShell>
  );
}
