import { describe, expect, it } from 'vitest';
import { createGuideHref, parseGuideState } from './guideFlow';

describe('guide flow URLs', () => {
  it('serializes the selected region, pattern, question progress, and answers', () => {
    expect(createGuideHref('questions', {
      region: 'lower-back',
      pattern: 'nonspecific-lower-back',
      question: 2,
      answers: { emergency: 'no', trauma: 'unsure' },
    })).toBe('/guide/screen/?region=lower-back&pattern=nonspecific-lower-back&question=2&emergency=no&trauma=unsure');
  });

  it('round-trips routine direct-entry state', () => {
    const href = createGuideHref('routine', {
      region: 'upper-back',
      pattern: 'thoracic-stiffness',
      exercise: 'open-book',
      entry: 'exercise',
    });

    expect(parseGuideState(new URL(href, 'https://stretchesfor.com').search)).toEqual({
      region: 'upper-back',
      pattern: 'thoracic-stiffness',
      question: undefined,
      answers: {},
      exercise: 'open-book',
      entry: 'exercise',
    });
  });

  it('preserves the active locale throughout the guide', () => {
    expect(createGuideHref('result', {
      region: 'lower-back',
      pattern: 'nonspecific-lower-back',
      answers: { emergency: 'no', match: 'yes' },
    }, 'fr')).toBe('/fr/guide/result/?region=lower-back&pattern=nonspecific-lower-back&emergency=no&match=yes');

    expect(createGuideHref('routine', {
      region: 'lower-back',
      pattern: 'nonspecific-lower-back',
      exercise: 'pelvic-tilt',
    }, 'pt')).toBe('/pt/guide/move/?region=lower-back&pattern=nonspecific-lower-back&exercise=pelvic-tilt');
  });

  it('ignores invalid progress values instead of creating broken state', () => {
    expect(parseGuideState('?question=-2&emergency=maybe&trauma=yes')).toMatchObject({
      question: undefined,
      answers: { trauma: 'yes' },
    });
  });
});
