import { exerciseBlueprints, routines } from './content';
import type { Exercise } from './types';

// Exercise selection and all safety guidance are curated locally. ExerciseDB is
// only asked for media matching these fixed IDs after a routine is opened.
const externalExerciseIds: Partial<Record<string, string>> = {
  // IDs are added only after the GIF is checked against our local movement.
  // Leaving an exercise unmapped intentionally triggers the unavailable state.
  'neck-turn': 'x2chWLO',
  'pelvic-tilt': 'NKJ8o6x',
  'figure-four': 'yn0LjwL',
  'wall-calf': 'PzNxakt',
  'ankle-circles': 'uL9CsKm',
  'wrist-flexor': 'UtmIqcI',
  'wrist-circles': '2zNKRUB',
};

const defaultStopConditions = [
  'Pain becomes sharp, spreading, or stronger',
  'New tingling, numbness, or weakness appears',
  'You feel dizzy, faint, or short of breath',
];

export const exercises: Exercise[] = exerciseBlueprints.map((exercise) => ({
  ...exercise,
  externalExerciseId: externalExerciseIds[exercise.id],
  expectedSensation: `A mild, controlled stretch or light effort around the ${exercise.feltArea.toLocaleLowerCase()}.`,
  stopConditions: defaultStopConditions,
}));

export { routines };

export const getExercise = (id: string) => exercises.find((exercise) => exercise.id === id);
