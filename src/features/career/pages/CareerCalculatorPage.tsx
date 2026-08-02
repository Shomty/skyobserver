import { format } from 'date-fns';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { GiftShell } from '../../gift/components/GiftShell';
import { NetworkError } from '../../gift/components/states/NetworkError';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { CareerChart } from '../components/CareerChart';
import { CareerFieldChips } from '../components/CareerFieldChips';
import { CareerForm } from '../components/CareerForm';
import { CareerTimeline } from '../components/CareerTimeline';
import { CareerUpsell } from '../components/CareerUpsell';
import { DashaStrip } from '../components/DashaStrip';
import { ParashariVargaPanel } from '../components/ParashariVargaPanel';
import { ScoreCard } from '../components/ScoreCard';
import { getLordInHouseLine } from '../copy/lordInHouse';
import { getTenthHouseParagraph } from '../copy/tenthHouseBySign';
import { t } from '../copy/t';
import { trackCareerEvent } from '../lib/analytics';
import { useCareerCalculator } from '../hooks/useCareerCalculator';
import { maskEmail } from '../lib/careerReportApi';
import { secondaryButtonClass } from '../../gift/components/buttonStyles';

export default function CareerCalculatorPage() {
  const { theme } = useTheme();
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
    fromCache,
    reportEmail,
    cachedAt,
  } = useCareerCalculator();

  useEffect(() => {
    document.title = t('meta.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('meta.description'));
    trackCareerEvent('career_page_viewed');
  }, []);

  const cardClass = cn(
    'rounded-2xl border p-4 sm:p-6',
    theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
  );

  return (
    <GiftShell dimBackground>
      <div className="space-y-8">
        <header className="space-y-3">
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

        {!snapshot ? (
          <>
            <CareerForm
              form={form}
              loading={loading}
              onChange={setField}
              onBlur={blurField}
              onResolvePlace={setPlace}
              onGeocoderUnavailable={setGeocoderUnavailable}
              onAssumedNoonChange={setBirthTimeAssumedNoon}
              onHoneypot={setHoneypot}
              onSubmit={() => void calculate()}
            />
            {loading ? (
              <div
                className={cn(cardClass, 'flex items-center justify-center gap-3')}
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-5 w-5 animate-spin text-jyotish-gold" />
                <span className={cn('text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
                  {t('page.loading')}
                </span>
              </div>
            ) : error ? (
              <div className="space-y-3" role="alert" aria-live="assertive">
                <NetworkError onRetry={() => void calculate()} />
                <p className={cn('text-caption font-mono', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
                  {error}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-heading">
                {t('result.title')}
                {form.values.fullName ? (
                  <span className={cn('block text-body font-sans mt-1', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
                    {t('result.for', { name: form.values.fullName })}
                  </span>
                ) : null}
                {reportEmail ? (
                  <span className={cn('block text-caption font-mono mt-1', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
                    {t('result.reportId', { email: maskEmail(reportEmail) })}
                  </span>
                ) : null}
                {fromCache ? (
                  <span className="mt-2 inline-flex rounded-full bg-jyotish-gold/15 px-2.5 py-0.5 text-caption font-medium text-jyotish-gold">
                    {t('result.cached')}
                    {cachedAt ? ` · ${t('result.cachedAt', { date: format(new Date(cachedAt), 'PPp') })}` : ''}
                  </span>
                ) : null}
              </h2>
              <button type="button" onClick={reset} className={secondaryButtonClass(theme)}>
                {t('page.recalculate')}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-jyotish-gold" aria-label={t('page.loading')} />
              </div>
            ) : (
              <>
                {positions ? (
                  <CareerChart
                    positions={positions}
                    tenthSign={snapshot.tenthHouse.sign}
                    tenthLord={snapshot.tenthLord.planet}
                  />
                ) : null}

                <DashaStrip dasha={snapshot.dasha} />

                <section className={cardClass}>
                  <h3 className="font-serif text-title">{t('scores.title')}</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <ScoreCard score={snapshot.scores.tenthHouseStrength} />
                    <ScoreCard score={snapshot.scores.leadership} />
                    <ScoreCard score={snapshot.scores.careerDrive} />
                  </div>
                </section>

                <section className={cardClass}>
                  <h3 className="font-serif text-title">{t('house.title')}</h3>
                  <p className="mt-2 font-medium">
                    {t('house.heading', { sign: snapshot.tenthHouse.sign })}
                  </p>
                  <p className={cn('mt-3 text-body leading-relaxed', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
                    {getTenthHouseParagraph(snapshot.tenthHouse.sign)}
                  </p>
                </section>

                <section className={cardClass}>
                  <h3 className="font-serif text-title">{t('engine.title')}</h3>
                  <p className="mt-2 font-medium">
                    {t('engine.heading', {
                      lord: snapshot.tenthLord.planet,
                      house: snapshot.tenthLord.house,
                    })}
                  </p>
                  <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
                    {getLordInHouseLine(snapshot.tenthLord.planet, snapshot.tenthLord.house)}
                  </p>
                </section>

                <CareerTimeline timing={snapshot.timing} />

                <ParashariVargaPanel sections={snapshot.parashari.sections} />

                <section className={cardClass}>
                  <h3 className="font-serif text-title">{t('yoga.title')}</h3>
                  <p className={cn('mt-3 text-body', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
                    {snapshot.wealthYogas.length > 0
                      ? t('yoga.count', {
                          count: snapshot.wealthYogas.length,
                          names: snapshot.wealthYogas
                            .slice(0, 2)
                            .map((y) => y.shortTitle || y.name)
                            .join(', '),
                        })
                      : t('yoga.none')}
                  </p>
                </section>

                <CareerFieldChips fields={snapshot.fields} />
                <CareerUpsell />

                <section className={cardClass}>
                  <h3 className="font-serif text-title">{t('faq.title')}</h3>
                  <dl className="mt-4 space-y-4">
                    {(['q1', 'q2', 'q3'] as const).map((q) => (
                      <div key={q}>
                        <dt className="font-medium">{t(`faq.${q}`)}</dt>
                        <dd className={cn('mt-1 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
                          {t(`faq.a${q.slice(1)}`)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </GiftShell>
  );
}
