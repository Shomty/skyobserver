import { describe, expect, it, vi } from 'vitest';
import { copyText, type ClipboardApi } from './useCopyToClipboard';

class FakeItem {
  constructor(public readonly items: Record<string, Blob>) {}
}
const ItemCtor = FakeItem as unknown as new (items: Record<string, Blob>) => ClipboardItem;

function makeClipboard(overrides: Partial<ClipboardApi> = {}): ClipboardApi {
  return {
    writeText: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('copyText', () => {
  it('writes plain and html when rich clipboard is available', async () => {
    const clipboard = makeClipboard();
    const ok = await copyText('**hi**', '<strong>hi</strong>', clipboard, ItemCtor);

    expect(ok).toBe(true);
    expect(clipboard.write).toHaveBeenCalledTimes(1);
    expect(clipboard.writeText).not.toHaveBeenCalled();
    const [items] = (clipboard.write as ReturnType<typeof vi.fn>).mock.calls[0];
    const item = items[0] as unknown as FakeItem;
    expect(Object.keys(item.items).sort()).toEqual(['text/html', 'text/plain']);
    expect(await item.items['text/plain'].text()).toBe('**hi**');
    expect(await item.items['text/html'].text()).toBe('<strong>hi</strong>');
  });

  it('falls back to writeText when ClipboardItem is unavailable', async () => {
    const clipboard = makeClipboard();
    const ok = await copyText('hi', '<p>hi</p>', clipboard, undefined);

    expect(ok).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledWith('hi');
    expect(clipboard.write).not.toHaveBeenCalled();
  });

  it('uses writeText when no html is given', async () => {
    const clipboard = makeClipboard();
    await copyText('hi', undefined, clipboard, ItemCtor);
    expect(clipboard.writeText).toHaveBeenCalledWith('hi');
  });

  it('returns false when the write rejects', async () => {
    const clipboard = makeClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    expect(await copyText('hi', undefined, clipboard, undefined)).toBe(false);
  });

  it('returns false when no clipboard exists', async () => {
    expect(await copyText('hi', undefined, undefined, undefined)).toBe(false);
  });
});
