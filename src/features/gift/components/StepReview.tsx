import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { getField } from '../config/fields';
import { t } from '../copy/t';
import { resolveBirthInstant } from '../lib/birthInstant';
import { isPlaceFieldId, type GiftDefinition, type WizardState } from '../types';
import { ConsentCheckbox } from './fields/ConsentCheckbox';

interface Props {
  gift: GiftDefinition;
  state: WizardState;
  consentError: boolean;
  onConsent: (accepted: boolean) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

function displayValue(id: string, value: string): string {
  if (!value) return '—';
  if (value.startsWith('salutation.') || value.startsWith('interest.') || value.startsWith('experience.') || value.startsWith('relationship.') || value.startsWith('work.')) {
    return t(value);
  }
  void id;
  return value;
}

export function StepReview({ gift, state, consentError, onConsent, headingRef }: Props) {
  const { theme } = useTheme();
  const allFields = [...gift.requiredFields, ...gift.optionalFields.filter((id) => (state.values[id] ?? '').trim())];

  // Shown against birth time so the visitor can sanity-check the instant we
  // will actually cast — the one thing they cannot verify from the raw fields.
  const birthPlace = state.places.birthPlace;
  const birthInstant = birthPlace
    ? resolveBirthInstant(
        state.values.birthDate ?? '',
        state.values.birthTime ?? '',
        birthPlace.timezone
      )
    : null;

  const captionClass = cn(
    'block text-caption mt-0.5',
    theme === 'dark' ? 'text-white/40' : 'text-slate-500'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn(
            'font-serif text-heading outline-none',
            theme === 'dark' ? 'text-white/95' : 'text-slate-900'
          )}
        >
          {t('wizard.step3.title')}
        </h1>
        <p
          className={cn(
            'mt-2 text-body',
            theme === 'dark' ? 'text-white/55' : 'text-slate-600'
          )}
        >
          {t('wizard.step3.subtitle')}
        </p>
      </div>

      <dl
        className={cn(
          'rounded-2xl border divide-y text-body',
          theme === 'dark'
            ? 'bg-white/[0.03] border-white/10 divide-white/10'
            : 'bg-white border-slate-200 divide-slate-100'
        )}
      >
        {allFields.map((id) => {
          const def = getField(id);
          return (
            <div key={id} className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 min-w-0">
              <dt
                className={cn(
                  'text-label font-medium',
                  theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                )}
              >
                {t(`${def.copyKey}.label`)}
              </dt>
              <dd className="sm:col-span-2 break-words min-w-0">
                {displayValue(id, state.values[id] ?? '')}
                {id === 'birthTime' && state.birthTimeAssumedNoon ? (
                  <span className={captionClass}>{t('wizard.unknownTime.help')}</span>
                ) : null}
                {id === 'birthTime' && birthInstant ? (
                  <span className={captionClass}>
                    {t('wizard.review.birthInstant', {
                      instant: birthInstant.iso.slice(0, 16).replace('T', ' '),
                      zone: birthPlace?.timezone ?? '',
                    })}
                  </span>
                ) : null}
                {isPlaceFieldId(id) && state.places[id] ? (
                  <span className={cn(captionClass, 'font-mono')}>
                    {t('fields.place.resolved', {
                      lat: state.places[id]!.latitude.toFixed(2),
                      lon: state.places[id]!.longitude.toFixed(2),
                      zone: state.places[id]!.timezone,
                    })}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>

      <ConsentCheckbox
        checked={state.consentAccepted}
        error={consentError}
        onChange={onConsent}
      />
    </div>
  );
}
