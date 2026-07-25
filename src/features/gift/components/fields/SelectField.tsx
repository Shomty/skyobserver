import { useTheme } from '../../../../context/ThemeContext';
import { t } from '../../copy/t';
import type { FieldDef } from '../../types';
import { FieldShell } from './FieldShell';
import { inputClass } from './fieldStyles';

interface Props {
  def: FieldDef;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function SelectField({ def, value, error, required, onChange, onBlur }: Props) {
  const { theme } = useTheme();
  return (
    <FieldShell id={def.id} copyKey={def.copyKey} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <select
          id={inputId}
          name={def.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass(theme, Boolean(error))}
        >
          <option value="">{t(`${def.copyKey}.placeholder`)}</option>
          {(def.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {t(opt)}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
