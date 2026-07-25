import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../lib/utils';
import { t } from '../../copy/t';
import type { FieldDef } from '../../types';
import { FieldShell } from './FieldShell';
import { helpClass, inputClass } from './fieldStyles';

interface Props {
  def: FieldDef;
  value: string;
  error?: string;
  required?: boolean;
  assumedNoon: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onAssumedNoonChange: (assumed: boolean) => void;
}

export function TimeField({
  def,
  value,
  error,
  required,
  assumedNoon,
  onChange,
  onBlur,
  onAssumedNoonChange,
}: Props) {
  const { theme } = useTheme();
  const toggleId = `gift-field-${def.id}-unknown`;

  return (
    <div className="space-y-2">
      <FieldShell id={def.id} copyKey={def.copyKey} error={error} required={required}>
        {({ inputId, describedBy }) => (
          <input
            id={inputId}
            name={def.id}
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={assumedNoon}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(inputClass(theme, Boolean(error)), assumedNoon && 'opacity-70')}
          />
        )}
      </FieldShell>
      <label
        htmlFor={toggleId}
        className={cn(
          'flex items-start gap-2 text-label cursor-pointer',
          theme === 'dark' ? 'text-white/70' : 'text-slate-600'
        )}
      >
        <input
          id={toggleId}
          type="checkbox"
          checked={assumedNoon}
          onChange={(e) => onAssumedNoonChange(e.target.checked)}
          className="mt-1 rounded border-white/20 text-jyotish-gold focus-visible:ring-jyotish-gold/50"
        />
        <span>
          {t('wizard.unknownTime')}
          <span className={cn('block', helpClass(theme))}>{t('wizard.unknownTime.help')}</span>
        </span>
      </label>
    </div>
  );
}
