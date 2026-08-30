const exerciseSlugOverrides: Record<string, string> = {
  'open-book': 'open-book-stretch',
};

export const getExerciseSlug = (exerciseId: string) => exerciseSlugOverrides[exerciseId] ?? exerciseId;
export const getExercisePath = (exerciseId: string) => `/exercises/${getExerciseSlug(exerciseId)}/`;
