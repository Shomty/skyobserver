import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GiftShell } from '../../gift/components/GiftShell';
import { NetworkError } from '../../gift/components/states/NetworkError';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { PersonalForm } from '../components/PersonalForm';
import { PersonalReportActions } from '../components/PersonalReportActions';
import { PersonalReportBody } from '../components/PersonalReportBody';
import { PersonalReportPrintView } from '../components/PersonalReportPrintView';
import { t } from '../copy/t';
import { trackPersonalEvent } from '../lib/analytics';
import { usePageMeta } from '../../../lib/seo';
import { fetchPersonalReportById } from '../lib/personalReportApi';
import { paginatePersonalReport } from '../lib/personalPrint';
import { personalShareUrl } from '../lib/personalShareUrl';
import {
  PersonalPremiumProvider,
  usePersonalPremiumUnlocked,
  useSetPersonalPremiumEmail,
} from '../context/PersonalPremiumContext';
import { usePersonalCalculator } from '../hooks/usePersonalCalculator';
import { usePersonalGuidance } from '../hooks/usePersonalGuidance';
import { secondaryButtonClass } from '../../gift/components/buttonStyles';

type SharedLoadState = 'idle' | 'loading' | 'ready' | 'not-found' | 'error';

export default function PersonalCalculatorPage() {
  return (
    <PersonalPremiumProvider>
      <PersonalCalculatorPageContent />
    </PersonalPremiumProvider>
  );
}

function PersonalCalculatorPageContent() {
  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const premiumUnlocked = usePersonalPremiumUnlocked();
  const [sharedState, setSharedState] = useState<SharedLoadState>(urlReportId ? 'loading' : 'idle');

  const {
    form,
    setField,
    setPlace,
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
    reportEmail,
    cachedAt,
    birthFingerprint,
    aiSynthesis,
    loadSharedReport,
  } = usePersonalCalculator();

  const setPremiumEmail = useSetPersonalPremiumEmail();
  useEffect(() => {
    setPremiumEmail(reportEmail);
  }, [reportEmail, setPremiumEmail]);

  const activeReportId = urlReportId ?? reportId;

  const guidanceState = usePersonalGuidance({
    email: reportEmail,
    birthFingerprint,
    reportId: activeReportId,
    snapshot,
    cachedGuidance: aiSynthesis,
    premiumUnlocked,
  });

  const shareUrl = activeReportId ? personalShareUrl(activeReportId) : '';

  const handlePrint = useCallback(async () => {
    try {
      await paginatePersonalReport();
      trackPersonalEvent('personal_report_printed', { reportId: activeReportId });
    } catch (error) {
      trackPersonalEvent('personal_print_failed', { reportId: activeReportId, message: String(error) });
    }
  }, [activeReportId]);

  usePageMeta({
    title: urlReportId ? t('meta.sharedTitle') : t('meta.title'),
    description: t('meta.description'),
    path: urlReportId ? `/personal/r/${urlReportId}` : '/personal',
    noindex: Boolean(urlReportId),
  });

  useEffect(() => {
    trackPersonalEvent('personal_page_viewed', { reportId: urlReportId });
  }, [urlReportId]);

  useEffect(() => {
    if (!urlReportId) {
      setSharedState('idle');
      return;
    }

    let cancelled = false;
    setSharedState('loading');

    fetchPersonalReportById(urlReportId)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setSharedState('not-found');
          return;
        }
        loadSharedReport(record);
        setSharedState('ready');
        trackPersonalEvent('personal_result_shown', { reportId: urlReportId, shared: true });
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
      navigate(`/personal/r/${savedId}`, { replace: true });
    }
  }, [calculate, navigate]);

  const handleRecalculate = useCallback(() => {
    reset();
    navigate('/personal');
  }, [navigate, reset]);

  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
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
              theme === 'dark' ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            ← Vedic Sky
          </Link>
          <h1 className="font-serif text-display gold-gradient-text">{t('page.title')}</h1>
          <p className={cn('text-body max-w-xl', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
            {t('page.subtitle')}
          </p>
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
            <Link to="/personal" className={secondaryButtonClass(theme)}>
              {t('page.newReport')}
            </Link>
          </div>
        ) : null}

        {showForm ? (
          <>
            <PersonalForm
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
            ) : error ? (
              <div className="space-y-3" role="alert">
                <NetworkError onRetry={() => void handleSubmit()} />
                <p className={cn('text-caption font-mono', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
                  {error}
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {showReport && snapshot && positions ? (
          <div className="space-y-6">
            {!activeReportId ? (
              <div className={cn(cardClass, 'border-amber-500/30 bg-amber-500/10 text-body print:hidden')} role="status">
                {t('result.noShareLink')}
              </div>
            ) : null}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
              <div className="space-y-2">
                <h2 className="font-serif text-heading">
                  {t('result.title')}
                  {form.values.fullName ? (
                    <span
                      className={cn(
                        'block text-body font-sans mt-1',
                        theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                      )}
                    >
                      {t('result.for', { name: form.values.fullName })}
                    </span>
                  ) : null}
                </h2>
                {cachedAt ? (
                  <p className={cn('text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
                    {t('result.savedAt', { date: format(new Date(cachedAt), 'PPp') })}
                  </p>
                ) : null}
                {premiumUnlocked ? (
                  <span className="inline-flex rounded-full bg-jyotish-gold/15 px-2.5 py-0.5 text-caption font-medium text-jyotish-gold">
                    {t('result.premiumUnlocked')}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {shareUrl ? (
                  <PersonalReportActions shareUrl={shareUrl} onPrint={() => void handlePrint()} />
                ) : null}
                <button type="button" onClick={handleRecalculate} className={secondaryButtonClass(theme)}>
                  {t('page.newReport')}
                </button>
              </div>
            </div>

            <PersonalReportBody snapshot={snapshot} positions={positions} guidance={guidanceState} />

            {shareUrl ? (
              <div className="flex justify-center pt-2 print:hidden">
                <PersonalReportActions shareUrl={shareUrl} onPrint={() => void handlePrint()} />
              </div>
            ) : null}

            <PersonalReportPrintView
              fullName={form.values.fullName}
              birthPlaceLabel={form.values.birthPlace}
              cachedAt={cachedAt}
              snapshot={snapshot}
              positions={positions}
              guidance={guidanceState}
            />
          </div>
        ) : null}
      </div>
    </GiftShell>
  );
}
