import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import {
  isPlaceFieldId,
  type FieldId,
  type GiftDefinition,
  type PlaceFieldId,
  type PlaceResolution,
  type WizardState,
} from '../types';
import { FieldRenderer } from './fields/FieldRenderer';
import { Honeypot } from './fields/Honeypot';

interface Props {
  gift: GiftDefinition;
  state: WizardState;
  onChange: (id: FieldId, value: string) => void;
  onBlur: (id: FieldId) => void;
  onAssumedNoonChange: (assumed: boolean) => void;
  onHoneypot: (value: string) => void;
  onResolvePlace: (id: PlaceFieldId, place: PlaceResolution) => void;
  onGeocoderUnavailable: (unavailable: boolean) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

export function StepRequired({
  gift,
  state,
  onChange,
  onBlur,
  onAssumedNoonChange,
  onHoneypot,
  onResolvePlace,
  onGeocoderUnavailable,
  headingRef,
}: Props) {
  const { theme } = useTheme();

  return (
    <div className="space-y-5">
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn(
            'font-serif text-heading outline-none',
            theme === 'dark' ? 'text-white/95' : 'text-slate-900'
          )}
        >
          {t('wizard.step1.title')}
        </h1>
        <p
          className={cn(
            'mt-2 text-body',
            theme === 'dark' ? 'text-white/55' : 'text-slate-600'
          )}
        >
          {t('wizard.step1.subtitle')}
        </p>
      </div>
      <Honeypot value={state.honeypot} onChange={onHoneypot} />
      {gift.requiredFields.map((id) => (
        <FieldRenderer
          key={id}
          id={id}
          value={state.values[id] ?? ''}
          error={state.touched.has(id) || state.errors[id] ? state.errors[id] : undefined}
          required
          assumedNoon={state.birthTimeAssumedNoon}
          resolvedPlace={isPlaceFieldId(id) ? state.places[id] : undefined}
          onChange={(v) => onChange(id, v)}
          onBlur={() => onBlur(id)}
          onAssumedNoonChange={onAssumedNoonChange}
          onResolvePlace={
            isPlaceFieldId(id) ? (place) => onResolvePlace(id, place) : undefined
          }
          onGeocoderUnavailable={onGeocoderUnavailable}
        />
      ))}
    </div>
  );
}
