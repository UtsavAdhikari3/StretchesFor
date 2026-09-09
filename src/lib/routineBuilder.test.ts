import { describe, expect, it } from 'vitest';
import { buildRoutine, exerciseDuration, type Preferences } from './routineBuilder';
import { additionalBlueprints, movementDetails } from '../data/everydayExercises';
import { everydayRoutines } from '../data/everydayRoutines';
import { exercises } from '../data/exercises';
const preferences: Preferences = { region: 'neck', minutes: 5, positions: ['seated'], equipment: ['chair'], context: 'general' };
describe('routine selection', () => {
  it('never selects movements before safety eligibility', () => {
    expect(buildRoutine(preferences, false).exercises).toEqual([]);
  });
  it('respects positions, equipment, and the actual duration including both sides', () => {
    for (const minutes of [3, 5, 10] as const) {
      const result = buildRoutine({ ...preferences, minutes }, true);
      expect(result.seconds).toBeLessThanOrEqual(minutes * 60);
      expect(result.seconds).toBe(result.exercises.reduce((sum, e) => sum + exerciseDuration(e), 0));
      for (const e of result.exercises) {
        expect(movementDetails(e).positions).toContain('seated');
        expect(movementDetails(e).equipment.every(item => item === 'chair')).toBe(true);
      }
    }
  });
  it('keeps pain recommendations inside the screened routine', () => {
    const result = buildRoutine({ ...preferences, region: 'hip', positions: ['floor'], equipment: [] }, true, ['figure-four']);
    expect(result.routine.exerciseIds).toEqual(['figure-four']);
  });
  it('returns an actionable empty result when positions do not fit', () => {
    expect(buildRoutine({ ...preferences, positions: [] }, true).exercises).toEqual([]);
  });
  it('changes ordering for desk and morning contexts and changes candidates by area', () => {
    const base = { ...preferences, region: 'upper-back', positions: ['seated', 'standing'] as Preferences['positions'], equipment: ['chair', 'wall'] as Preferences['equipment'], minutes: 3 as const };
    expect(buildRoutine({ ...base, context: 'desk' }, true).routine.exerciseIds).not.toEqual(buildRoutine({ ...base, context: 'morning' }, true).routine.exerciseIds);
    expect(buildRoutine({ ...base, region: 'wrist' }, true).routine.exerciseIds).not.toEqual(buildRoutine({ ...base, region: 'hip' }, true).routine.exerciseIds);
  });
  it('has complete new content, integer timers, and valid routine references', () => {
    expect(additionalBlueprints).toHaveLength(20);
    expect(everydayRoutines).toHaveLength(6);
    for (const e of exercises) expect(Number.isInteger(movementDetails(e).timing.secondsPerSide), e.id).toBe(true);
    for (const e of additionalBlueprints) expect(movementDetails(e).sources.length, e.id).toBeGreaterThan(0);
    for (const routine of everydayRoutines) for (const id of [...routine.exerciseIds, ...routine.alternatives]) expect(exercises.some(e => e.id === id), id).toBe(true);
  });
});
