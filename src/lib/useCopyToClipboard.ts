import { useCallback, useEffect, useRef, useState } from 'react';
import { debugWarn } from './debug';

/** Minimal clipboard surface so the core logic can be tested without a DOM. */
export interface ClipboardApi {
  writeText: (text: string) => Promise<void>;
  write?: (items: ClipboardItem[]) => Promise<void>;
}

type ClipboardItemCtor = new (items: Record<string, Blob>) => ClipboardItem;

/**
 * Copies `plain` to the clipboard. When `html` is provided and rich clipboard
 * writes are supported, both text/plain and text/html are written so pasting
 * into rich editors keeps formatting. Returns true on success.
 */
export async function copyText(
  plain: string,
  html: string | undefined,
  clipboard: ClipboardApi | undefined,
  ItemCtor: ClipboardItemCtor | undefined,
): Promise<boolean> {
  if (!clipboard) {
    debugWarn('clipboard', 'Clipboard API unavailable');
    return false;
  }
  try {
    if (html && clipboard.write && ItemCtor) {
      const item = new ItemCtor({
        'text/plain': new Blob([plain], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      });
      await clipboard.write([item]);
    } else {
      await clipboard.writeText(plain);
    }
    return true;
  } catch (err) {
    debugWarn('clipboard', 'Copy failed', err);
    return false;
  }
}

export interface UseCopyToClipboard {
  copied: boolean;
  copy: (plain: string, html?: string) => Promise<boolean>;
}

export function useCopyToClipboard(resetMs = 2000): UseCopyToClipboard {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copy = useCallback(async (plain: string, html?: string) => {
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    const ItemCtor = typeof ClipboardItem !== 'undefined' ? ClipboardItem : undefined;
    const ok = await copyText(plain, html, clipboard, ItemCtor);
    if (ok) {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);
    }
    return ok;
  }, [resetMs]);

  return { copied, copy };
}
