import { en, type CopyKey } from './en';

/** Resolve a copy key; supports simple `{name}` interpolation. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const template = (en as Record<string, string>)[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`
  );
}

export function hasCopy(key: string): key is CopyKey {
  return key in en;
}
