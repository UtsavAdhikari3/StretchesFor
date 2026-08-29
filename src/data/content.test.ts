import { describe, expect, it } from 'vitest';
import { patterns, regions } from './content';
import { exercises, routines } from './exercises';
import { bodyRegions } from './bodyRegions';

describe('content graph integrity', () => {
  it('covers every planned body region with 2 to 4 patterns', () => {
    expect(regions).toHaveLength(14);
    for (const region of regions) {
      const count = patterns.filter((pattern) => pattern.regionId === region.id).length;
      expect(count, region.name).toBeGreaterThanOrEqual(2);
      expect(count, region.name).toBeLessThanOrEqual(4);
    }
  });
  it('uses unique slugs in every collection', () => {
    for (const collection of [regions, patterns, routines, exercises, bodyRegions]) {
      const ids = collection.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('defines all 24 selectable model hotspots and an explicit action for every pattern', () => {
    expect(bodyRegions).toHaveLength(24);
    expect(patterns.every((pattern) => ['exercise', 'professional-evaluation', 'urgent-care'].includes(pattern.action))).toBe(true);
  });
  it('keeps pattern and routine references valid', () => {
    for (const pattern of patterns) {
      expect(regions.some((region) => region.id === pattern.regionId)).toBe(true);
      expect(pattern.sources.length).toBeGreaterThan(0);
      if (pattern.routineId) expect(routines.some((routine) => routine.id === pattern.routineId)).toBe(true);
    }
    for (const routine of routines) {
      expect(regions.some((region) => region.id === routine.regionId)).toBe(true);
      expect(routine.exerciseIds.length).toBeGreaterThanOrEqual(3);
      for (const id of routine.exerciseIds) expect(exercises.some((exercise) => exercise.id === id)).toBe(true);
    }
  });
  it('includes complete exercise guidance', () => {
    expect(exercises).toHaveLength(28);
    for (const exercise of exercises) {
      expect(exercise.instructions.length).toBeGreaterThanOrEqual(3);
      expect(exercise.mistakes.length).toBeGreaterThanOrEqual(2);
      expect(exercise.seconds).toBeGreaterThan(0);
      expect(exercise.easier.length).toBeGreaterThan(0);
      expect(exercise.stopConditions.length).toBeGreaterThan(0);
    }
  });
});
