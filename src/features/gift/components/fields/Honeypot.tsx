interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Off-screen honeypot — not display:none, skipped in tab order, hidden from AT.
 *
 * The field is deliberately named/annotated so password managers and browser
 * autofill leave it alone: a manager filling a hidden "website" field used to
 * make real submissions look like bot traffic. Bots fill every input they find,
 * so a neutral name costs nothing.
 */
export function Honeypot({ value, onChange }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label htmlFor="gift-hp-ref">Leave this field empty</label>
      <input
        id="gift-hp-ref"
        name="hp-ref"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        data-form-type="other"
        data-lpignore="true"
        data-bwignore="true"
        data-1p-ignore=""
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
