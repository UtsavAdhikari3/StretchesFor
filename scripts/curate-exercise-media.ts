import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { exerciseBlueprints } from '../src/data/content.ts';
import { exerciseSourceManifest } from '../src/data/exerciseSources.ts';

const WGER_API = 'https://wger.de/api/v2';
const EXERCISE_DB_API = 'https://oss.exercisedb.dev/api/v1/exercises';
const DEFAULT_LEDGER = resolve('media/curation/review-ledger.json');
const args = parseArgs(process.argv.slice(2));
let wgerCatalogPromise: Promise<Record<string, unknown>[]> | undefined;
const discoveryWarnings: string[] = [];

if (args.help) {
  console.log('Usage: npm run media:curate -- --exercise <slug|all> [--output <ledger.json>]');
  console.log('This command suggests candidates only and never changes production mappings.');
  process.exit(0);
}

if (!args.exercise) throw new Error('Pass --exercise <slug|all>.');

const selected = args.exercise === 'all'
  ? exerciseBlueprints
  : exerciseBlueprints.filter((exercise) => exercise.id === args.exercise);
if (selected.length === 0) throw new Error(`Unknown exercise slug: ${args.exercise}`);

const output = resolve(args.output || DEFAULT_LEDGER);
const existing = await readLedger(output);
const existingByKey = new Map(existing.map((item) => [ledgerKey(item), item]));
const discovered = [];

for (const exercise of selected) {
  const reference = exerciseSourceManifest[exercise.id];
  const profile = {
    name: exercise.name,
    aliases: [...reference.acceptedExternalNames.wger, ...reference.acceptedExternalNames.exerciseDb],
    setup: exercise.instructions[0] ?? '',
    direction: exercise.direction,
    equipment: inferEquipment(exercise.instructions.join(' ')),
    targetArea: exercise.feltArea,
    safetyCues: [...exercise.mistakes, exercise.easier],
  };

  const [wger, exerciseDb] = await Promise.all([
    searchWger(exercise.id, profile),
    searchExerciseDb(exercise.id, profile),
  ]);
  discovered.push(...wger, ...exerciseDb);
}

const discoveredKeys = new Set(discovered.map(ledgerKey));
const untouched = existing.filter((item) => !discoveredKeys.has(ledgerKey(item)));
const merged = discovered.map((candidate) => {
  const reviewed = existingByKey.get(ledgerKey(candidate));
  return reviewed ? { ...candidate, ...reviewFields(reviewed) } : candidate;
});
const ledger = [...untouched, ...merged].sort((a, b) =>
  a.exerciseId.localeCompare(b.exerciseId) || a.provider.localeCompare(b.provider) || a.externalName.localeCompare(b.externalName));

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
console.log(`Recorded ${merged.length} candidate(s) for ${selected.length} exercise(s) in ${output}.`);
console.log('All new candidates remain pending; production mappings were not changed.');
if (discoveryWarnings.length) {
  console.warn(`${discoveryWarnings.length} provider request(s) failed; rerun before treating this as a complete audit.`);
  process.exitCode = 2;
}

async function searchWger(exerciseId: string, profile: Profile) {
  const catalog = await wgerCatalog();
  const ranked = catalog
    .map((item) => ({ item, score: candidateScore(profile, `${item.name} ${item.description ?? ''}`) }))
    .filter(({ item, score }) => score > 0 && Boolean(item.exercise_base ?? item.exercise_base_id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return await Promise.all(ranked.map(async ({ item }) => {
    const baseId = String(item.exercise_base ?? item.exercise_base_id ?? '');
    const detail = baseId ? await tryGetJson(`${WGER_API}/exerciseinfo/${encodeURIComponent(baseId)}/`) : null;
    const videos = array(detail?.videos);
    const images = array(detail?.images);
    const media = videos.find((value) => httpUrl(value.video)) ?? images.find((value) => httpUrl(value.image));
    const license = object(detail?.license);
    const translation = array(detail?.translations).find((value) => value.language === 2) ?? {};
    return pendingCandidate({
      exerciseId,
      provider: 'wger',
      providerId: baseId,
      externalName: String(item.name ?? '').trim(),
      previewUrl: httpUrl(media?.video) || httpUrl(media?.image) || null,
      license: string(media?.license_title) || string(license.short_name) || string(license.full_name) || null,
      author: string(media?.license_author) || string(translation.license_author) || string(detail?.license_author) || null,
      profile,
    });
  }));
}

function wgerCatalog() {
  wgerCatalogPromise ??= tryGetJson(`${WGER_API}/exercise/?language=2&limit=1000`)
    .then((payload) => array(payload?.results));
  return wgerCatalogPromise;
}

async function searchExerciseDb(exerciseId: string, profile: Profile) {
  const results = new Map<string, Record<string, unknown>>();
  for (const query of searchQueries(profile)) {
    const payload = await tryGetJson(`${EXERCISE_DB_API}/search?search=${encodeURIComponent(query)}&threshold=0.45`);
    for (const item of array(payload?.data)) {
      const id = string(item.exerciseId);
      if (id) results.set(id, item);
    }
  }

  const ranked = [...results.values()]
    .map((item) => ({ item, score: candidateScore(profile, string(item.name)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return ranked.map(({ item }) => pendingCandidate({
    exerciseId,
    provider: 'exerciseDb',
    providerId: string(item.exerciseId),
    externalName: string(item.name),
    previewUrl: httpUrl(item.gifUrl) || null,
    license: 'ExerciseDB free API terms; deployment use must be rechecked',
    author: 'AscendAPI',
    profile,
  }));
}

function pendingCandidate(input: {
  exerciseId: string;
  provider: 'wger' | 'exerciseDb';
  providerId: string;
  externalName: string;
  previewUrl: string | null;
  license: string | null;
  author: string | null;
  profile: Profile;
}) {
  return {
    ...input,
    queryContext: input.profile,
    matchDecision: 'pending',
    rejectionReason: null,
    reviewer: null,
    reviewerRole: null,
    reviewDate: null,
    checklist: {
      setup: 'pending',
      supportAndEquipment: 'pending',
      direction: 'pending',
      range: 'pending',
      tempo: 'pending',
      bilateralBehaviour: 'pending',
      safetyCueConsistency: 'pending',
    },
    discoveredAt: new Date().toISOString(),
  };
}

function reviewFields(item: Record<string, any>) {
  return {
    matchDecision: item.matchDecision ?? 'pending',
    rejectionReason: item.rejectionReason ?? null,
    reviewer: item.reviewer ?? null,
    reviewerRole: item.reviewerRole ?? null,
    reviewDate: item.reviewDate ?? null,
    checklist: item.checklist,
  };
}

function searchQueries(profile: Profile) {
  return [...new Set([
    profile.name,
    ...profile.aliases,
    `${profile.name} ${profile.targetArea}`,
    `${profile.direction} ${profile.targetArea}`,
    `${profile.equipment.join(' ')} ${profile.name}`.trim(),
  ].map((value) => value.trim()).filter(Boolean))].slice(0, 6);
}

function candidateScore(profile: Profile, candidate: string) {
  const candidateWords = words(candidate);
  const weighted = [
    [profile.name, 5],
    ...profile.aliases.map((alias) => [alias, 5] as const),
    [profile.setup, 2],
    [profile.direction, 3],
    [profile.equipment.join(' '), 3],
    [profile.targetArea, 2],
    [profile.safetyCues.join(' '), 1],
  ] as const;
  return weighted.reduce((score, [value, weight]) =>
    score + [...words(value)].filter((word) => candidateWords.has(word)).length * weight, 0);
}

function inferEquipment(value: string) {
  const supported = ['wall', 'chair', 'table', 'towel', 'rope', 'pillow', 'mat', 'doorway', 'support'];
  const normalised = value.toLocaleLowerCase('en');
  const found = supported.filter((item) => normalised.includes(item));
  return found.length ? found : ['none'];
}

function words(value: string) {
  return new Set(value.toLocaleLowerCase('en').match(/[a-z0-9]+/g)?.filter((word) => word.length > 2) ?? []);
}

async function getJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return await response.json();
}

async function tryGetJson(url: string) {
  try {
    return await getJson(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    discoveryWarnings.push(message);
    console.warn(`Provider search warning: ${message}`);
    return null;
  }
}

async function readLedger(path: string): Promise<Record<string, any>[]> {
  try {
    const value = JSON.parse(await readFile(path, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function ledgerKey(item: Record<string, any>) {
  return `${item.exerciseId}:${item.provider}:${item.providerId}`;
}

function parseArgs(values: string[]) {
  const result: { exercise?: string; output?: string; help?: boolean } = {};
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === '--help' || values[index] === '-h') result.help = true;
    if (values[index] === '--exercise') result.exercise = values[++index];
    if (values[index] === '--output') result.output = values[++index];
  }
  return result;
}

function array(value: unknown): Record<string, any>[] {
  return Array.isArray(value) ? value : [];
}

function object(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {};
}

function string(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function httpUrl(value: unknown) {
  const text = string(value);
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol) ? text : '';
  } catch {
    return '';
  }
}

interface Profile {
  name: string;
  aliases: string[];
  setup: string;
  direction: string;
  equipment: string[];
  targetArea: string;
  safetyCues: string[];
}
