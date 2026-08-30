import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log('Usage: npm run media:validate -- --mp4 <demonstration.mp4> --poster <poster.webp> [--mp4-sha256 <hex> --poster-sha256 <hex>]');
  process.exit(0);
}
if (!args.mp4 || !args.poster) throw new Error('Both --mp4 and --poster are required.');

const mp4Path = resolve(args.mp4);
const posterPath = resolve(args.poster);
const [videoProbe, posterProbe, mp4Stat, posterStat, mp4Bytes, posterBytes] = await Promise.all([
  probe(mp4Path),
  probe(posterPath),
  stat(mp4Path),
  stat(posterPath),
  readFile(mp4Path),
  readFile(posterPath),
]);
const failures = [];

const video = videoProbe.streams.find((stream) => stream.codec_type === 'video');
const audio = videoProbe.streams.filter((stream) => stream.codec_type === 'audio');
const duration = Number(videoProbe.format.duration ?? video?.duration);
check(video?.codec_name === 'h264', `video codec must be H.264 (found ${video?.codec_name ?? 'none'})`);
check(String(videoProbe.format.format_name).split(',').some((name) => name === 'mp4'), `video container must be MP4 (found ${videoProbe.format.format_name ?? 'unknown'})`);
check(video?.pix_fmt === 'yuv420p', `pixel format must be yuv420p (found ${video?.pix_fmt ?? 'none'})`);
check(video?.width === 960 && video?.height === 540, `video must be 960x540 (found ${video?.width ?? '?'}x${video?.height ?? '?'})`);
check(Math.abs(frameRate(video?.avg_frame_rate) - 30) < 0.01, `video must be 30 fps (found ${video?.avg_frame_rate ?? 'unknown'})`);
check(Number.isFinite(duration) && duration >= 6 && duration <= 12, `duration must be 6-12 seconds (found ${duration || 'unknown'})`);
check(audio.length === 0, `video must contain no audio streams (found ${audio.length})`);
check(mp4Stat.size <= 3_000_000, `video must be no larger than 3 MB (found ${mp4Stat.size} bytes)`);
check(atomOffset(mp4Bytes, 'moov') >= 0 && atomOffset(mp4Bytes, 'moov') < atomOffset(mp4Bytes, 'mdat'), 'MP4 must have the moov atom before mdat (fast-start)');

const poster = posterProbe.streams.find((stream) => stream.codec_type === 'video');
check(poster?.codec_name === 'webp', `poster codec must be WebP (found ${poster?.codec_name ?? 'none'})`);
check(poster?.width === 960 && poster?.height === 540, `poster must be 960x540 (found ${poster?.width ?? '?'}x${poster?.height ?? '?'})`);
check(posterStat.size <= 150_000, `poster must be no larger than 150 KB (found ${posterStat.size} bytes)`);

const checksums = {
  demonstrationSha256: sha256(mp4Bytes),
  posterSha256: sha256(posterBytes),
};
if (args.mp4Sha256) check(checksums.demonstrationSha256 === args.mp4Sha256.toLowerCase(), 'MP4 checksum does not match --mp4-sha256');
if (args.posterSha256) check(checksums.posterSha256 === args.posterSha256.toLowerCase(), 'poster checksum does not match --poster-sha256');

if (failures.length) {
  console.error(`Media validation failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(JSON.stringify({
  valid: true,
  video: { width: video.width, height: video.height, durationSeconds: duration, fps: frameRate(video.avg_frame_rate), bytes: mp4Stat.size },
  poster: { width: poster.width, height: poster.height, bytes: posterStat.size },
  checksums,
}, null, 2));

function check(condition, message) {
  if (!condition) failures.push(message);
}

function probe(path) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_streams',
    '-show_format',
    '-of', 'json',
    path,
  ], { encoding: 'utf8', windowsHide: true });
  if (result.error?.code === 'ENOENT') throw new Error('ffprobe was not found on PATH. Install FFmpeg before validating media.');
  if (result.status !== 0) throw new Error(`ffprobe failed for ${path}: ${result.stderr.trim()}`);
  return JSON.parse(result.stdout);
}

function frameRate(value) {
  const [numerator, denominator] = String(value ?? '').split('/').map(Number);
  return denominator ? numerator / denominator : Number(value);
}

function atomOffset(bytes, wantedType) {
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    let size = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === wantedType) return offset;
    if (size === 1 && offset + 16 <= bytes.length) size = Number(bytes.readBigUInt64BE(offset + 8));
    if (size === 0) size = bytes.length - offset;
    if (!Number.isSafeInteger(size) || size < 8) return -1;
    offset += size;
  }
  return -1;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === '--help' || values[index] === '-h') result.help = true;
    if (values[index] === '--mp4') result.mp4 = values[++index];
    if (values[index] === '--poster') result.poster = values[++index];
    if (values[index] === '--mp4-sha256') result.mp4Sha256 = values[++index];
    if (values[index] === '--poster-sha256') result.posterSha256 = values[++index];
  }
  return result;
}
