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

export function TextField({ def, value, error, required, onChange, onBlur }: Props) {
  const { theme } = useTheme();
  return (
    <FieldShell id={def.id} copyKey={def.copyKey} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          name={def.id}
          type={def.kind === 'email' ? 'email' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={def.autoComplete}
          inputMode={def.inputMode as 'email' | 'numeric' | 'text' | undefined}
          placeholder={t(`${def.copyKey}.placeholder`)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass(theme, Boolean(error))}
        />
      )}
    </FieldShell>
  );
}
