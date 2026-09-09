import { describe, expect, it } from 'vitest';
import { additionalBlueprints } from '../data/everydayExercises';
import { everydayRoutines } from '../data/everydayRoutines';
import { catalog } from './catalog';
import { manualCatalog } from './manualCatalog';
import { locales } from './index';
import { translateHtml } from './translateHtml';

describe('refresh translation coverage', () => {
  it('never translates indexing directives', () => {
    for (const locale of locales) expect(translateHtml('<meta name="robots" content="noindex, follow">', locale)).toContain('content="noindex, follow"');
  });
  it('contains every new exercise instruction and routine paragraph in all four translation catalogs', () => {
    const sources = [
      ...additionalBlueprints.flatMap(e => [e.name, e.direction, e.feltArea, e.dose, e.easier, ...e.instructions, ...e.mistakes]),
      ...everydayRoutines.flatMap(r => [r.name, r.description, r.introduction, r.preparation, r.afterward]),
      'Find my routine', 'Comfortable positions', 'What can you use?', 'Time available', 'Mostly stiffness or tightness',
      'Pain or discomfort', 'Show my routine', 'Start my routine', 'No movements fit these choices. Try another comfortable position or available support.',
    ];
    const missing = locales.filter(l => l !== 'en').flatMap(locale => sources.filter(source => !(manualCatalog[locale][source] ?? catalog[locale][source])).map(source => `${locale}: ${source}`));
    expect(missing).toEqual([]);
  });
});
