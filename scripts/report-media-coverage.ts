import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { exerciseBlueprints } from '../src/data/content.ts';
import { exerciseSourceManifest } from '../src/data/exerciseSources.ts';

const args = parseArgs(process.argv.slice(2));
const target = Number(args.target ?? process.env.MEDIA_COVERAGE_TARGET ?? 7);
if (!Number.isInteger(target) || target < 0 || target > exerciseBlueprints.length) {
  throw new Error(`Coverage target must be an integer from 0 to ${exerciseBlueprints.length}.`);
}

const rows = exerciseBlueprints.map((exercise) => {
  const source = exerciseSourceManifest[exercise.id];
  const providers = [
    source.wgerId && source.acceptedExternalNames.wger.length ? 'wger' : null,
    source.exerciseDbId && source.acceptedExternalNames.exerciseDb.length ? 'exerciseDb' : null,
    source.localAsset?.approved ? 'local' : null,
  ].filter(Boolean);
  return { id: exercise.id, name: exercise.name, verified: providers.length > 0, providers };
});
const verified = rows.filter((row) => row.verified).length;
const report = {
  generatedAt: new Date().toISOString(),
  verified,
  total: rows.length,
  target,
  passes: verified >= target,
  rows,
};

const output = resolve(args.output ?? 'artifacts/media-coverage.json');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`Verified exercise media: ${verified}/${rows.length} (required floor: ${target}/${rows.length})`);
for (const row of rows.filter((item) => !item.verified)) console.log(`- unavailable: ${row.id}`);
console.log(`Coverage report: ${output}`);
if (!report.passes) process.exitCode = 1;

function parseArgs(values: string[]) {
  const result: { target?: string; output?: string } = {};
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === '--target') result.target = values[++index];
    if (values[index] === '--output') result.output = values[++index];
  }
  return result;
}
