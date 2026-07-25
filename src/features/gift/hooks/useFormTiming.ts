import { useRef } from 'react';

/** Records mount time; reports elapsed seconds for bot mitigation. */
export function useFormTiming() {
  const mountedAt = useRef(Date.now());

  return {
    elapsedSeconds: () => Math.max(0, Math.round((Date.now() - mountedAt.current) / 1000)),
  };
}
