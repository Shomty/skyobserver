import { getField } from '../../config/fields';
import { isPlaceFieldId, type FieldId, type PlaceResolution } from '../../types';
import { DateField } from './DateField';
import { SelectField } from './SelectField';
import { TextAreaField } from './TextAreaField';
import { TextField } from './TextField';
import { TimeField } from './TimeField';
import { PlaceField } from './PlaceField';

interface Props {
  id: FieldId;
  value: string;
  error?: string;
  required?: boolean;
  assumedNoon?: boolean;
  resolvedPlace?: PlaceResolution;
  onChange: (value: string) => void;
  onBlur: () => void;
  onAssumedNoonChange?: (assumed: boolean) => void;
  onResolvePlace?: (place: PlaceResolution) => void;
  onGeocoderUnavailable?: (unavailable: boolean) => void;
}

export function FieldRenderer({
  id,
  value,
  error,
  required,
  assumedNoon,
  resolvedPlace,
  onChange,
  onBlur,
  onAssumedNoonChange,
  onResolvePlace,
  onGeocoderUnavailable,
}: Props) {
  const def = getField(id);

  if (def.kind === 'select') {
    return (
      <SelectField
        def={def}
        value={value}
        error={error}
        required={required}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }
  if (def.kind === 'date') {
    return (
      <DateField
        def={def}
        value={value}
        error={error}
        required={required}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }
  if (def.kind === 'time') {
    return (
      <TimeField
        def={def}
        value={value}
        error={error}
        required={required}
        assumedNoon={Boolean(assumedNoon)}
        onChange={onChange}
        onBlur={onBlur}
        onAssumedNoonChange={onAssumedNoonChange ?? (() => {})}
      />
    );
  }
  if (def.kind === 'place' && isPlaceFieldId(id)) {
    return (
      <PlaceField
        def={def}
        value={value}
        error={error}
        required={required}
        resolved={resolvedPlace}
        onChange={onChange}
        onBlur={onBlur}
        onResolve={onResolvePlace ?? (() => {})}
        onGeocoderUnavailable={onGeocoderUnavailable ?? (() => {})}
      />
    );
  }
  if (def.kind === 'textarea') {
    return (
      <TextAreaField
        def={def}
        value={value}
        error={error}
        required={required}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }
  if (def.kind === 'number') {
    return (
      <TextField
        def={{ ...def, inputMode: 'numeric' }}
        value={value}
        error={error}
        required={required}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }

  return (
    <TextField
      def={def}
      value={value}
      error={error}
      required={required}
      onChange={onChange}
      onBlur={onBlur}
    />
  );
}
