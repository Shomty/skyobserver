/// <reference types="vite/client" />

const DEBUG_STORAGE_KEY = 'soulblueprint:debug';

type DebugMethod = 'log' | 'warn' | 'error';

declare global {
  interface Window {
    __SOULBLUEPRINT_DEBUG__?: {
      enable: () => void;
      disable: () => void;
      isEnabled: () => boolean;
    };
  }
}

function readStoredDebugFlag(): boolean | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(DEBUG_STORAGE_KEY);
    if (stored === null) return null;
    return stored === '1' || stored === 'true';
  } catch {
    return null;
  }
}

export function isDebugEnabled(): boolean {
  const stored = readStoredDebugFlag();
  if (stored !== null) return stored;
  return import.meta.env.DEV;
}

function emit(method: DebugMethod, scope: string, message: string, details?: unknown) {
  if (method !== 'error' && !isDebugEnabled()) return;

  const prefix = `${new Date().toISOString()} [SoulBlueprint:${scope}] ${message}`;
  if (details === undefined) {
    console[method](prefix);
    return;
  }

  console[method](prefix, details);
}

export function debugLog(scope: string, message: string, details?: unknown) {
  emit('log', scope, message, details);
}

export function debugWarn(scope: string, message: string, details?: unknown) {
  emit('warn', scope, message, details);
}

export function debugError(scope: string, message: string, details?: unknown) {
  emit('error', scope, message, details);
}

export function installDebugConsole() {
  if (typeof window === 'undefined' || window.__SOULBLUEPRINT_DEBUG__) return;

  window.__SOULBLUEPRINT_DEBUG__ = {
    enable: () => {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, '1');
      console.log(`${new Date().toISOString()} [SoulBlueprint:debug] Debug logging enabled`);
    },
    disable: () => {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, '0');
      console.log(`${new Date().toISOString()} [SoulBlueprint:debug] Debug logging disabled`);
    },
    isEnabled: () => isDebugEnabled(),
  };

  debugLog('debug', 'Debug console ready', {
    enabled: isDebugEnabled(),
    usage: 'window.__SOULBLUEPRINT_DEBUG__.enable() / disable()',
  });
}
