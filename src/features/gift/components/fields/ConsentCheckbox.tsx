import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../lib/utils';
import { t } from '../../copy/t';
import { errorClass } from './fieldStyles';

interface Props {
  checked: boolean;
  error?: boolean;
  onChange: (checked: boolean) => void;
}

const linkClass =
  'underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50';

/**
 * Splits the consent sentence on its {privacy} / {terms} placeholders so the
 * links keep their position in the sentence for future locales.
 *
 * Text runs become `<label>` elements pointing at the checkbox and links do not,
 * so clicking a policy opens it instead of silently toggling consent. Several
 * labels may target one input, so the whole sentence stays clickable.
 */
function renderConsentSentence(inputId: string): ReactNode[] {
  const template = t('wizard.consent.label');

  return template.split(/(\{privacy\}|\{terms\})/).map((part, i) => {
    if (part === '{privacy}') {
      return (
        <Link key="privacy" to="/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t('wizard.consent.privacy')}
        </Link>
      );
    }
    if (part === '{terms}') {
      return (
        <Link key="terms" to="/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t('wizard.consent.terms')}
        </Link>
      );
    }
    if (!part) return null;
    return (
      <label key={`text-${i}`} htmlFor={inputId} className="cursor-pointer">
        {part}
      </label>
    );
  });
}

export function ConsentCheckbox({ checked, error, onChange }: Props) {
  const { theme } = useTheme();
  const id = 'gift-consent';
  const errorId = `${id}-error`;
  const sentenceId = `${id}-sentence`;

  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-labelledby={sentenceId}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 shrink-0 rounded border-white/20 text-jyotish-gold focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
        />
        <span
          id={sentenceId}
          className={cn(
            'text-label',
            theme === 'dark' ? 'text-white/80' : 'text-slate-700'
          )}
        >
          {renderConsentSentence(id)}
        </span>
      </div>
      {error ? (
        <p id={errorId} role="alert" className={errorClass(theme)}>
          {t('wizard.consent.error')}
        </p>
      ) : null}
    </div>
  );
}
