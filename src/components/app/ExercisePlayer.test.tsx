// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { exercises, routines } from '../../data/exercises';
import ExercisePlayer from './ExercisePlayer';

afterEach(cleanup);

describe('ExercisePlayer', () => {
  it('supports routine navigation and bilateral selection', async () => {
    const user = userEvent.setup();
    const routine = routines.find((item) => item.id === 'neck-reset')!;
    render(<ExercisePlayer routine={routine} exercises={exercises} />);

    expect(screen.getByRole('heading', { name: 'Lateral neck stretch' })).toBeTruthy();
    expect(screen.getByText('3 options')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Skip to next' }));
    expect(screen.getByRole('heading', { name: 'Gentle chin tuck' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Choose Open-book rotation' }));
    expect(screen.getByRole('heading', { name: 'Open-book rotation' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { name: 'Gentle chin tuck' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Choose Lateral neck stretch' }));
    await user.click(screen.getByRole('button', { name: 'Right' }));
    expect(screen.getByRole('button', { name: 'Right' }).getAttribute('aria-pressed')).toBe('true');
  });
});
