import { describe, expect, it } from 'vitest';
import { conditions, getConditionContext, getExerciseSeo } from './seoContent';
import { exercises } from './exercises';

describe('SEO content graph', () => {
  it('uses unique condition slugs and includes the requested landing pages', () => {
    expect(new Set(conditions.map((condition) => condition.slug)).size).toBe(conditions.length);
    for (const slug of [
      'stretches-for-lower-back-pain',
      'stretches-for-knee-pain',
      'stretches-for-neck-pain',
      'stretches-for-plantar-fasciitis',
      'stretches-for-shin-splints',
    ]) expect(conditions.some((condition) => condition.slug === slug)).toBe(true);
  });

  it('keeps condition relationships and exercise references valid', () => {
    for (const condition of conditions) {
      const context = getConditionContext(condition);
      expect(context.region, condition.slug).toBeDefined();
      expect(context.exercises, condition.slug).toHaveLength(condition.exerciseIds.length);
      expect(context.related, condition.slug).toHaveLength(condition.relatedSlugs.length);
      expect(condition.faqs.length).toBeGreaterThanOrEqual(4);
      expect(condition.redFlags.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('generates complete SEO context for every exercise', () => {
    for (const exercise of exercises) {
      const seo = getExerciseSeo(exercise.id);
      expect(seo?.region, exercise.id).toBeDefined();
      expect(seo?.routine, exercise.id).toBeDefined();
      expect(seo?.targets.length, exercise.id).toBeGreaterThan(0);
      expect(seo?.conditions.length, exercise.id).toBeGreaterThan(0);
      expect(seo?.relatedExercises.length, exercise.id).toBeGreaterThan(0);
    }
  });
});
