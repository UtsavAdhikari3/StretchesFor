import { catalog } from './catalog';
import { manualCatalog } from './manualCatalog';
import { defaultLocale, type Locale } from './config';

export { defaultLocale, getLocaleFromPath, isLocale, localeInfo, localePath, locales, stripLocale, switchLocalePath } from './config';
export type { Locale } from './config';

export function t(locale: Locale, source: string): string {
  if (locale === 'en' || !source || source === 'stretchesfor') return source;
  return manualCatalog[locale][source] ?? catalog[locale][source] ?? source;
}

export function formatTranslation(locale: Locale, source: string, values: Record<string, string | number>): string {
  let translated = t(locale, source);
  for (const [key, value] of Object.entries(values)) translated = translated.replaceAll(`{${key}}`, String(value));
  return translated;
}

export function translateList(locale: Locale, values: string[]): string[] {
  return values.map((value) => t(locale, value));
}

export function translateRecord<T extends object>(locale: Locale, value: T, skip = new Set<string>()): T {
  if (locale === defaultLocale) return value;
  const visit = (input: unknown, key = ''): unknown => {
    if (skip.has(key)) return input;
    if (typeof input === 'string') return t(locale, input);
    if (Array.isArray(input)) return input.map((item) => visit(item, key));
    if (input && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([childKey, child]) => [childKey, visit(child, childKey)]));
    }
    return input;
  };
  return visit(value) as T;
}

export const contentIdentityFields = new Set([
  'id', 'regionId', 'routineId', 'exerciseIds', 'patternId', 'slug', 'url', 'action',
  'sourceRef', 'localAsset', 'sides', 'points', 'seconds', 'bilateral', 'critical', 'kind',
]);
