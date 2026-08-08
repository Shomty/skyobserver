/// <reference types="vite/client" />
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GiftShell } from '../../gift/components/GiftShell';
import { DailyNetworkError } from '../components/DailyNetworkError';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { secondaryButtonClass } from '../../gift/components/buttonStyles';
import { ReportMetaBadge, ReportResultHeader } from '../../../components/report/ReportResultHeader';
import { reportGlassButtonClass } from '../../../lib/reportGlassStyles';
import { DailyForm } from '../components/DailyForm';
import { DailyReportActions } from '../components/DailyReportActions';
import { DailyReportBody } from '../components/DailyReportBody';
import { DailyViewModeToggle } from '../components/DailyViewModeToggle';
import { t } from '../copy/t';
import { trackDailyEvent } from '../lib/analytics';
import { usePageMeta } from '../../../lib/seo';
import { fetchDailyReportById } from '../lib/dailyReportApi';
import { dailyShareUrl } from '../lib/dailyShareUrl';
import { useDailyCalculator } from '../hooks/useDailyCalculator';
import { useDailyReportGuidance } from '../hooks/useDailyReportGuidance';

type SharedLoadState = 'idle' | 'loading' | 'ready' | 'not-found' | 'error';

export default function DailyCalculatorPage() {
  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [sharedState, setSharedState] = useState<SharedLoadState>(urlReportId ? 'loading' : 'idle');

  const {
    form,
    setField,
    setPlace,
    setCurrentPlace,
    setCurrentPlaceText,
    blurField,
    setGeocoderUnavailable,
    setBirthTimeAssumedNoon,
    setHoneypot,
    snapshot,
    positions,
    loading,
    error,
    calculate,
    reset,
    reportId,
    cachedAt,
    loadSharedReport,
    viewMode,
    setViewMode,
    reportEmail,
    birthFingerprint,
    aiGuidance,
    aiTransitGuidance,
    fromCache,
    applyCachedPlainGuidance,
    applyCachedTransitGuidance,
  } = useDailyCalculator();

  const activeReportId = urlReportId ?? reportId;

  const reportGuidance = useDailyReportGuidance({
    email: reportEmail,
    reportFingerprint: birthFingerprint,
    reportId: activeReportId,
    snapshot,
    cachedPlain: aiGuidance,
    cachedTransit: aiTransitGuidance,
    onPlainSaved: applyCachedPlainGuidance,
    onTransitSaved: applyCachedTransitGuidance,
  });

  const plainGuidance = reportGuidance.plain;
  const vedicTransitGuidance = reportGuidance.transit;

  const shareUrl = activeReportId ? dailyShareUrl(activeReportId) : '';

  usePageMeta({
    title: urlReportId ? t('meta.sharedTitle') : t('meta.title'),
    description: t('meta.description'),
    path: urlReportId ? `/daily/r/${urlReportId}` : '/daily',
    noindex: Boolean(urlReportId),
  });

  useEffect(() => {
    trackDailyEvent('daily_page_viewed', { reportId: urlReportId });
  }, [urlReportId]);

  useEffect(() => {
    if (!urlReportId) {
      setSharedState('idle');
      return;
    }

    let cancelled = false;
    setSharedState('loading');

    fetchDailyReportById(urlReportId)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setSharedState('not-found');
          return;
        }
        loadSharedReport(record);
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
    if (savedId) {
      navigate(`/daily/r/${savedId}`, { replace: true });
    }
  }, [calculate, navigate]);

  const handleRecalculate = useCallback(() => {
    reset();
    navigate('/daily');
  }, [navigate, reset]);

  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
  );

  const showReport = Boolean(snapshot && positions && (urlReportId ? sharedState === 'ready' : true));
  const showForm = !urlReportId && !showReport;

  return (
    <GiftShell dimBackground>
      <div className="space-y-8">
        <header className="space-y-3 print:hidden">
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
            <Link to="/daily" className={secondaryButtonClass(theme)}>
              {t('page.newReport')}
            </Link>
          </div>
        ) : null}

        {showForm ? (
          <>
            <DailyForm
              form={form}
              loading={loading}
              onChange={setField}
              onBlur={blurField}
              onResolvePlace={setPlace}
              onCurrentPlaceText={setCurrentPlaceText}
              onResolveCurrentPlace={setCurrentPlace}
              onGeocoderUnavailable={setGeocoderUnavailable}
              onAssumedNoonChange={setBirthTimeAssumedNoon}
              onHoneypot={setHoneypot}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSubmit={() => void handleSubmit()}
            />
            {loading ? (
              <div className={cn(cardClass, 'flex items-center justify-center gap-3')} role="status">
                <Loader2 className="h-5 w-5 animate-spin text-jyotish-gold" />
                <span className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
                  {t('page.loading')}
                </span>
              </div>
            ) : error ? (
              <div className="space-y-3" role="alert">
                <DailyNetworkError detail={error} onRetry={() => void handleSubmit()} />
              </div>
            ) : null}
          </>
        ) : null}

        {showReport && snapshot && positions ? (
          <div className="space-y-6">
            {!activeReportId ? (
              <div className={cn(cardClass, 'border-amber-500/30 bg-amber-500/10 text-body')} role="status">
                {t('result.noShareLink')}
              </div>
            ) : null}

            <ReportResultHeader
              kicker={t('page.title')}
              personName={form.values.fullName}
              subtitle={t('result.title')}
              meta={
                <>
                  {cachedAt ? (
                    <ReportMetaBadge>{t('result.savedAt', { date: format(new Date(cachedAt), 'PPp') })}</ReportMetaBadge>
                  ) : null}
                  {fromCache ? <ReportMetaBadge accent="emerald">{t('result.fromCache')}</ReportMetaBadge> : null}
                  <ReportMetaBadge>{t('result.location', { place: snapshot.currentPlaceLabel })}</ReportMetaBadge>
                </>
              }
              actions={shareUrl ? <DailyReportActions shareUrl={shareUrl} /> : null}
              toolbar={
                <>
                  <DailyViewModeToggle mode={viewMode} onChange={setViewMode} />
                  <button type="button" onClick={handleRecalculate} className={reportGlassButtonClass(theme, true)}>
                    {t('page.newReport')}
                  </button>
                </>
              }
            />

            <DailyReportBody
              snapshot={snapshot}
              positions={positions}
              viewMode={viewMode}
              plainGuidance={plainGuidance}
              transitGuidance={vedicTransitGuidance}
            />

            {shareUrl ? (
              <div className="flex justify-center pt-2">
                <DailyReportActions shareUrl={shareUrl} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </GiftShell>
  );
}
