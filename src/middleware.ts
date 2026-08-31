import { defineMiddleware } from 'astro:middleware';
import { isLocale, localePath } from './i18n';
import { responseLocale, translateHtml } from './i18n/translateHtml';

const assetPattern = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp4|png|svg|txt|webmanifest|webp|xml)$/i;

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
  headers.set('content-language', responseLocale(pathname));
  return new Response(translateHtml(html, responseLocale(pathname)), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
