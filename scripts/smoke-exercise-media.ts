import { createHash } from 'node:crypto';
import { exerciseSourceManifest } from '../src/data/exerciseSources.ts';

const args = parseArgs(process.argv.slice(2));
const baseUrl = args.baseUrl ?? process.env.PUBLIC_EXERCISE_MEDIA_BASE_URL ?? 'https://media.stretchesfor.com';
const enabled = Object.entries(exerciseSourceManifest).filter((entry) => entry[1].localAsset?.approved);
const failures: string[] = [];

for (const [exerciseId, source] of enabled) {
  const asset = source.localAsset!;
  await verifyObject(exerciseId, asset.demonstrationPath, 'video/mp4', asset.checksums.demonstrationSha256);
  await verifyObject(exerciseId, asset.posterPath, 'image/webp', asset.checksums.posterSha256);
}

if (failures.length) {
  console.error(`CDN smoke checks failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`CDN smoke checks passed for ${enabled.length} approved local exercise(s).`);
}

async function verifyObject(exerciseId: string, path: string, contentType: string, checksum: string) {
  const url = new URL(path.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`).href;
  const headers = { Origin: 'https://stretchesfor.com' };
  try {
    const head = await fetch(url, { method: 'HEAD', headers });
    check(head.ok, `${exerciseId}: HEAD ${url} returned ${head.status}`);
    check(head.headers.get('content-type')?.toLocaleLowerCase().startsWith(contentType), `${exerciseId}: expected Content-Type ${contentType}`);
    check(head.headers.get('access-control-allow-origin') === 'https://stretchesfor.com', `${exerciseId}: incorrect or missing CORS origin`);
    const cache = head.headers.get('cache-control')?.toLocaleLowerCase() ?? '';
    check(cache.includes('public') && cache.includes('max-age=31536000') && cache.includes('immutable'), `${exerciseId}: incorrect Cache-Control`);

    const get = await fetch(url, { method: 'GET', headers });
    check(get.ok, `${exerciseId}: GET ${url} returned ${get.status}`);
    if (get.ok) {
      const actual = createHash('sha256').update(Buffer.from(await get.arrayBuffer())).digest('hex');
      check(actual === checksum.toLocaleLowerCase(), `${exerciseId}: checksum mismatch for ${path}`);
    }
  } catch (error) {
    failures.push(`${exerciseId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function check(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

function parseArgs(values: string[]) {
  const result: { baseUrl?: string } = {};
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === '--base-url') result.baseUrl = values[++index];
  }
  return result;
}
