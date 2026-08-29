// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import BodyModel from './BodyModel';

vi.mock('@google/model-viewer', () => ({}));

class FakeModelViewer extends HTMLElement {
  loaded = false;
  cameraOrbit = '';
  cameraTarget = '';
  hit: { position: { x: number; y: number; z: number }; normal: { x: number; y: number; z: number }; uv: null } | null = null;

  getCameraTarget() {
    return { x: 0, y: 0, z: 0 };
  }

  positionAndNormalFromPoint() {
    return this.hit;
  }
}

beforeAll(() => {
  if (!customElements.get('model-viewer')) customElements.define('model-viewer', FakeModelViewer);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('BodyModel', () => {
  it('leaves the loading state when model-viewer emits its native load event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<BodyModel onSelect={() => undefined} />);

    const viewer = await waitFor(() => {
      const element = document.querySelector('model-viewer') as FakeModelViewer | null;
      expect(element).toBeTruthy();
      return element!;
    });
    expect(screen.getByText(/Loading body model/)).toBeTruthy();

    viewer!.loaded = true;
    viewer!.dispatchEvent(new Event('load'));

    await waitFor(() => expect(screen.queryByText(/Loading body model/)).toBeNull());
    expect(screen.queryByText('Human model unavailable')).toBeNull();
  });

  it('leaves the loading state when model-viewer is loaded but its event is missed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<BodyModel onSelect={() => undefined} />);

    const viewer = await waitFor(() => {
      const element = document.querySelector('model-viewer') as FakeModelViewer | null;
      expect(element).toBeTruthy();
      return element!;
    });
    expect(screen.getByText(/Loading body model/)).toBeTruthy();

    viewer.loaded = true;

    await waitFor(
      () => expect(screen.queryByText(/Loading body model/)).toBeNull(),
      { timeout: 1_000 },
    );
    expect(screen.queryByText('Human model unavailable')).toBeNull();
  });

  it('selects the nearest region when the user taps the body mesh', async () => {
    const onSelect = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<BodyModel onSelect={onSelect} />);

    const viewer = await waitFor(() => {
      const element = document.querySelector('model-viewer') as unknown as FakeModelViewer | null;
      expect(element).toBeTruthy();
      return element!;
    });
    viewer.hit = {
      position: { x: 0, y: 0.305, z: 0.13 },
      normal: { x: 0, y: 0, z: 1 },
      uv: null,
    };
    viewer.loaded = true;
    viewer.dispatchEvent(new Event('load'));
    await waitFor(() => expect(screen.queryByText(/Loading body model/)).toBeNull());

    fireEvent.pointerDown(viewer, { clientX: 120, clientY: 180 });
    fireEvent.pointerUp(viewer, { clientX: 123, clientY: 182 });

    expect(onSelect).toHaveBeenCalledWith('chest');
  });
});
