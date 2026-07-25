import type { ReactNode } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { t } from '../../copy/t';
import { errorClass, helpClass, labelClass } from './fieldStyles';

interface FieldShellProps {
  id: string;
  copyKey: string;
  error?: string;
  required?: boolean;
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode;
}

export function FieldShell({ id, copyKey, error, required, children }: FieldShellProps) {
  const { theme } = useTheme();
  const inputId = `gift-field-${id}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const help = t(`${copyKey}.help`);
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className={labelClass(theme)}>
        {t(`${copyKey}.label`)}
        {required ? (
          <span className="text-jyotish-gold ml-0.5" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children({ inputId, describedBy })}
      {help ? (
        <p id={helpId} className={helpClass(theme)}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={errorClass(theme)}>
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
