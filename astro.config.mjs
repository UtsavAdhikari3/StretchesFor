// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://stretchesfor.com',
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'pt'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true },
  },
  integrations: [react(), sitemap({ filter: (page) => /^https:\/\/stretchesfor\.com\/(?:en|es|fr|de|pt)\//.test(page) && !page.includes('/stretches/') && !page.includes('/guide/') })],
  vite: {
    // React's development JSX runtime exports jsxDEV, while its production
    // runtime intentionally does not. Keep Astro build and dev dependency
    // caches separate so a production build cannot poison a running dev app.
    cacheDir: process.env.NODE_ENV === 'production'
      ? 'node_modules/.vite/production'
      : 'node_modules/.vite/development',
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  },
});
