import { getLocaleFromPath, localePath, locales, t } from './index';

type Locale = (typeof locales)[number];

const assetPattern = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp4|png|svg|txt|webmanifest|webp|xml)$/i;
const structuredDataIdentityKeys = new Set(['@type', 'applicationCategory', 'priceCurrency']);

function localizeStructuredData(json: string, locale: Locale): string {
  const visit = (value: unknown, key = ''): unknown => {
    if (key === 'inLanguage') return locale;
    if (structuredDataIdentityKeys.has(key)) return value;
    if (typeof value === 'string') {
      if (value.startsWith('https://stretchesfor.com/')) {
        const url = new URL(value);
        url.pathname = localePath(locale, url.pathname);
        return url.toString();
      }
      if (/^(?:https?:|\d{4}-\d{2}-\d{2}|PT\d)/.test(value)) return value;
      return t(locale, value);
    }
    if (Array.isArray(value)) return value.map((item) => visit(item, key));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([childKey, child]) => [childKey, visit(child, childKey)]),
      );
    }
    return value;
  };

  return JSON.stringify(visit(JSON.parse(json)));
}

export function translateHtml(html: string, locale: Locale): string {
  let output = html.replace(/(<html\b[^>]*\blang=")[^"]*(")/i, `$1${locale}$2`);

  output = output.replace(
    /(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi,
    (match, open: string, json: string, close: string) => {
      try {
        return `${open}${localizeStructuredData(json, locale)}${close}`;
      } catch {
        return match;
      }
    },
  );

  const protectedBlocks: string[] = [];
  const protect = (block: string) => {
    const token = `__STRETCHESFOR_NO_TRANSLATE_${protectedBlocks.length}__`;
    protectedBlocks.push(block);
    return token;
  };

  // Executable code and literal examples must never pass through the phrase
  // catalog. JSON-LD has already been localized explicitly above.
  output = output.replace(/<(script|style|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, protect);
  output = output.replace(/<([a-z][\w-]*)\b[^>]*\btranslate="no"[^>]*>[\s\S]*?<\/\1>/gi, protect);

  output = output.replace(/>([^<>]+)</g, (match, text: string) => {
    const leading = text.match(/^\s*/)?.[0] ?? '';
    const trailing = text.match(/\s*$/)?.[0] ?? '';
    const source = text.trim();
    return source ? `>${leading}${t(locale, source)}${trailing}<` : match;
  });

  output = output.replace(/\b(aria-label|content|placeholder|title|alt)="([^"]+)"/g, (match, attribute: string, source: string) => {
    if (attribute === 'content' && /^(?:https?:|\d|#|index,|width=|summary_)/i.test(source)) return match;
    return `${attribute}="${t(locale, source)}"`;
  });

  output = output.replace(/\bhref="(\/(?!\/)[^"]*)"/g, (match, href: string) => {
    if (assetPattern.test(href.split(/[?#]/)[0]) || href.startsWith('/_')) return match;
    return `href="${localePath(locale, href)}"`;
  });

  return output.replace(
    /__STRETCHESFOR_NO_TRANSLATE_(\d+)__/g,
    (_match, index: string) => protectedBlocks[Number(index)] ?? '',
  );
}

export function responseLocale(pathname: string): Locale {
  return getLocaleFromPath(pathname);
}
