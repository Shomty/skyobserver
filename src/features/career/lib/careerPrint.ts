import { debugError, debugWarn } from '../../../lib/debug';

const PAGEDJS_ROOT_ID = 'career-pagedjs-root';

function removeExistingPagedRoot(): void {
  document.getElementById(PAGEDJS_ROOT_ID)?.remove();
}

/** Un-paginated degrade path: print the source tree directly, relying on the browser's own page breaks. */
function printRawFallback(source: HTMLElement): void {
  source.classList.remove('hidden');
  source.classList.add('print:block', 'print-root');

  const cleanup = () => {
    source.classList.add('hidden');
    source.classList.remove('print:block', 'print-root');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  window.print();
}

/**
 * Paginates the career report (read from `sourceElementId`'s current HTML)
 * through Paged.js into real `@page` boxes — running header, page-number
 * footer, break-avoidance around cards — then triggers the browser print
 * dialog against the paginated result. Falls back to an un-paginated direct
 * print of the source tree if the lazy `pagedjs` import or pagination fails.
 *
 * `css` is the print stylesheet's raw text (import it with a `?raw` suffix),
 * not a URL — Paged.js's `Polisher.add()` treats a plain string argument as a
 * URL to `fetch()`, which is an extra network round-trip Vite's dev/build
 * asset-URL resolution doesn't reliably survive for this. Passing `{ key:
 * cssText }` instead makes Polisher resolve the CSS text directly, no fetch
 * involved, so the `@page`/break rules are guaranteed to actually be present
 * when Paged.js computes styles during chunking.
 */
export async function paginateAndPrint(sourceElementId: string, css: string): Promise<void> {
  const source = document.getElementById(sourceElementId);
  if (!source) {
    debugError('career-print', 'Print source element not found', { sourceElementId });
    return;
  }

  const html = source.outerHTML;

  try {
    const { Previewer } = await import('pagedjs');

    removeExistingPagedRoot();

    const root = document.createElement('div');
    root.id = PAGEDJS_ROOT_ID;
    root.className = 'hidden print:block print-root';
    document.body.appendChild(root);

    await new Previewer().preview(html, [{ 'career-print.css': css }], root);

    const cleanup = () => {
      root.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.print();
  } catch (error) {
    debugWarn('career-print', 'Paged.js pagination failed, falling back to raw print', error);
    removeExistingPagedRoot();
    printRawFallback(source);
    throw error;
  }
}
