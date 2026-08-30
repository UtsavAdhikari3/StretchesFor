import type { ExerciseSourceReference } from '../../data/types';
import type { CanPlayType, ProviderExercise } from './index';

export const DEFAULT_EXERCISE_MEDIA_BASE_URL = 'https://media.stretchesfor.com';

/**
 * Resolve an already-reviewed local manifest entry without making a metadata
 * request. The browser requests only the selected immutable media URL.
 */
export function resolveLocalCandidates(
  reference: ExerciseSourceReference,
  canPlayType: CanPlayType,
  baseUrl = import.meta.env.PUBLIC_EXERCISE_MEDIA_BASE_URL || DEFAULT_EXERCISE_MEDIA_BASE_URL,
): ProviderExercise[] {
  const asset = reference.localAsset;
  if (!asset?.approved) return [];

  const common = {
    id: `local:${asset.version}`,
    name: 'StretchesFor clinically reviewed demonstration',
    instructions: [],
    targetMuscles: [],
  };
  const poster = mediaUrl(asset.posterPath, baseUrl);
  const candidates: ProviderExercise[] = [];

  if (canPlayType('video/mp4; codecs="avc1"')) {
    candidates.push({
      ...common,
      media: {
        type: 'video',
        url: mediaUrl(asset.demonstrationPath, baseUrl),
        poster,
        provider: 'local',
      },
    });
  }

  candidates.push({
    ...common,
    media: {
      type: 'image',
      url: poster,
      provider: 'local',
    },
  });
  return candidates;
}

function mediaUrl(path: string, baseUrl: string) {
  const base = validBaseUrl(baseUrl) ? baseUrl : DEFAULT_EXERCISE_MEDIA_BASE_URL;
  return new URL(path.replace(/^\/+/, ''), `${base.replace(/\/+$/, '')}/`).href;
}

function validBaseUrl(value: string) {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
