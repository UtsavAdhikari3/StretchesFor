import { describe, expect, it } from 'vitest';
import { exerciseBlueprints } from './content';
import { exerciseSourceManifest } from './exerciseSources';

describe('exercise source manifest', () => {
  it('records an explicit reviewed provider result for all 28 local movements', () => {
    expect(Object.keys(exerciseSourceManifest)).toHaveLength(28);
    expect(Object.keys(exerciseSourceManifest).sort()).toEqual(exerciseBlueprints.map((item) => item.id).sort());
    for (const source of Object.values(exerciseSourceManifest)) {
      expect(source).toHaveProperty('wgerId');
      expect(source).toHaveProperty('exerciseDbId');
      expect(source).toHaveProperty('localAsset');
      if (source.wgerId) expect(source.acceptedExternalNames.wger.length).toBeGreaterThan(0);
      if (source.exerciseDbId) expect(source.acceptedExternalNames.exerciseDb.length).toBeGreaterThan(0);
    }
  });

  it('keeps approved local assets immutable, complete, and path-unique', () => {
    const paths: string[] = [];
    for (const [exerciseId, source] of Object.entries(exerciseSourceManifest)) {
      const asset = source.localAsset;
      if (!asset) continue;

      expect(asset.approved).toBe(true);
      expect(asset.version).toMatch(/^v\d+$/);
      expect(asset.demonstrationPath).toBe(`/${asset.version}/${exerciseId}/demonstration.mp4`);
      expect(asset.posterPath).toBe(`/${asset.version}/${exerciseId}/poster.webp`);
      expect([asset.width, asset.height]).toEqual([960, 540]);
      expect(asset.durationSeconds).toBeGreaterThanOrEqual(6);
      expect(asset.durationSeconds).toBeLessThanOrEqual(12);
      expect(asset.checksums.demonstrationSha256).toMatch(/^[a-f\d]{64}$/);
      expect(asset.checksums.posterSha256).toMatch(/^[a-f\d]{64}$/);
      expect(asset.approvalDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(asset.reviewerRole.trim()).not.toBe('');
      expect(asset.checklistVersion.trim()).not.toBe('');
      paths.push(asset.demonstrationPath, asset.posterPath);
    }
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('does not regress below the seven currently verified exact mappings', () => {
    const verified = Object.values(exerciseSourceManifest).filter((source) =>
      Boolean(
        (source.wgerId && source.acceptedExternalNames.wger.length)
        || (source.exerciseDbId && source.acceptedExternalNames.exerciseDb.length)
        || source.localAsset?.approved,
      ));
    expect(verified.length).toBeGreaterThanOrEqual(7);
  });

  it('contains no questionnaire, symptom, or safety state', () => {
    expect(JSON.stringify(exerciseSourceManifest)).not.toMatch(/question|answer|symptom|safety|urgent|region/i);
  });
});
