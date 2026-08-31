import { describe, expect, it } from 'vitest';
import { exercises } from '../data/exercises';
import { localizeExercise } from './content';
import { localeInfo, localePath, locales, switchLocalePath, t } from './index';
import { translateHtml } from './translateHtml';

describe('internationalization', () => {
  it('defines every requested prefixed locale and speech language', () => {
    expect(locales).toEqual(['en', 'es', 'fr', 'de', 'pt']);
    expect(Object.values(localeInfo).map((locale) => locale.speechLang)).toEqual(['en-US', 'es-ES', 'fr-FR', 'de-DE', 'pt-PT']);
  });

  it('keeps internal navigation under the active locale', () => {
    expect(localePath('fr', '/guide/move/?exercise=chin-tuck#timer')).toBe('/fr/guide/move/?exercise=chin-tuck#timer');
    expect(switchLocalePath('/es/exercises/chin-tuck/', 'de', '?voice=on')).toBe('/de/exercises/chin-tuck/?voice=on');
  });

  it('contains localized UI, SEO, and safety copy for every non-English locale', () => {
    for (const locale of locales.filter((value) => value !== 'en')) {
      expect(t(locale, 'Start stretching')).not.toBe('Start stretching');
      expect(t(locale, 'Medical disclaimer')).not.toBe('Medical disclaimer');
      expect(t(locale, 'Stop if pain worsens.')).not.toBe('Stop if pain worsens.');
    }
  });

  it('localizes all spoken exercise instruction sets', () => {
    for (const locale of locales.filter((value) => value !== 'en')) {
      for (const exercise of exercises) {
        const localized = localizeExercise(locale, exercise);
        expect(localized.instructions, `${locale}/${exercise.id}`).toHaveLength(exercise.instructions.length);
        expect(localized.instructions.join(' '), `${locale}/${exercise.id}`).not.toBe(exercise.instructions.join(' '));
        expect(localized.stopConditions.join(' '), `${locale}/${exercise.id}/safety`).not.toBe(exercise.stopConditions.join(' '));
      }
    }
  });

  it('translates document copy without modifying executable code', () => {
    const source = `<!doctype html><html lang="en"><head>
      <meta name="description" content="Start stretching">
      <script>const theme = 'light'; document.querySelector('[data-language-select]')?.addEventListener('change', (event) => event.currentTarget.value);</script>
      <script type="application/ld+json">{"@type":"WebApplication","name":"Start stretching","inLanguage":"en","url":"https://stretchesfor.com/about/","applicationCategory":"HealthApplication","offers":{"@type":"Offer","priceCurrency":"USD"}}</script>
      <style>.light { color: red; }</style>
    </head><body><p>Start stretching</p><code>const theme = 'light';</code></body></html>`;

    const translated = translateHtml(source, 'fr');
    const localizedCallToAction = t('fr', 'Start stretching');

    expect(translated).toContain('<html lang="fr">');
    expect(translated).toContain(`<p>${localizedCallToAction}</p>`);
    expect(translated).toContain("const theme = 'light'");
    expect(translated).toContain('event.currentTarget.value');
    expect(translated).toContain("<style>.light { color: red; }</style>");
    expect(translated).toContain("<code>const theme = 'light';</code>");

    const json = translated.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(JSON.parse(json ?? '')).toMatchObject({
      '@type': 'WebApplication',
      name: localizedCallToAction,
      inLanguage: 'fr',
      url: 'https://stretchesfor.com/fr/about/',
      applicationCategory: 'HealthApplication',
      offers: { '@type': 'Offer', priceCurrency: 'USD' },
    });
  });
});
