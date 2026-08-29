// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import PainFinder from './PainFinder';

afterEach(cleanup);

describe('PainFinder', () => {
  it('moves directly from body selection to pattern choices and can change the area', async () => {
    const user = userEvent.setup();
    render(<PainFinder />);

    await user.click(screen.getByRole('button', { name: 'Select Chest' }));

    expect(screen.getByRole('heading', { name: 'Chest' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Which symptom pattern sounds closest?' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Choose from the list' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Change pain area' }));

    expect(screen.getByRole('heading', { name: 'Tap where it hurts.' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Choose from the list' })).toBeTruthy();
  });

  it('completes a movement-appropriate lower-back path', async () => {
    const user = userEvent.setup();
    render(<PainFinder />);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Select Lower back' }));
    await user.click(screen.getAllByRole('button', { name: 'This sounds like me' })[0]);

    for (const answer of ['No', 'No', 'No', 'No', 'Yes']) {
      await user.click(screen.getByRole('button', { name: answer }));
    }

    expect(screen.getByRole('heading', { name: 'Gentle movement may be appropriate' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Start Lower-back ease/ })).toBeTruthy();
  });

  it('stops immediately when a chest emergency warning is selected', async () => {
    const user = userEvent.setup();
    render(<PainFinder />);
    await user.click(screen.getByRole('button', { name: 'Select Chest' }));
    await user.click(screen.getAllByRole('button', { name: 'This sounds like me' })[0]);
    await user.click(screen.getByRole('button', { name: 'Yes' }));

    expect(screen.getByRole('heading', { name: 'Possible urgent warning sign' })).toBeTruthy();
    expect(screen.queryByText(/Start chest-wall routine/)).toBeNull();
  });
});
