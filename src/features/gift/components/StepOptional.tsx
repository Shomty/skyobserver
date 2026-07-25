import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { FieldId, GiftDefinition, WizardState } from '../types';
import { FieldRenderer } from './fields/FieldRenderer';

interface Props {
  gift: GiftDefinition;
  state: WizardState;
  onChange: (id: FieldId, value: string) => void;
  onBlur: (id: FieldId) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

export function StepOptional({ gift, state, onChange, onBlur, headingRef }: Props) {
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
          {t('wizard.step2.title')}
        </h1>
        <p
          className={cn(
            'mt-2 text-body',
            theme === 'dark' ? 'text-white/55' : 'text-slate-600'
          )}
        >
          {t('wizard.step2.subtitle')}
        </p>
      </div>
      {gift.optionalFields.map((id) => (
        <FieldRenderer
          key={id}
          id={id}
          value={state.values[id] ?? ''}
          error={state.errors[id]}
          onChange={(v) => onChange(id, v)}
          onBlur={() => onBlur(id)}
        />
      ))}
    </div>
  );
}
