// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PainFinder from './PainFinder';
import { routines } from '../../data/exercises';
import { formatTranslation, t, type Locale } from '../../i18n';
import { localizeRoutine } from '../../i18n/content';

vi.mock('./BodyModel', () => ({ default: () => <div data-testid="body-model" /> }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('PainFinder URL-driven pages', () => {
  it('enables voice guidance only after the visible guide has been scrolled to', async () => {
    let intersectionCallback: IntersectionObserverCallback | undefined;
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn(),
    });
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      rate = 1;
      pitch = 1;
      volume = 1;
      constructor(public text: string) {}
    });
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { intersectionCallback = callback; }
      observe() { intersectionCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '0px';
      thresholds = [0.1];
    });

    render(<PainFinder initialStep="finder" initialSearch="" onNavigate={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'Voice guide: off' })).toBeTruthy();

    window.dispatchEvent(new Event('scroll'));

    expect(await screen.findByRole('button', { name: 'Voice guide: on' })).toBeTruthy();
  });

  it('navigates to a URL-backed region selection', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<PainFinder initialStep="finder" initialSearch="" onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: 'Select Chest' }));

    expect(onNavigate).toHaveBeenCalledWith('/guide/locate/?region=chest');
  });

  it('restores a selected region on the locate page', () => {
    render(<PainFinder initialStep="finder" initialSearch="?region=chest" onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Chest' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Which symptom pattern sounds closest?' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Choose from the list' })).toBeNull();
  });

  it('carries each safety answer and the question index into the next URL', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<PainFinder
      initialStep="questions"
      initialSearch="?region=lower-back&pattern=nonspecific-lower-back&question=0"
      onNavigate={onNavigate}
    />);

    await user.click(screen.getByRole('button', { name: 'No' }));

    expect(onNavigate).toHaveBeenCalledWith('/guide/screen/?region=lower-back&pattern=nonspecific-lower-back&question=1&emergency=no');
  });

  it('restores a completed movement-appropriate result from URL parameters', () => {
    render(<PainFinder
      initialStep="result"
      initialSearch="?region=lower-back&pattern=nonspecific-lower-back&question=4&emergency=no&trauma=no&systemic=no&function=no&match=yes"
      onNavigate={vi.fn()}
    />);

    expect(screen.getByRole('heading', { name: 'Gentle movement may be appropriate' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Start Lower-back ease/ })).toBeTruthy();
  });

  it.each(['es', 'fr', 'de', 'pt'] as Locale[])('shows and opens the same recommended routine in %s', async (locale) => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const routine = routines.find((item) => item.id === 'lower-back-ease');
    if (!routine) throw new Error('Missing lower-back test routine');
    const localizedRoutine = localizeRoutine(locale, routine);

    render(<PainFinder
      initialStep="result"
      initialSearch="?region=lower-back&pattern=nonspecific-lower-back&question=4&emergency=no&trauma=no&systemic=no&function=no&match=yes"
      locale={locale}
      onNavigate={onNavigate}
    />);

    const startButton = screen.getByRole('button', { name: formatTranslation(locale, 'Start {routine}', { routine: localizedRoutine.name }) });
    await user.click(startButton);

    expect(onNavigate).toHaveBeenCalledWith(`/${locale}/guide/move/?region=lower-back&pattern=nonspecific-lower-back&emergency=no&trauma=no&systemic=no&function=no&match=yes&exercise=pelvic-tilt`);
  });

  it('restores an urgent early-exit result from its URL', () => {
    render(<PainFinder
      initialStep="result"
      initialSearch="?region=chest&pattern=pectoral-muscle-strain&question=0&emergency=yes"
      onNavigate={vi.fn()}
    />);

    expect(screen.getByRole('heading', { name: 'Possible urgent warning sign' })).toBeTruthy();
    expect(screen.queryByText(/Start chest-wall routine/)).toBeNull();
  });

  it('sends an incomplete direct result URL back to the first unanswered question', async () => {
    const onNavigate = vi.fn();
    render(<PainFinder
      initialStep="result"
      initialSearch="?region=lower-back&pattern=nonspecific-lower-back&question=4&match=yes"
      onNavigate={onNavigate}
    />);

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('/guide/screen/?region=lower-back&pattern=nonspecific-lower-back&question=0&match=yes'));
  });

  it('opens a requested exercise in the player with a safety reminder', () => {
    render(<PainFinder
      initialStep="routine"
      initialSearch="?exercise=open-book&entry=exercise"
      onNavigate={vi.fn()}
    />);

    expect(screen.getByRole('heading', { name: 'Open-book rotation' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Run the safety check first/ })).toBeTruthy();
    expect(screen.getByText(/Direct exercise entry/)).toBeTruthy();
  });

  it('keeps the selected routine exercise in the URL', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/guide/move/?exercise=open-book&entry=exercise');
    render(<PainFinder
      initialStep="routine"
      initialSearch={window.location.search}
      onNavigate={vi.fn()}
    />);

    await user.click(screen.getByRole('button', { name: 'Choose Chair thoracic extension' }));

    expect(window.location.pathname).toBe('/guide/move/');
    expect(window.location.search).toBe('?region=upper-back&pattern=thoracic-muscle-strain&exercise=thoracic-extension&entry=exercise');
  });

  it('keeps a localized routine and exercise change under the active locale', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/fr/guide/move/?exercise=open-book&entry=exercise');
    render(<PainFinder
      initialStep="routine"
      initialSearch={window.location.search}
      locale="fr"
      onNavigate={vi.fn()}
    />);

    await user.click(screen.getByRole('button', { name: formatTranslation('fr', 'Choose {exercise}', { exercise: t('fr', 'Chair thoracic extension') }) }));

    expect(window.location.pathname).toBe('/fr/guide/move/');
    expect(window.location.search).toBe('?region=upper-back&pattern=thoracic-muscle-strain&exercise=thoracic-extension&entry=exercise');
  });
});
