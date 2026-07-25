import { useTheme } from '../../../../context/ThemeContext';
import { t } from '../../copy/t';
import type { FieldDef } from '../../types';
import { FieldShell } from './FieldShell';
import { helpClass, inputClass } from './fieldStyles';

interface Props {
  def: FieldDef;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function TextAreaField({ def, value, error, required, onChange, onBlur }: Props) {
  const { theme } = useTheme();
  const showCounter = value.length >= 1500;

  return (
    <FieldShell id={def.id} copyKey={def.copyKey} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <>
          <textarea
            id={inputId}
            name={def.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            rows={4}
            maxLength={2000}
            placeholder={t(`${def.copyKey}.placeholder`)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={inputClass(theme, Boolean(error)) + ' min-h-[96px] py-2.5'}
          />
          {showCounter ? (
            <p className={helpClass(theme)} aria-live="polite">
              {t('fields.freeNote.counter', { count: value.length })}
            </p>
          ) : null}
        </>
      )}
    </FieldShell>
  );
}
