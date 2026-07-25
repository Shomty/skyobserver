import { useTheme } from '../../../../context/ThemeContext';
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

export function DateField({ def, value, error, required, onChange, onBlur }: Props) {
  const { theme } = useTheme();
  return (
    <FieldShell id={def.id} copyKey={def.copyKey} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          name={def.id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={def.autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass(theme, Boolean(error))}
        />
      )}
    </FieldShell>
  );
}
