interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Off-screen honeypot — not display:none, skipped in tab order, hidden from AT. */
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
      <label htmlFor="gift-website">Website</label>
      <input
        id="gift-website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
