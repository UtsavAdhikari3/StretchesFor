export const locales = ['en', 'es', 'fr', 'de', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeInfo: Record<Locale, { label: string; htmlLang: string; speechLang: string; ogLocale: string }> = {
  en: { label: 'English', htmlLang: 'en', speechLang: 'en-US', ogLocale: 'en_US' },
  es: { label: 'Español', htmlLang: 'es', speechLang: 'es-ES', ogLocale: 'es_ES' },
  fr: { label: 'Français', htmlLang: 'fr', speechLang: 'fr-FR', ogLocale: 'fr_FR' },
  de: { label: 'Deutsch', htmlLang: 'de', speechLang: 'de-DE', ogLocale: 'de_DE' },
  pt: { label: 'Português', htmlLang: 'pt', speechLang: 'pt-PT', ogLocale: 'pt_PT' },
};

export function isLocale(value?: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return isLocale(segment) ? segment : defaultLocale;
}

export function stripLocale(pathname: string): string {
  const parts = pathname.split('/');
  if (isLocale(parts[1])) parts.splice(1, 1);
  const result = parts.join('/') || '/';
  return result.startsWith('/') ? result : `/${result}`;
}

export function localePath(locale: Locale, href: string): string {
  if (!href || /^(?:[a-z]+:|\/\/|#)/i.test(href)) return href;
  const url = new URL(href, 'https://stretchesfor.local');
  const pathname = stripLocale(url.pathname);
  const localized = `/${locale}${pathname === '/' ? '/' : pathname}`;
  return `${localized}${url.search}${url.hash}`;
}

export function switchLocalePath(pathname: string, locale: Locale, search = '', hash = ''): string {
  return localePath(locale, `${stripLocale(pathname)}${search}${hash}`);
}

