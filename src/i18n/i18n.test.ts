import { describe, expect, it } from 'vitest';
import { exercises } from '../data/exercises';
import { localizeExercise } from './content';
import { localeInfo, localePath, locales, switchLocalePath, t } from './index';

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
});

