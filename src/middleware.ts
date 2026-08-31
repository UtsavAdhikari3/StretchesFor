import { defineMiddleware } from 'astro:middleware';
import { getLocaleFromPath, isLocale, localePath, locales, t } from './i18n';

const assetPattern = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp4|png|svg|txt|webmanifest|webp|xml)$/i;

function translateHtml(html: string, locale: (typeof locales)[number]): string {
  let output = html.replace(/(<html\b[^>]*\blang=")[^"]*(")/i, `$1${locale}$2`);
  const protectedBlocks: string[] = [];
  output = output.replace(/<([a-z][\w-]*)\b[^>]*\btranslate="no"[^>]*>[\s\S]*?<\/\1>/gi, (block) => {
    const token = `__STRETCHESFOR_NO_TRANSLATE_${protectedBlocks.length}__`;
    protectedBlocks.push(block);
    return token;
  });

  output = output.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, open: string, json: string, close: string) => {
    try {
      const visit = (value: unknown, key = ''): unknown => {
        if (key === 'inLanguage') return locale;
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
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, visit(child, childKey)]));
        return value;
      };
      return `${open}${JSON.stringify(visit(JSON.parse(json)))}${close}`;
    } catch {
      return match;
    }
  });

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

  return output.replace(/__STRETCHESFOR_NO_TRANSLATE_(\d+)__/g, (_match, index: string) => protectedBlocks[Number(index)] ?? '');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  if (!isLocale(firstSegment) && !assetPattern.test(pathname) && !pathname.startsWith('/_')) {
    return context.redirect(localePath('en', `${pathname}${context.url.search}`), 302);
  }

  const response = await next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!isLocale(firstSegment) || !contentType.includes('text/html')) return response;

  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('content-language', getLocaleFromPath(pathname));
  return new Response(translateHtml(html, getLocaleFromPath(pathname)), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
