import type { ExerciseProvider, ProviderExercise } from './index';

const API_URL = 'https://wger.de/api/v2';
const ENGLISH_LANGUAGE_ID = 2;
const cache = new Map<string, Promise<ProviderExercise | null>>();

interface WgerTranslation {
  language?: unknown;
  name?: unknown;
  description?: unknown;
  description_source?: unknown;
  license_author?: unknown;
}

interface WgerMedia {
  video?: unknown;
  image?: unknown;
  is_main?: unknown;
  codec?: unknown;
  license_title?: unknown;
  license_object_url?: unknown;
  license_author?: unknown;
}

interface WgerExerciseInfo {
  id?: unknown;
  translations?: unknown;
  muscles?: unknown;
  muscles_secondary?: unknown;
  videos?: unknown;
  images?: unknown;
  license?: unknown;
  license_author?: unknown;
}

export const wgerProvider: ExerciseProvider = {
  getExercise(id, signal) {
    if (signal?.aborted) return Promise.reject(abortError());
    const cached = cache.get(id);
    if (cached) return cached;

    const pending = requestAndNormalise(id, signal).catch((error: unknown) => {
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

async function requestAndNormalise(id: string, signal?: AbortSignal): Promise<ProviderExercise | null> {
  const info = await requestJson<WgerExerciseInfo>(`/exerciseinfo/${encodeURIComponent(id)}/`, signal);
  if (!info || String(info.id) !== id) return null;

  let translations = array<WgerTranslation>(info.translations);
  if (!translations.some(isEnglishTranslation)) {
    const exercises = await requestJson<{ results?: WgerTranslation[] }>(
      `/exercise/?exercise_base=${encodeURIComponent(id)}&language=${ENGLISH_LANGUAGE_ID}`,
      signal,
    );
    translations = [...translations, ...array<WgerTranslation>(exercises?.results)];
  }

  let videos = array<WgerMedia>(info.videos);
  if (!Array.isArray(info.videos)) {
    const payload = await requestJson<{ results?: WgerMedia[] }>(`/video/?exercise=${encodeURIComponent(id)}`, signal);
    videos = array<WgerMedia>(payload?.results);
  }

  let images = array<WgerMedia>(info.images);
  if (!Array.isArray(info.images)) {
    const payload = await requestJson<{ results?: WgerMedia[] }>(`/exerciseimage/?exercise=${encodeURIComponent(id)}`, signal);
    images = array<WgerMedia>(payload?.results);
  }

  return normalise(info, translations, videos, images, id);
}

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const response = await fetch(`${API_URL}${path}`, { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) return null;
  return await response.json() as T;
}

function normalise(
  info: WgerExerciseInfo,
  translations: WgerTranslation[],
  videos: WgerMedia[],
  images: WgerMedia[],
  id: string,
): ProviderExercise | null {
  const translation = translations.find(isEnglishTranslation);
  if (!translation || typeof translation.name !== 'string' || !translation.name.trim()) return null;

  const image = images
    .filter((item) => isHttpUrl(item.image))
    .sort(mainFirst)[0];
  const video = videos
    .filter((item) => isSafeVideo(item))
    .sort(mainFirst)[0];
  if (!video && !image) return null;

  const selected = video ?? image;
  const license = object(info.license);
  const description = typeof translation.description === 'string'
    ? translation.description
    : typeof translation.description_source === 'string'
      ? translation.description_source
      : '';

  return {
    id,
    name: translation.name.trim(),
    instructions: htmlToInstructions(description),
    targetMuscles: [...array(info.muscles), ...array(info.muscles_secondary)]
      .map((muscle) => object(muscle))
      .map((muscle) => string(muscle.name_en) || string(muscle.name))
      .filter(Boolean),
    media: {
      type: video ? 'video' : 'image',
      url: String(video?.video ?? image?.image),
      poster: video && image ? String(image.image) : undefined,
      provider: 'wger',
      license: string(selected?.license_title) || string(license.short_name) || string(license.full_name) || undefined,
      licenseUrl: httpUrl(selected?.license_object_url) || httpUrl(license.url) || undefined,
      author: string(selected?.license_author) || string(translation.license_author) || string(info.license_author) || undefined,
    },
  };
}

function isEnglishTranslation(value: WgerTranslation) {
  return value.language === ENGLISH_LANGUAGE_ID;
}

function isSafeVideo(value: WgerMedia) {
  if (!isHttpUrl(value.video)) return false;
  const codec = string(value.codec).toLocaleLowerCase();
  const pathname = new URL(value.video).pathname.toLocaleLowerCase();
  if (/hevc|h\.?265/.test(codec) || /\.mov$/.test(pathname)) return false;
  if (pathname.endsWith('.mp4')) return /h\.?264|avc/.test(codec);
  if (pathname.endsWith('.webm')) return /vp8|vp9/.test(codec);
  return false;
}

function mainFirst(a: WgerMedia, b: WgerMedia) {
  return Number(Boolean(b.is_main)) - Number(Boolean(a.is_main));
}

function htmlToInstructions(value: string) {
  const withBoundaries = value
    .replace(/<\s*(br|\/p|\/li|\/ol|\/ul)\s*\/?>/gi, '\n')
    .replace(/<\s*(p|li|ol|ul)(?:\s[^>]*)?>/gi, '')
    .replace(/<[^>]*>/g, ' ');
  return decodeEntities(withBoundaries)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.\s]+/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function decodeEntities(value: string) {
  const entities: Record<string, string> = {
    amp: '&', apos: "'", quot: '"', lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return entities[entity.toLocaleLowerCase()] ?? match;
  });
}

function array<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function string(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isHttpUrl(value: unknown): value is string {
  return Boolean(httpUrl(value));
}

function httpUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : '';
  } catch {
    return '';
  }
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function clearWgerCacheForTests() {
  cache.clear();
}
