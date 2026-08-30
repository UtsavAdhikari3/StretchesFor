import type { ExerciseProvider, ProviderExercise } from './index';

const API_URL = 'https://oss.exercisedb.dev/api/v1/exercises';
const cache = new Map<string, Promise<ProviderExercise | null>>();

interface ExerciseDbPayload {
  exerciseId?: unknown;
  name?: unknown;
  gifUrl?: unknown;
  instructions?: unknown;
  targetMuscles?: unknown;
}

export const exerciseDbProvider: ExerciseProvider = {
  getExercise(id, signal) {
    if (signal?.aborted) return Promise.reject(abortError());
    const cached = cache.get(id);
    if (cached) return cached;

    const pending = request(id, signal).catch((error: unknown) => {
      if (isAbortError(error)) {
        cache.delete(id);
        throw error;
      }
      return null;
    });
    cache.set(id, pending);
    return pending;
  },
};

async function request(id: string, signal?: AbortSignal): Promise<ProviderExercise | null> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) return null;

  const envelope = await response.json() as { data?: ExerciseDbPayload | ExerciseDbPayload[] } | ExerciseDbPayload;
  let value: ExerciseDbPayload | undefined;
  if ('data' in envelope) {
    value = Array.isArray(envelope.data) ? envelope.data[0] : envelope.data;
  } else {
    value = envelope as ExerciseDbPayload;
  }
  return normalise(value, id);
}

function normalise(value: ExerciseDbPayload | undefined, requestedId: string): ProviderExercise | null {
  if (!value || value.exerciseId !== requestedId || typeof value.name !== 'string' || !isHttpUrl(value.gifUrl)) return null;
  return {
    id: requestedId,
    name: value.name.trim(),
    instructions: stringArray(value.instructions),
    targetMuscles: stringArray(value.targetMuscles),
    media: {
      type: 'gif',
      url: value.gifUrl,
      provider: 'exerciseDb',
    },
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function clearExerciseDbCacheForTests() {
  cache.clear();
}
