import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { SynthesisMarkdownBody } from '../../career/components/SynthesisMarkdownBody';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { YearReading } from '../lib/yearEngine';
import type { YearAiSynthesis } from '../lib/yearSynthesisFingerprint';
import { AiUnlockGate } from '../../auth/AiUnlockGate';

function FactCard({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <article
      className={cn(
        'rounded-2xl border p-4 sm:p-5 space-y-2',
        theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white',
      )}
    >
      <h3 className="font-serif text-title">{title}</h3>
      <div className={cn('space-y-2 text-body', theme === 'dark' ? 'text-white/75' : 'text-slate-700')}>
        {children}
      </div>
    </article>
  );
}

export function YearReportBody({
  reading,
  synthesis,
  synthesisLoading,
  synthesisError,
  synthesisNeedsAuth = false,
}: {
  reading: YearReading;
  synthesis: YearAiSynthesis | null;
  synthesisLoading: boolean;
  synthesisError: string | null;
  /** No cached consultation and nobody signed in to generate one. */
  synthesisNeedsAuth?: boolean;
}) {
  const { theme } = useTheme();
  const muted = theme === 'dark' ? 'text-white/55' : 'text-slate-500';
  const { d1, d9, d10, dasha } = reading;

  return (
    <div className="space-y-6">
      <p className={cn('text-body max-w-2xl', theme === 'dark' ? 'text-white/70' : 'text-slate-600')}>
        {reading.stance}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <FactCard title={t('facts.identity')}>
          <p>
            {d1.lagna.sign} rising at {d1.lagna.degree}, Nakshatra {d1.lagna.nakshatra} (lord{' '}
            {d1.lagna.nakshatraLord}). Chart lord: {d1.lagna.lord}.
          </p>
          <p>{d1.lagna.felicity}</p>
          <p>{d1.lagna.intellect}</p>
          <p>{d1.lagna.nature}</p>
          <p>
            <span className="font-medium">{t('facts.vargottama')}: </span>
            {reading.vargottama.planets.length > 0 ? reading.vargottama.planets.join(', ') : 'none in this chart'}
            . {reading.vargottama.note}
          </p>
        </FactCard>

        <FactCard title={t('facts.union')}>
          <p>
            Navamsha rising in {d9.lagnaSign}. The 7th falls in {d9.seventh.sign}, lord {d9.seventh.lord}
            {d9.seventh.lordHouse ? ` in house ${d9.seventh.lordHouse}` : ''}.
          </p>
          <p>
            Upapada in {d9.upapada.sign} (house {d9.upapada.houseFromLagna} from the birth lagna). Navamsha
            planets there: {d9.upapada.d9PlanetsInSign.length > 0 ? d9.upapada.d9PlanetsInSign.join(', ') : 'none'}.
          </p>
          {d9.relationshipNotes.length === 0 ? (
            <p className={muted}>Gulika and Mandi do not sit on the Navamsha relationship axis.</p>
          ) : (
            d9.relationshipNotes.map((note) => <p key={`${note.point}-${note.house}`}>{note.framing}</p>)
          )}
        </FactCard>

        <FactCard title={t('facts.action')}>
          <p>
            Dashamsha rising in {d10.lagnaSign}. The 10th is {d10.tenth.sign}, lord {d10.tenth.lord} in house{' '}
            {d10.tenth.lordHouse}.
          </p>
          <p>{d10.amatyakaraka.soulPurpose}</p>
          {d10.amatyakaraka.planet ? (
            <p>
              {d10.amatyakaraka.planet} in D10 {d10.amatyakaraka.d10Sign ?? 'unknown'}
              {d10.amatyakaraka.d10House ? `, house ${d10.amatyakaraka.d10House}` : ''}.{' '}
              {d10.amatyakaraka.conjunctOrInfluencingTenth
                ? 'It influences the 10th house of the Dashamsha.'
                : 'It does not directly touch the Dashamsha 10th.'}
            </p>
          ) : null}
          {d10.careerNotes.length === 0 ? (
            <p className={muted}>Gulika and Mandi are clear of the key career houses in the Dashamsha.</p>
          ) : (
            d10.careerNotes.map((note) => <p key={`${note.point}-${note.house}`}>{note.framing}</p>)
          )}
        </FactCard>

        <FactCard title={t('facts.timing')}>
          <p>Vimshottari, the dasha system read across a 120-year span.</p>
          <p>
            Mahadasha {dasha.mahadasha.lord}
            {dasha.mahadasha.d1 ? ` in ${dasha.mahadasha.d1.sign}, house ${dasha.mahadasha.d1.house}` : ''}.{' '}
            {dasha.mahadasha.favorable ? t('facts.awake') : dasha.mahadasha.challenging ? t('facts.heavy') : 'Mixed ground'}.
          </p>
          <p>
            Antardasha {dasha.antardasha.lord}
            {dasha.antardasha.d1 ? ` in ${dasha.antardasha.d1.sign}, house ${dasha.antardasha.d1.house}` : ''}.{' '}
            {dasha.antardasha.favorable ? t('facts.awake') : dasha.antardasha.challenging ? t('facts.heavy') : 'Mixed ground'}.
          </p>
          {dasha.positivePredictive ? (
            <p>An awake lord, in its own sign or exaltation, can open that planet&apos;s promises when you meet the year halfway.</p>
          ) : null}
        </FactCard>
      </div>

      {reading.remedies.length > 0 ? (
        <FactCard title={t('facts.remedies')}>
          <p>These practices belong to the heavy part of the year. You still choose how the period is lived.</p>
          {reading.remedies.map((remedy) => (
            <div key={remedy.planet}>
              <p className="font-medium">{remedy.planet}</p>
              <p className="font-mono text-sm">{remedy.mantra}</p>
              <p>{remedy.mindset}</p>
            </div>
          ))}
        </FactCard>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-serif text-heading">{t('result.consultation')}</h3>
        {synthesisLoading && !synthesis ? (
          <p className={cn('flex items-center gap-2 text-body', muted)} role="status">
            <Loader2 className="h-4 w-4 animate-spin text-jyotish-gold" />
            {t('result.preparing')}
          </p>
        ) : null}
        {synthesisNeedsAuth && !synthesis ? <AiUnlockGate /> : null}
        {synthesisError && !synthesis ? (
          <p className="text-body text-amber-700" role="alert">
            {t('result.consultationError')}
          </p>
        ) : null}
        {synthesis ? <SynthesisMarkdownBody text={synthesis.text} /> : null}
      </section>
    </div>
  );
}
