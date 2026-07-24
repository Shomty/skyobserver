import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'soulblueprint:lazy-reload';

function isDynamicImportFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  );
}

/**
 * React.lazy wrapper that recovers from stale Vite chunk URLs by reloading
 * once per session when a dynamic import fails to fetch.
 */
export function lazyWithReload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        // ignore storage failures
      }
      return mod;
    } catch (error) {
      if (typeof window !== 'undefined' && isDynamicImportFailure(error)) {
        let alreadyReloaded = false;
        try {
          alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1';
        } catch {
          // ignore storage failures
        }
        if (!alreadyReloaded) {
          try {
            sessionStorage.setItem(RELOAD_KEY, '1');
          } catch {
            // ignore storage failures
          }
          window.location.reload();
          // Keep Suspense pending until the reload completes.
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}
