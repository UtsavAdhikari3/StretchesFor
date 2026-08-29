import { describe, expect, it } from 'vitest';
import { patterns } from '../data/content';
import { evaluateAnswers } from './triage';

const movementPattern = patterns.find((pattern) => pattern.id === 'nonspecific-lower-back')!;
const evaluationPattern = patterns.find((pattern) => pattern.id === 'sciatic-radicular')!;

describe('deterministic triage', () => {
  it('always gives urgent warnings highest precedence', () => {
    expect(evaluateAnswers(movementPattern, { emergency: 'yes', trauma: 'no', systemic: 'no', function: 'no', match: 'yes' }).kind).toBe('urgent');
  });
  it('routes uncertainty on a safety screen to professional evaluation', () => {
    expect(evaluateAnswers(movementPattern, { emergency: 'no', trauma: 'unsure', systemic: 'no', function: 'no', match: 'yes' }).kind).toBe('professional');
  });
  it('does not unlock movement for evaluation-only patterns', () => {
    expect(evaluateAnswers(evaluationPattern, { emergency: 'no', trauma: 'no', systemic: 'no', function: 'no', match: 'yes' }).kind).toBe('professional');
  });
  it('unlocks movement only after all safety answers are no and the pattern matches', () => {
    expect(evaluateAnswers(movementPattern, { emergency: 'no', trauma: 'no', systemic: 'no', function: 'no', match: 'yes' }).kind).toBe('movement');
  });
  it('does not treat a non-match as movement appropriate', () => {
    expect(evaluateAnswers(movementPattern, { emergency: 'no', trauma: 'no', systemic: 'no', function: 'no', match: 'no' }).kind).toBe('professional');
  });
});
