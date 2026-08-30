import type { ExerciseSourceReference } from '../../data/types';
import { exerciseDbProvider } from './exerciseDb';
import { resolveLocalCandidates } from './local';
import { wgerProvider } from './wger';

export interface ProviderExercise {
  id: string;
  name: string;
  instructions: string[];
  targetMuscles: string[];
  media: {
    type: 'video' | 'image' | 'gif';
    url: string;
    poster?: string;
    provider: 'wger' | 'exerciseDb' | 'local';
    license?: string;
    licenseUrl?: string;
    author?: string;
  };
}

export interface ExerciseProvider {
  getExercise(id: string, signal?: AbortSignal): Promise<ProviderExercise | null>;
}

export type CanPlayType = (type: string) => CanPlayTypeResult | '';

export interface ExerciseMediaResolver {
  resolveWgerCandidates(
    reference: ExerciseSourceReference,
    canPlayType: CanPlayType,
    signal?: AbortSignal,
  ): Promise<ProviderExercise[]>;
  resolveExerciseDbCandidate(
    reference: ExerciseSourceReference,
    signal?: AbortSignal,
  ): Promise<ProviderExercise | null>;
  resolveLocalCandidates(
    reference: ExerciseSourceReference,
    canPlayType: CanPlayType,
  ): ProviderExercise[];
}

export function createExerciseMediaResolver(
  wger: ExerciseProvider = wgerProvider,
  exerciseDb: ExerciseProvider = exerciseDbProvider,
  localMediaBaseUrl?: string,
): ExerciseMediaResolver {
  return {
    async resolveWgerCandidates(reference, canPlayType, signal) {
      if (!reference.wgerId) return [];
      const exercise = await wger.getExercise(reference.wgerId, signal);
      if (!isExactIdentity(exercise, reference.wgerId, reference.acceptedExternalNames.wger)) return [];

      if (exercise.media.type === 'image') return [exercise];
      if (exercise.media.type !== 'video') return [];

      const candidates: ProviderExercise[] = [];
      const mimeType = videoMimeType(exercise.media.url);
      if (mimeType && canPlayType(mimeType)) candidates.push(exercise);
      if (exercise.media.poster) {
        candidates.push({
          ...exercise,
          media: {
            ...exercise.media,
            type: 'image',
            url: exercise.media.poster,
            poster: undefined,
          },
        });
      }
      return candidates;
    },

    async resolveExerciseDbCandidate(reference, signal) {
      if (!reference.exerciseDbId) return null;
      const exercise = await exerciseDb.getExercise(reference.exerciseDbId, signal);
      return isExactIdentity(exercise, reference.exerciseDbId, reference.acceptedExternalNames.exerciseDb)
        ? exercise
        : null;
    },

    resolveLocalCandidates(reference, canPlayType) {
      return resolveLocalCandidates(reference, canPlayType, localMediaBaseUrl);
    },
  };
}

function isExactIdentity(
  exercise: ProviderExercise | null,
  id: string,
  acceptedNames: string[],
): exercise is ProviderExercise {
  if (!exercise || exercise.id !== id || acceptedNames.length === 0) return false;
  const actual = normaliseName(exercise.name);
  return acceptedNames.some((name) => normaliseName(name) === actual);
}

function normaliseName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

function videoMimeType(url: string) {
  const pathname = safePathname(url).toLocaleLowerCase();
  if (pathname.endsWith('.mp4')) return 'video/mp4; codecs="avc1"';
  if (pathname.endsWith('.webm')) return 'video/webm; codecs="vp9"';
  return null;
}

function safePathname(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

export const exerciseMediaResolver = createExerciseMediaResolver();
export { clearExerciseDbCacheForTests, exerciseDbProvider } from './exerciseDb';
export { DEFAULT_EXERCISE_MEDIA_BASE_URL, resolveLocalCandidates } from './local';
export { clearWgerCacheForTests, wgerProvider } from './wger';
