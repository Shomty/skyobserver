import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import {
  CONSENT_VERSION,
  type AstroPayload,
  type FieldId,
  type GiftDefinition,
  type WizardState,
} from '../types';
import { isEligibleForBirthdayWindow } from '../lib/eligibility';
import { resolveBirthInstant } from '../lib/birthInstant';
import { trackGiftEvent } from '../lib/analytics';
import { fetchCapacity, submitGift } from '../lib/giftApi';
import { getAttribution } from '../lib/utm';
import { writeDraftForSlug } from '../hooks/useSessionDraft';
import { useFormTiming } from '../hooks/useFormTiming';
import { useGiftWizard } from '../hooks/useGiftWizard';
import { t } from '../copy/t';
import { primaryButtonClass, secondaryButtonClass } from './buttonStyles';
import { WizardProgress } from './WizardProgress';
import { StepRequired } from './StepRequired';
import { StepOptional } from './StepOptional';
import { StepReview } from './StepReview';
import { SubmitCeremony } from './SubmitCeremony';
import { SentScreen } from './SentScreen';
import { CapacityPaused } from './states/CapacityPaused';
import { DailyCapReached } from './states/DailyCapReached';
import { DuplicateEmail } from './states/DuplicateEmail';
import { EligibilityFallback } from './states/EligibilityFallback';
import { NetworkError } from './states/NetworkError';

interface Props {
  gift: GiftDefinition;
}

/**
 * Collapse the wizard state into what the chart engine needs. The birth instant
 * is resolved here, while the birth location's timezone is still known — the
 * backend generating the report has no way to recover it later.
 */
function buildAstroPayload(gift: GiftDefinition, state: WizardState): AstroPayload {
  const birthPlace = state.places.birthPlace ?? null;
  const wantsCelebration = gift.requiredFields.includes('celebrationPlace');
  const celebrationPlace = wantsCelebration ? (state.places.celebrationPlace ?? null) : null;

  const instant = birthPlace
    ? resolveBirthInstant(
        state.values.birthDate ?? '',
        state.values.birthTime ?? '',
        birthPlace.timezone
      )
    : null;

  return {
    birthInstantUtc: instant?.iso ?? null,
    birthTimeZone: birthPlace?.timezone ?? null,
    birthOffsetMinutes: instant?.offsetMinutes ?? null,
    birthPlace,
    celebrationPlace,
    placesResolved: Boolean(birthPlace) && (!wantsCelebration || Boolean(celebrationPlace)),
  };
}

export function GiftWizard({ gift }: Props) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const timing = useFormTiming();
  const {
    state,
    dispatch,
    onChange,
    onBlur,
    tryContinueFromStep1,
    tryContinueFromStep2,
    clearDraft,
  } = useGiftWizard(gift);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [capacityLoading, setCapacityLoading] = useState(true);
  const [pausedInfo, setPausedInfo] = useState<{ resumeDate?: string; message?: string } | null>(
    null
  );
  const [showEligibility, setShowEligibility] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [pendingMaskedEmail, setPendingMaskedEmail] = useState<string | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    trackGiftEvent('gift_wizard_started', { gift: gift.slug });
    let cancelled = false;
    (async () => {
      try {
        const cap = await fetchCapacity(gift.slug);
        if (cancelled) return;
        if (cap.paused || !cap.open) {
          setPausedInfo({ resumeDate: cap.resumeDate, message: cap.message });
          dispatch({
            type: 'SET_BLOCKER',
            blocker: 'capacityPaused',
            data: { resumeDate: cap.resumeDate, message: cap.message },
          });
        }
      } catch {
        // capacity check failure should not block editing
      } finally {
        if (!cancelled) setCapacityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, gift.slug]);

  useEffect(() => {
    const titleKey =
      state.step === 1
        ? 'wizard.step1.title'
        : state.step === 2
          ? 'wizard.step2.title'
          : 'wizard.step3.title';
    setLiveMessage(t('wizard.liveRegion', { current: state.step, title: t(titleKey) }));
    headingRef.current?.focus();
  }, [state.step]);

  const handleBlur = useCallback(
    (id: FieldId) => {
      onBlur(id);
      if (id === 'birthDate' && gift.eligibility) {
        const date = state.values.birthDate;
        if (date && !isEligibleForBirthdayWindow(date, gift.eligibility)) {
          trackGiftEvent('gift_eligibility_failed', { gift: gift.slug });
          setShowEligibility(true);
        }
      }
    },
    [gift.eligibility, gift.slug, onBlur, state.values.birthDate]
  );

  const focusFirstError = (id?: FieldId) => {
    if (!id) return;
    document.getElementById(`gift-field-${id}`)?.focus();
  };

  const handleContinueStep1 = () => {
    const result = tryContinueFromStep1();
    if (!result.ok) {
      focusFirstError(result.firstError);
      return;
    }
    trackGiftEvent('gift_step1_completed', { gift: gift.slug });
  };

  const handleContinueStep2 = (skipped: boolean) => {
    const result = tryContinueFromStep2(skipped);
    if (!result.ok) {
      focusFirstError(result.firstError);
      return;
    }
    trackGiftEvent('gift_step2_completed', { gift: gift.slug, skipped });
  };

  const runSubmit = async () => {
    if (submitLock.current) return;
    if (!state.consentAccepted) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    submitLock.current = true;
    setRequestDone(false);
    setPendingMaskedEmail(null);
    dispatch({ type: 'START_SUBMIT' });
    trackGiftEvent('gift_submit_attempted', { gift: gift.slug });

    const { utm, referrer } = getAttribution();
    try {
      const response = await submitGift({
        gift: gift.slug,
        values: state.values,
        astro: buildAstroPayload(gift, state),
        consent: { privacy: true, terms: true, version: CONSENT_VERSION },
        meta: {
          elapsedSeconds: timing.elapsedSeconds(),
          honeypot: state.honeypot,
          utm,
          referrer,
          birthTimeAssumedNoon: state.birthTimeAssumedNoon,
        },
      });

      if (response.status === 'ok') {
        setPendingMaskedEmail(response.maskedEmail);
      } else if (response.status === 'duplicate') {
        trackGiftEvent('gift_submit_blocked', { gift: gift.slug, reason: 'duplicate' });
        dispatch({
          type: 'SET_BLOCKER',
          blocker: 'duplicateEmail',
          data: { maskedEmail: response.maskedEmail },
        });
      } else if (response.status === 'daily_cap') {
        trackGiftEvent('gift_submit_blocked', { gift: gift.slug, reason: 'daily_cap' });
        dispatch({ type: 'SET_BLOCKER', blocker: 'dailyCap' });
      } else if (response.status === 'paused') {
        trackGiftEvent('gift_submit_blocked', { gift: gift.slug, reason: 'paused' });
        dispatch({
          type: 'SET_BLOCKER',
          blocker: 'capacityPaused',
          data: { resumeDate: response.resumeDate },
        });
      } else if (response.status === 'invalid') {
        const fieldErrors = response.fieldErrors as Partial<Record<FieldId, string>>;
        dispatch({ type: 'SET_ERRORS', errors: fieldErrors });
        dispatch({ type: 'GO_STEP', step: 1, status: 'editing' });
        focusFirstError(gift.requiredFields.find((id) => fieldErrors[id]));
      }
    } catch {
      trackGiftEvent('gift_submit_blocked', { gift: gift.slug, reason: 'network' });
      dispatch({ type: 'SET_BLOCKER', blocker: 'networkError' });
    } finally {
      setRequestDone(true);
      submitLock.current = false;
    }
  };

  const onCeremonyComplete = useCallback(() => {
    if (pendingMaskedEmail) {
      clearDraft();
      trackGiftEvent('gift_submit_succeeded', { gift: gift.slug });
      dispatch({ type: 'SUBMIT_OK', maskedEmail: pendingMaskedEmail });
    }
  }, [clearDraft, dispatch, gift.slug, pendingMaskedEmail]);

  const acceptFallback = () => {
    trackGiftEvent('gift_fallback_accepted', { gift: gift.slug });
    writeDraftForSlug(
      gift.fallbackGift ?? 'natal',
      state.values,
      state.places,
      state.birthTimeAssumedNoon
    );
    setShowEligibility(false);
    navigate(`/gift/${gift.fallbackGift ?? 'natal'}`);
  };

  if (capacityLoading) {
    return (
      <p className={cn('text-body', theme === 'dark' ? 'text-white/50' : 'text-slate-500')} role="status">
        …
      </p>
    );
  }

  if (state.blocker === 'capacityPaused' || pausedInfo) {
    return (
      <CapacityPaused
        resumeDate={
          (state.blockerData.resumeDate as string | undefined) ?? pausedInfo?.resumeDate
        }
        message={(state.blockerData.message as string | undefined) ?? pausedInfo?.message}
      />
    );
  }

  if (state.blocker === 'dailyCap') return <DailyCapReached />;
  if (state.blocker === 'duplicateEmail') {
    return (
      <DuplicateEmail
        maskedEmail={String(state.blockerData.maskedEmail ?? '')}
        onUseDifferent={() => {
          dispatch({ type: 'CLEAR_EMAIL_FIELDS' });
          window.setTimeout(() => {
            document.getElementById('gift-field-email')?.focus();
          }, 0);
        }}
      />
    );
  }
  if (state.blocker === 'networkError') {
    return (
      <NetworkError
        onRetry={() => {
          dispatch({ type: 'CLEAR_BLOCKER' });
          dispatch({ type: 'GO_STEP', step: 3, status: 'reviewing' });
        }}
      />
    );
  }

  if (state.status === 'sent' && state.maskedEmail) {
    return <SentScreen gift={gift.slug} maskedEmail={state.maskedEmail} />;
  }

  if (state.status === 'submitting') {
    return (
      <section
        className={cn(
          'rounded-2xl border p-6 sm:p-8',
          theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <SubmitCeremony
          requestDone={requestDone && Boolean(pendingMaskedEmail)}
          onComplete={onCeremonyComplete}
        />
      </section>
    );
  }

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-8',
          theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <WizardProgress step={state.step} />
        <div className="sr-only" aria-live="polite">
          {liveMessage}
        </div>

        {state.step === 1 ? (
          <StepRequired
            gift={gift}
            state={state}
            onChange={onChange}
            onBlur={handleBlur}
            onAssumedNoonChange={(assumed) =>
              dispatch({ type: 'SET_BIRTH_TIME_ASSUMED', assumed })
            }
            onHoneypot={(value) => dispatch({ type: 'SET_HONEYPOT', value })}
            onResolvePlace={(id, place) => dispatch({ type: 'SET_PLACE', id, place })}
            onGeocoderUnavailable={(unavailable) =>
              dispatch({ type: 'SET_GEOCODER_UNAVAILABLE', unavailable })
            }
            headingRef={headingRef}
          />
        ) : null}

        {state.step === 2 ? (
          <StepOptional
            gift={gift}
            state={state}
            onChange={onChange}
            onBlur={onBlur}
            headingRef={headingRef}
          />
        ) : null}

        {state.step === 3 ? (
          <StepReview
            gift={gift}
            state={state}
            consentError={consentError}
            onConsent={(accepted) => {
              setConsentError(false);
              dispatch({ type: 'SET_CONSENT', accepted });
            }}
            headingRef={headingRef}
          />
        ) : null}

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          {state.step > 1 ? (
            <button
              type="button"
              className={secondaryButtonClass(theme)}
              onClick={() => {
                if (state.step === 3) {
                  trackGiftEvent('gift_review_edit_clicked', { gift: gift.slug });
                }
                dispatch({
                  type: 'GO_STEP',
                  step: state.step === 3 ? 1 : ((state.step - 1) as 1 | 2),
                  status: 'editing',
                });
              }}
            >
              {state.step === 3 ? t('wizard.editAnswers') : t('wizard.back')}
            </button>
          ) : (
            <span />
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {state.step === 2 ? (
              <button
                type="button"
                className={secondaryButtonClass(theme)}
                onClick={() => handleContinueStep2(true)}
              >
                {t('wizard.skipOptional')}
              </button>
            ) : null}

            {state.step === 1 ? (
              <button type="button" className={primaryButtonClass()} onClick={handleContinueStep1}>
                {t('wizard.continue')}
              </button>
            ) : null}

            {state.step === 2 ? (
              <button
                type="button"
                className={primaryButtonClass()}
                onClick={() => handleContinueStep2(false)}
              >
                {t('wizard.continue')}
              </button>
            ) : null}

            {state.step === 3 ? (
              <button type="button" className={primaryButtonClass()} onClick={runSubmit}>
                {t('wizard.confirmSend')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <EligibilityFallback
        open={showEligibility}
        onAccept={acceptFallback}
        onCorrect={() => setShowEligibility(false)}
      />
    </>
  );
}
