import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('exercise media review ledger', () => {
  it('keeps every discovered candidate reviewable and clinically gated', async () => {
    const path = new URL('../../media/curation/review-ledger.json', import.meta.url);
    const ledger = JSON.parse(await readFile(path, 'utf8')) as Array<Record<string, any>>;

    for (const candidate of ledger) {
      expect(['wger', 'exerciseDb']).toContain(candidate.provider);
      expect(candidate.exerciseId).toBeTruthy();
      expect(candidate.providerId).toBeTruthy();
      expect(candidate.externalName).toBeTruthy();
      expect(candidate).toHaveProperty('previewUrl');
      expect(candidate).toHaveProperty('license');
      expect(candidate).toHaveProperty('author');
      expect(candidate).toHaveProperty('reviewer');
      expect(candidate).toHaveProperty('reviewerRole');
      expect(candidate).toHaveProperty('reviewDate');
      expect(['pending', 'accepted', 'rejected']).toContain(candidate.matchDecision);

      if (candidate.matchDecision === 'rejected') expect(candidate.rejectionReason).toBeTruthy();
      if (candidate.matchDecision === 'accepted') {
        expect(candidate.reviewer).toBeTruthy();
        expect(candidate.reviewerRole).toBeTruthy();
        expect(candidate.reviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Object.values(candidate.checklist)).toEqual(Array(7).fill('pass'));
      }
    }
  });
});
