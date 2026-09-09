import { exercises } from '../data/exercises';
import { everydayRoutines, type RoutineContext } from '../data/everydayRoutines';
import { movementDetails, type Equipment, type Position } from '../data/everydayExercises';
import type { Exercise, Routine } from '../data/types';

export interface Preferences { region: string; context: RoutineContext; minutes: 3 | 5 | 10; positions: Position[]; equipment: Equipment[]; routineId?: string }
export function exerciseDuration(exercise: Exercise) {
  const { timing } = movementDetails(exercise);
  return timing.secondsPerSide * timing.sides + timing.setupSeconds;
}
export function buildRoutine(preferences: Preferences, eligible: boolean, allowedIds?: string[]) {
  const regionTemplates: Record<string, string> = { neck: 'neck-and-shoulders', shoulder: 'neck-and-shoulders', 'upper-back': 'desk-break', 'lower-back': 'back-after-sitting', hip: 'hips-and-legs', 'lower-abdomen-groin': 'hips-and-legs', knee: 'hips-and-legs', calf: 'hips-and-legs', ankle: 'hips-and-legs', foot: 'hips-and-legs', elbow: 'hands-and-wrists', wrist: 'hands-and-wrists' };
  const template = everydayRoutines.find(item => item.id === preferences.routineId)
    ?? everydayRoutines.find(item => item.regionId === preferences.region && item.context === preferences.context)
    ?? everydayRoutines.find(item => item.id === regionTemplates[preferences.region])
    ?? everydayRoutines.find(item => item.context === preferences.context)!;
  const contextTemplate = everydayRoutines.find(item => item.context === preferences.context);
  const orderedIds = [...new Set([...(contextTemplate?.exerciseIds ?? []), ...template.exerciseIds, ...template.alternatives])];
  const relevantIds = new Set([...template.exerciseIds, ...template.alternatives]);
  const pool = eligible ? exercises.filter(exercise => {
    const details = movementDetails(exercise);
    return (!allowedIds || allowedIds.includes(exercise.id)) && details.positions.some(p => preferences.positions.includes(p))
      && details.equipment.every(e => preferences.equipment.includes(e))
      && (allowedIds?.includes(exercise.id) || details.targetAreas.includes(preferences.region) || relevantIds.has(exercise.id));
  }).sort((a, b) => {
    const rank = (exercise: Exercise) => (movementDetails(exercise).targetAreas.includes(preferences.region) ? 0 : 100)
      + (orderedIds.includes(exercise.id) ? orderedIds.indexOf(exercise.id) : 50);
    return rank(a) - rank(b) || a.id.localeCompare(b.id);
  }) : [];
  const selected: Exercise[] = [];
  let seconds = 0;
  for (const exercise of pool) {
    const duration = exerciseDuration(exercise);
    if (seconds + duration > preferences.minutes * 60) continue;
    selected.push(exercise);
    seconds += duration;
  }
  const routine: Routine = { id: 'personal-routine', regionId: preferences.region, name: template.name, description: template.description, exerciseIds: selected.map(e => e.id) };
  return { routine, exercises: selected, seconds, shorter: seconds < preferences.minutes * 60 - 30, template };
}
