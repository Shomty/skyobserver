import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { primaryButtonClass } from '../../gift/components/buttonStyles';
import { FieldRenderer } from '../../gift/components/fields/FieldRenderer';
import { Honeypot } from '../../gift/components/fields/Honeypot';
import { t as giftT } from '../../gift/copy/t';
import type { FieldId } from '../../gift/types';
import { t } from '../copy/t';
import type { CareerFormState } from '../hooks/useCareerCalculator';

const FIELDS: FieldId[] = ['fullName', 'birthDate', 'birthTime', 'birthPlace'];

interface Props {
  form: CareerFormState;
  loading: boolean;
  onChange: (id: FieldId, value: string) => void;
  onBlur: (id: FieldId) => void;
  onResolvePlace: (place: import('../../gift/types').PlaceResolution) => void;
  onGeocoderUnavailable: (unavailable: boolean) => void;
  onAssumedNoonChange: (assumed: boolean) => void;
  onHoneypot: (value: string) => void;
  onSubmit: () => void;
}

export function CareerForm({
  form,
  loading,
  onChange,
  onBlur,
  onResolvePlace,
  onGeocoderUnavailable,
  onAssumedNoonChange,
  onHoneypot,
  onSubmit,
}: Props) {
  const { theme } = useTheme();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn(
        'rounded-2xl border p-4 sm:p-6 space-y-5',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <div>
        <h2 className="font-serif text-heading">{t('form.title')}</h2>
        <p className={cn('mt-2 text-body', theme === 'dark' ? 'text-white/60' : 'text-slate-600')}>
          {t('form.subtitle')}
        </p>
      </div>

      <Honeypot value={form.honeypot} onChange={onHoneypot} />

      {FIELDS.map((id) => (
        <FieldRenderer
          key={id}
          id={id}
          value={form.values[id] ?? ''}
          error={form.errors[id] ? giftT(form.errors[id]) : undefined}
          required
          assumedNoon={form.birthTimeAssumedNoon}
          resolvedPlace={id === 'birthPlace' ? form.places.birthPlace : undefined}
          onChange={(v) => onChange(id, v)}
          onBlur={() => onBlur(id)}
          onAssumedNoonChange={onAssumedNoonChange}
          onResolvePlace={onResolvePlace}
          onGeocoderUnavailable={onGeocoderUnavailable}
        />
      ))}

      <button type="submit" disabled={loading} className={cn(primaryButtonClass(), 'w-full sm:w-auto')}>
        {loading ? t('page.loading') : t('page.submit')}
      </button>
    </form>
  );
}
