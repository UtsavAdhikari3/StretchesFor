import { exerciseBlueprints, routines } from './content';
import { exerciseSourceManifest } from './exerciseSources';
import type { Exercise } from './types';

const defaultStopConditions = [
  'Pain becomes sharp, spreading, or stronger',
  'New tingling, numbness, or weakness appears',
  'You feel dizzy, faint, or short of breath',
];

export const exercises: Exercise[] = exerciseBlueprints.map((exercise) => ({
  ...exercise,
  sourceRef: exerciseSourceManifest[exercise.id],
  expectedSensation: `A mild, controlled stretch or light effort around the ${exercise.feltArea.toLocaleLowerCase()}.`,
  stopConditions: defaultStopConditions,
}));

export { routines };

export const getExercise = (id: string) => exercises.find((exercise) => exercise.id === id);
