import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExerciseSourceReference } from '../../data/types';
import {
  clearExerciseDbCacheForTests,
  clearWgerCacheForTests,
  createExerciseMediaResolver,
  exerciseDbProvider,
  type ExerciseProvider,
  type ProviderExercise,
  wgerProvider,
} from '.';

beforeEach(() => {
  clearWgerCacheForTests();
  clearExerciseDbCacheForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Wger provider', () => {
  it('normalises English metadata, HTML instructions, muscles, safe video, poster, author, and license', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      id: 1239,
      translations: [
        { language: 1, name: 'Wadenstretch', description: '<p>Nicht Englisch</p>' },
        { language: 2, name: 'Standing Calf Stretch', description: '<ol><li>Stand tall &amp; relax.</li><li>Keep the heel down.</li></ol>' },
      ],
      muscles: [{ name: 'Gastrocnemius', name_en: 'Calves' }],
      muscles_secondary: [{ name: 'Soleus', name_en: '' }],
      videos: [{ video: 'https://wger.de/demo.mp4', codec: 'h264', is_main: true, license_author: 'Media author' }],
      images: [{ image: 'https://wger.de/poster.webp', is_main: true }],
      license: { short_name: 'CC-BY-SA 4', url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.en' },
      license_author: 'Exercise author',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const exercise = await wgerProvider.getExercise('1239');

    expect(exercise).toMatchObject({
      id: '1239',
      name: 'Standing Calf Stretch',
      instructions: ['Stand tall & relax.', 'Keep the heel down.'],
      targetMuscles: ['Calves', 'Soleus'],
      media: {
        type: 'video',
        url: 'https://wger.de/demo.mp4',
        poster: 'https://wger.de/poster.webp',
        provider: 'wger',
        author: 'Media author',
        license: 'CC-BY-SA 4',
      },
    });
  });

  it('uses the detail endpoints when exerciseinfo omits translations and media fields', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: 7, muscles: [], muscles_secondary: [], license: {} }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ language: 2, name: 'Exact exercise', description_source: 'One step' }] }))
      .mockResolvedValueOnce(jsonResponse({ results: [] }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ image: 'https://wger.de/exact.webp', is_main: true }] }));
    vi.stubGlobal('fetch', fetchMock);

    const exercise = await wgerProvider.getExercise('7');

    expect(exercise?.media).toMatchObject({ type: 'image', url: 'https://wger.de/exact.webp' });
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'https://wger.de/api/v2/exerciseinfo/7/',
      'https://wger.de/api/v2/exercise/?exercise_base=7&language=2',
      'https://wger.de/api/v2/video/?exercise=7',
      'https://wger.de/api/v2/exerciseimage/?exercise=7',
    ]);
  });

  it.each([
    ['non-2xx', new Response(null, { status: 503 })],
    ['malformed', jsonResponse({ id: 10, translations: 'bad', images: [], videos: [] })],
    ['empty', jsonResponse({ id: 10, translations: [], images: [], videos: [] })],
  ])('returns null for %s responses', async (_label, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(wgerProvider.getExercise('10')).resolves.toBeNull();
  });

  it('rejects MOV, HEVC, and H.265 media while retaining a main image', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      id: 12,
      translations: [{ language: 2, name: 'Exact', description: '<p>Step</p>' }],
      muscles: [],
      muscles_secondary: [],
      videos: [
        { video: 'https://wger.de/a.MOV', codec: 'h264', is_main: true },
        { video: 'https://wger.de/b.mp4', codec: 'hevc' },
        { video: 'https://wger.de/c.mp4', codec: 'H.265' },
      ],
      images: [{ image: 'https://wger.de/still.webp', is_main: true }],
      license: {},
    })));

    expect((await wgerProvider.getExercise('12'))?.media).toMatchObject({ type: 'image', url: 'https://wger.de/still.webp' });
  });

  it('deduplicates requests and does not persist aborted requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      id: 20,
      translations: [{ language: 2, name: 'Exact', description: 'Step' }],
      images: [],
      videos: [],
    }));
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([wgerProvider.getExercise('20'), wgerProvider.getExercise('20')]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clearWgerCacheForTests();
    const abort = new AbortController();
    abort.abort();
    await expect(wgerProvider.getExercise('20', abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('ExerciseDB provider', () => {
  it('normalises a V1 exercise and its GIF URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: {
      exerciseId: 'gif-1',
      name: 'Exact stretch',
      gifUrl: 'https://static.exercisedb.dev/media/gif-1.gif',
      targetMuscles: ['calves'],
      instructions: ['Step one', 'Step two'],
    } })));

    await expect(exerciseDbProvider.getExercise('gif-1')).resolves.toEqual({
      id: 'gif-1',
      name: 'Exact stretch',
      instructions: ['Step one', 'Step two'],
      targetMuscles: ['calves'],
      media: {
        type: 'gif',
        url: 'https://static.exercisedb.dev/media/gif-1.gif',
        provider: 'exerciseDb',
      },
    });
  });

  it.each([
    ['non-2xx', new Response(null, { status: 404 })],
    ['malformed', jsonResponse({ data: { exerciseId: 'other', name: 'Wrong ID', gifUrl: 'not-a-url' } })],
    ['empty', jsonResponse({ data: [] })],
  ])('returns null for %s responses', async (_label, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(exerciseDbProvider.getExercise('gif-2')).resolves.toBeNull();
  });

  it('propagates aborts', async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(exerciseDbProvider.getExercise('gif-3', abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('exercise media resolver', () => {
  const reference: ExerciseSourceReference = {
    wgerId: '10',
    exerciseDbId: 'gif-10',
    acceptedExternalNames: { wger: ['Exact Wger'], exerciseDb: ['Exact DB'] },
    localAsset: null,
  };

  it('keeps playable Wger video before its Wger image and does not contact ExerciseDB', async () => {
    const wgerExercise = providerExercise('10', 'Exact Wger', 'video', 'https://wger.de/demo.mp4', 'wger', 'https://wger.de/poster.webp');
    const wger = provider(wgerExercise);
    const exerciseDb = provider(providerExercise('gif-10', 'Exact DB', 'gif', 'https://db/demo.gif', 'exerciseDb'));
    const resolver = createExerciseMediaResolver(wger, exerciseDb);

    const candidates = await resolver.resolveWgerCandidates(reference, () => 'probably');

    expect(candidates.map((item) => item.media.type)).toEqual(['video', 'image']);
    expect(exerciseDb.getExercise).not.toHaveBeenCalled();
  });

  it('rejects unsupported video but keeps the Wger image before ExerciseDB', async () => {
    const resolver = createExerciseMediaResolver(
      provider(providerExercise('10', 'Exact Wger', 'video', 'https://wger.de/demo.mp4', 'wger', 'https://wger.de/poster.webp')),
      provider(providerExercise('gif-10', 'Exact DB', 'gif', 'https://db/demo.gif', 'exerciseDb')),
    );
    const candidates = await resolver.resolveWgerCandidates(reference, () => '');
    expect(candidates).toHaveLength(1);
    expect(candidates[0].media).toMatchObject({ type: 'image', url: 'https://wger.de/poster.webp' });
  });

  it('requires both the explicit ID and an accepted exact external name', async () => {
    const wrongName = createExerciseMediaResolver(provider(providerExercise('10', 'Nearby variation', 'image', 'https://wger.de/a.webp', 'wger')), provider(null));
    await expect(wrongName.resolveWgerCandidates(reference, () => 'probably')).resolves.toEqual([]);

    const wrongId = createExerciseMediaResolver(provider(providerExercise('11', 'Exact Wger', 'image', 'https://wger.de/a.webp', 'wger')), provider(null));
    await expect(wrongId.resolveWgerCandidates(reference, () => 'probably')).resolves.toEqual([]);
  });

  it('sends providers only curated IDs', async () => {
    const wger = provider(null);
    const exerciseDb = provider(null);
    const resolver = createExerciseMediaResolver(wger, exerciseDb);
    await resolver.resolveWgerCandidates(reference, () => '');
    await resolver.resolveExerciseDbCandidate(reference);
    expect(wger.getExercise).toHaveBeenCalledWith('10', undefined);
    expect(exerciseDb.getExercise).toHaveBeenCalledWith('gif-10', undefined);
    expect(JSON.stringify((wger.getExercise as ReturnType<typeof vi.fn>).mock.calls)).not.toMatch(/symptom|region|answer|safety/i);
  });

  it('makes no provider request for reviewed null remote IDs', async () => {
    const wger = provider(null);
    const exerciseDb = provider(null);
    const resolver = createExerciseMediaResolver(wger, exerciseDb);
    const reviewedNulls = { ...reference, wgerId: null, exerciseDbId: null };

    await expect(resolver.resolveWgerCandidates(reviewedNulls, () => '')).resolves.toEqual([]);
    await expect(resolver.resolveExerciseDbCandidate(reviewedNulls)).resolves.toBeNull();
    expect(wger.getExercise).not.toHaveBeenCalled();
    expect(exerciseDb.getExercise).not.toHaveBeenCalled();
  });

  it('derives approved local MP4 and poster URLs without fetching metadata', () => {
    const resolver = createExerciseMediaResolver(provider(null), provider(null), 'https://staging-media.example/base');
    const localReference: ExerciseSourceReference = {
      ...reference,
      wgerId: null,
      exerciseDbId: null,
      localAsset: approvedLocalAsset(),
    };

    expect(resolver.resolveLocalCandidates(localReference, () => 'probably').map((item) => item.media)).toEqual([
      {
        type: 'video',
        url: 'https://staging-media.example/base/v1/test/demonstration.mp4',
        poster: 'https://staging-media.example/base/v1/test/poster.webp',
        provider: 'local',
      },
      {
        type: 'image',
        url: 'https://staging-media.example/base/v1/test/poster.webp',
        provider: 'local',
      },
    ]);
  });

  it('uses the local poster when H.264 MP4 is unsupported and rejects unapproved local data', () => {
    const resolver = createExerciseMediaResolver(provider(null), provider(null));
    const localReference = { ...reference, localAsset: approvedLocalAsset() };
    const unapprovedReference = {
      ...reference,
      localAsset: { ...approvedLocalAsset(), approved: false },
    } as unknown as ExerciseSourceReference;

    expect(resolver.resolveLocalCandidates(localReference, () => '')).toHaveLength(1);
    expect(resolver.resolveLocalCandidates(reference, () => 'probably')).toEqual([]);
    expect(resolver.resolveLocalCandidates(unapprovedReference, () => 'probably')).toEqual([]);
  });
});

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function provider(result: ProviderExercise | null): ExerciseProvider & { getExercise: ReturnType<typeof vi.fn> } {
  return { getExercise: vi.fn().mockResolvedValue(result) };
}

function providerExercise(
  id: string,
  name: string,
  type: ProviderExercise['media']['type'],
  url: string,
  providerName: ProviderExercise['media']['provider'],
  poster?: string,
): ProviderExercise {
  return { id, name, instructions: [], targetMuscles: [], media: { type, url, provider: providerName, poster } };
}

function approvedLocalAsset(): NonNullable<ExerciseSourceReference['localAsset']> {
  return {
    approved: true,
    version: 'v1',
    demonstrationPath: '/v1/test/demonstration.mp4',
    posterPath: '/v1/test/poster.webp',
    width: 960,
    height: 540,
    durationSeconds: 8,
    checksums: {
      demonstrationSha256: 'a'.repeat(64),
      posterSha256: 'b'.repeat(64),
    },
    approvalDate: '2026-08-30',
    reviewerRole: 'Licensed physiotherapist',
    checklistVersion: 'exercise-media-v1',
  };
}
