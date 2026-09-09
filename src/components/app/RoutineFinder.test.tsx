// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoutineFinder, { validateRoutineState } from './RoutineFinder';
import { patterns } from '../../data/content';
import { evaluateAnswers } from '../../lib/triage';
import { t } from '../../i18n';
beforeEach(() => { sessionStorage.clear(); history.replaceState(null, '', '/en/guide/locate/'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function startStiffness() {
  const user = userEvent.setup();
  render(<RoutineFinder locale="en" />);
  await user.click(await screen.findByRole('button', { name: 'Neck' }));
  await user.click(screen.getByRole('button', { name: 'Mostly stiffness or tightness' }));
  return user;
}
describe('routine questionnaire', () => {
  it('requires all safety answers, then reaches a routine without a page reload', async () => {
    const user = await startStiffness();
    for (let i = 0; i < 4; i++) {
      expect(screen.queryByRole('button', { name: 'Start my routine' })).toBeNull();
      await user.click(screen.getByRole('button', { name: 'No' }));
    }
    await user.click(screen.getByRole('button', { name: 'Show my routine' }));
    await user.click(screen.getByRole('button', { name: 'Start my routine' }));
    expect(await screen.findByRole('button', { name: 'Start timer' })).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: 'Timer sounds' }) as HTMLInputElement).checked).toBe(false);
    expect(location.search).toBe('');
    expect(sessionStorage.getItem('stretchesfor-routine-v1')).toContain('"emergency":"no"');
  });
  it('stops immediately on an urgent warning', async () => {
    const user = await startStiffness();
    await user.click(screen.getByRole('button', { name: 'Yes' }));
    expect(await screen.findByRole('heading', { name: 'Possible urgent warning sign' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start my routine' })).toBeNull();
  });
  it('routes uncertainty to evaluation, never to a routine', async () => {
    const user = await startStiffness();
    await user.click(screen.getByRole('button', { name: 'Not sure' }));
    expect(await screen.findByRole('heading', { name: 'Professional evaluation recommended' })).toBeTruthy();
  });
  it('does not bypass questions on a direct exercise URL', async () => {
    history.replaceState(null, '', '/en/guide/move/?exercise=cat-cow&entry=exercise');
    render(<RoutineFinder locale="en" />);
    expect(await screen.findByRole('heading', { name: 'How does the area feel today?' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start timer' })).toBeNull();
    expect(location.search).toBe('');
  });
  it('resumes across remounts and permits editing earlier safety answers', async () => {
    const user = await startStiffness();
    await user.click(screen.getByRole('button', { name: 'No' }));
    cleanup(); render(<RoutineFinder locale="en" />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /major fall/ })).toBeTruthy());
    await user.click(screen.getByRole('button', { name: /Back/ }));
    await user.click(screen.getByRole('button', { name: 'Yes' }));
    expect(await screen.findByRole('heading', { name: 'Possible urgent warning sign' })).toBeTruthy();
  });
  it('continues in memory when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    await startStiffness();
    expect(screen.getByText('Progress stays on this page. Refreshing or changing language will restart the questions.')).toBeTruthy();
  });
  it('rejects malformed state and incomplete safety maps', () => {
    expect(validateRoutineState({ version: 1, region: 'unknown', step: 'move' }).step).toBe('area');
    const pattern = patterns.find(p => p.action === 'exercise')!;
    expect(evaluateAnswers(pattern, { match: 'yes' }).kind).not.toBe('movement');
    expect(evaluateAnswers(pattern, { emergency: 'no', trauma: 'no', systemic: 'no', match: 'yes' }).kind).not.toBe('movement');
  });
  it('restores the same question when switching language', async () => {
    const user = await startStiffness();
    await user.click(screen.getByRole('button', { name: 'No' }));
    cleanup(); render(<RoutineFinder locale="es" />);
    expect(await screen.findByRole('heading', { name: t('es', 'Did this start after a major fall, collision, crush, or other significant injury?') })).toBeTruthy();
    expect(location.search).toBe('');
  });
  it('keeps urgent answers visible even on an inconsistent legacy link', async () => {
    history.replaceState(null, '', '/en/guide/result/?region=neck&pattern=nonspecific-lower-back&emergency=yes');
    render(<RoutineFinder locale="en" />);
    expect(await screen.findByRole('heading', { name: 'Possible urgent warning sign' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start timer' })).toBeNull();
  });
});
