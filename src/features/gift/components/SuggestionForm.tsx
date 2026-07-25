import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import { submitSuggestion } from '../lib/giftApi';
import { primaryButtonClass } from './buttonStyles';
import { inputClass, labelClass } from './fields/fieldStyles';

export function SuggestionForm() {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'thanks' | 'error'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus('sending');
    try {
      await submitSuggestion({ text: text.trim(), email: email.trim() || undefined });
      setStatus('thanks');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'thanks') {
    return (
      <p
        className={cn(
          'rounded-2xl border p-5 text-body',
          theme === 'dark'
            ? 'bg-white/[0.03] border-white/10 text-white/70'
            : 'bg-white border-slate-200 text-slate-700'
        )}
        role="status"
      >
        {t('chooser.suggestion.thanks')}
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'rounded-2xl border p-5 space-y-4',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <div>
        <h2 className="font-serif text-title">{t('chooser.suggestion.title')}</h2>
        <p className={cn('mt-1 text-caption', theme === 'dark' ? 'text-white/45' : 'text-slate-500')}>
          {t('chooser.suggestion.help')}
        </p>
      </div>
      <div>
        <label htmlFor="gift-suggestion-text" className={labelClass(theme)}>
          {t('chooser.suggestion.title')}
        </label>
        <textarea
          id="gift-suggestion-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          required
          placeholder={t('chooser.suggestion.placeholder')}
          className={inputClass(theme) + ' min-h-[88px]'}
        />
      </div>
      <div>
        <label htmlFor="gift-suggestion-email" className={labelClass(theme)}>
          {t('chooser.suggestion.emailLabel')}
        </label>
        <input
          id="gift-suggestion-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          placeholder={t('chooser.suggestion.emailPlaceholder')}
          className={inputClass(theme)}
        />
      </div>
      {status === 'error' ? (
        <p className={cn('text-caption', theme === 'dark' ? 'text-red-400' : 'text-red-500')} role="alert">
          {t('chooser.suggestion.error')}
        </p>
      ) : null}
      <button type="submit" disabled={status === 'sending'} className={primaryButtonClass()}>
        {t('chooser.suggestion.submit')}
      </button>
    </form>
  );
}
