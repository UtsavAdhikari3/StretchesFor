const API_URL = 'https://oss.exercisedb.dev/api/v1/exercises';

export interface ExerciseDbExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  equipments: string[];
  instructions: string[];
}

export interface ExerciseDbPage {
  exercises: ExerciseDbExercise[];
  nextCursor?: string;
  hasNextPage: boolean;
}

export interface FetchExerciseOptions {
  limit?: number;
  cursor?: string;
  name?: string;
  signal?: AbortSignal;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: { nextCursor?: string; hasNextPage?: boolean };
}

const exerciseCache = new Map<string, ExerciseDbExercise>();
const requestCache = new Map<string, Promise<ExerciseDbPage>>();

function normaliseExercise(value: Partial<ExerciseDbExercise>): ExerciseDbExercise | undefined {
  if (!value.exerciseId || !value.name || !value.gifUrl) return undefined;
  return {
    exerciseId: value.exerciseId,
    name: value.name,
    gifUrl: value.gifUrl,
    bodyParts: value.bodyParts ?? [],
    targetMuscles: value.targetMuscles ?? [],
    secondaryMuscles: value.secondaryMuscles ?? [],
    equipments: value.equipments ?? [],
    instructions: value.instructions ?? [],
  };
}

async function request(url: URL, signal?: AbortSignal): Promise<ApiEnvelope<ExerciseDbExercise | ExerciseDbExercise[]>> {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
    if (!response.ok) return { success: false };
    return await response.json() as ApiEnvelope<ExerciseDbExercise | ExerciseDbExercise[]>;
  } catch {
    return { success: false };
  }
}

export function fetchExercises(options: FetchExerciseOptions = {}): Promise<ExerciseDbPage> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const url = new URL(API_URL);
  url.searchParams.set('limit', String(limit));
  if (options.cursor) url.searchParams.set('cursor', options.cursor);
  if (options.name) url.searchParams.set('name', options.name);
  const key = url.toString();
  const cached = requestCache.get(key);
  if (cached) return cached;

  const pending = request(url, options.signal).then((payload) => {
    const values = Array.isArray(payload.data) ? payload.data : [];
    const exercises = values.map(normaliseExercise).filter(Boolean) as ExerciseDbExercise[];
    for (const exercise of exercises) exerciseCache.set(exercise.exerciseId, exercise);
    return {
      exercises,
      nextCursor: payload.meta?.nextCursor,
      hasNextPage: payload.meta?.hasNextPage ?? false,
    };
  });
  requestCache.set(key, pending);
  return pending;
}

export async function findExerciseById(exerciseId: string, signal?: AbortSignal): Promise<ExerciseDbExercise | undefined> {
  const cached = exerciseCache.get(exerciseId);
  if (cached) return cached;
  const payload = await request(new URL(`${API_URL}/${encodeURIComponent(exerciseId)}`), signal);
  const value = Array.isArray(payload.data) ? payload.data[0] : payload.data;
  const exercise = value ? normaliseExercise(value) : undefined;
  if (exercise) exerciseCache.set(exercise.exerciseId, exercise);
  return exercise;
}

export async function findExerciseByName(name: string, signal?: AbortSignal): Promise<ExerciseDbExercise | undefined> {
  const normalisedName = name.trim().toLocaleLowerCase();
  const cached = [...exerciseCache.values()].find((exercise) => exercise.name.toLocaleLowerCase() === normalisedName);
  if (cached) return cached;
  const page = await fetchExercises({ name, limit: 20, signal });
  return page.exercises.find((exercise) => exercise.name.toLocaleLowerCase() === normalisedName);
}

export function clearExerciseDbCacheForTests() {
  exerciseCache.clear();
  requestCache.clear();
}
