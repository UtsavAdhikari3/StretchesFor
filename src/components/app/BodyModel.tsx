import { createElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';
import { bodyRegions, getBodyRegionHotspot, type BodyRegionView } from '../../data/bodyRegions';

interface Props {
  selectedId?: string;
  onSelect: (id: string) => void;
}

const viewCameras: Record<BodyRegionView, { orbit: string; target: string }> = {
  front: { orbit: '0deg 78deg 2.35m', target: '0m 0m 0m' },
  back: { orbit: '180deg 78deg 2.35m', target: '0m 0m 0m' },
  left: { orbit: '-90deg 78deg 2.35m', target: '0m 0m 0m' },
  right: { orbit: '90deg 78deg 2.35m', target: '0m 0m 0m' },
};

// bodyRegions uses the project convention of feet at y=0. The bundled
// HuBMAP mesh is centred vertically, with its feet at approximately y=-0.915m.
const MODEL_Y_OFFSET = -0.915;

function offsetModelY(vector: string) {
  const parts = vector.split(' ');
  const y = Number.parseFloat(parts[1]);
  if (parts.length !== 3 || Number.isNaN(y)) return vector;
  return `${parts[0]} ${(y + MODEL_Y_OFFSET).toFixed(3)}m ${parts[2]}`;
}

type ModelStatus = 'checking' | 'loading' | 'ready' | 'missing' | 'error';

export default function BodyModel({ selectedId, onSelect }: Props) {
  const viewerId = useId();
  const modelRef = useRef<ModelViewerElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const [status, setStatus] = useState<ModelStatus>('loading');
  const [activeView, setActiveView] = useState<BodyRegionView | undefined>('front');
  const selected = useMemo(() => getBodyRegionHotspot(selectedId), [selectedId]);

  const moveCamera = (orbit: string, target: string) => {
    const model = modelRef.current;
    if (!model) return;
    model.cameraOrbit = orbit;
    model.cameraTarget = target;
  };

  const chooseView = (view: BodyRegionView) => {
    setActiveView(view);
    moveCamera(viewCameras[view].orbit, viewCameras[view].target);
  };

  const resetCamera = () => {
    setActiveView('front');
    const model = modelRef.current;
    if (!model) return;
    model.fieldOfView = '30deg';
    moveCamera(viewCameras.front.orbit, viewCameras.front.target);
  };

  const zoomCamera = (direction: 'in' | 'out') => {
    const model = modelRef.current;
    if (!model || status !== 'ready') return;
    model.zoom(direction === 'in' ? 1 : -1);
  };

  useEffect(() => {
    const controller = new AbortController();
    async function prepareModel() {
      try {
        await import('@google/model-viewer');
        await customElements.whenDefined('model-viewer');
        if (!controller.signal.aborted) setStatus('loading');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setStatus('error');
      }
    }
    void prepareModel();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const model = modelRef.current;
    if (!model || status !== 'loading') return;

    const handleLoad = () => setStatus('ready');
    const handleError = () => setStatus('error');
    model.addEventListener('load', handleLoad);
    model.addEventListener('error', handleError);

    // A cached model can finish between the ref callback and this effect.
    if (model.loaded) handleLoad();

    // model-viewer marks `loaded` before its final render-frame bookkeeping.
    // Poll that source of truth so a throttled/missed load event cannot leave
    // the visual loading overlay in place forever.
    const loadedPoll = window.setInterval(() => {
      if (model.loaded) handleLoad();
    }, 250);

    const timeout = window.setTimeout(() => {
      if (model.loaded) handleLoad();
      else handleError();
    }, 30_000);

    return () => {
      window.clearInterval(loadedPoll);
      window.clearTimeout(timeout);
      model.removeEventListener('load', handleLoad);
      model.removeEventListener('error', handleError);
    };
  }, [status]);

  useEffect(() => {
    if (!selected || status === 'missing') return;
    setActiveView(selected.preferredView);
    moveCamera(selected.cameraOrbit, offsetModelY(selected.cameraTarget));
  }, [selected, status]);

  useEffect(() => {
    const model = modelRef.current;
    if (!model || status !== 'ready') return;
    const handleCameraChange = (event: Event) => {
      const target = model.getCameraTarget();
      const x = Math.max(-0.6, Math.min(0.6, target.x));
      const y = Math.max(-0.9, Math.min(0.9, target.y));
      const z = Math.max(-0.45, Math.min(0.45, target.z));
      if (x !== target.x || y !== target.y || z !== target.z) model.cameraTarget = `${x}m ${y}m ${z}m`;

      if ((event as CustomEvent<{ source?: string }>).detail?.source !== 'user-interaction') return;
      const theta = model.getCameraOrbit().theta * 180 / Math.PI;
      const normalizedTheta = ((theta % 360) + 360) % 360;
      const presets: Array<[BodyRegionView, number]> = [
        ['front', 0],
        ['right', 90],
        ['back', 180],
        ['left', 270],
      ];
      const nearest = presets.find(([, angle]) => {
        const difference = Math.abs(normalizedTheta - angle);
        return Math.min(difference, 360 - difference) <= 8;
      });
      setActiveView(nearest?.[0]);
    };
    model.addEventListener('camera-change', handleCameraChange);
    return () => model.removeEventListener('camera-change', handleCameraChange);
  }, [status]);

  useEffect(() => {
    const model = modelRef.current;
    if (!model || status !== 'ready') return;

    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest?.('.body-hotspot')) return;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = undefined;
      if (!start || (event.target as Element | null)?.closest?.('.body-hotspot')) return;

      // Keep drag-to-rotate intact: only a short, nearly stationary gesture
      // is interpreted as selecting a point on the body.
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;

      const hit = model.positionAndNormalFromPoint(event.clientX, event.clientY);
      if (!hit) return;

      const nearest = bodyRegions.reduce<{ id: string; score: number } | undefined>((best, region) => {
        const [x, y, z] = offsetModelY(region.hotspotPosition).split(' ').map(Number.parseFloat);
        const [nx, ny, nz] = region.hotspotNormal.split(' ').map(Number.parseFloat);
        const distance = (hit.position.x - x) ** 2 + (hit.position.y - y) ** 2 + (hit.position.z - z) ** 2;
        const normalLength = Math.hypot(nx, ny, nz) || 1;
        const hitNormalLength = Math.hypot(hit.normal.x, hit.normal.y, hit.normal.z) || 1;
        const alignment = (hit.normal.x * nx + hit.normal.y * ny + hit.normal.z * nz) / (normalLength * hitNormalLength);
        const score = distance + (1 - alignment) * 0.025;
        return !best || score < best.score ? { id: region.id, score } : best;
      }, undefined);

      if (nearest) onSelect(nearest.id);
    };

    model.addEventListener('pointerdown', handlePointerDown);
    model.addEventListener('pointerup', handlePointerUp);
    return () => {
      model.removeEventListener('pointerdown', handlePointerDown);
      model.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onSelect, status]);

  const modelChildren = bodyRegions.map((region) => createElement(
    'button',
    {
      key: region.id,
      type: 'button',
      slot: `hotspot-${region.id}`,
      'data-position': offsetModelY(region.hotspotPosition),
      'data-normal': region.hotspotNormal,
      'data-region-id': region.id,
      'aria-label': `Select ${region.label}`,
      'aria-pressed': selectedId === region.id,
      className: `${selectedId === region.id ? 'body-hotspot is-selected' : 'body-hotspot'}${region.id.startsWith('left-') ? ' label-left' : ''}`,
      onClick: () => onSelect(region.id),
    },
    createElement('span', { className: 'hotspot-dot', 'aria-hidden': 'true' }),
    createElement('span', { className: 'hotspot-label' }, region.label),
  ));

  const viewer = status === 'loading' || status === 'ready'
    ? createElement('model-viewer', {
        ref: (element: ModelViewerElement | null) => { modelRef.current = element; },
        id: viewerId,
        src: '/models/human-body.glb',
        alt: 'Interactive neutral human body model for selecting a pain region',
        class: 'body-model-viewer',
        'camera-controls': true,
        'touch-action': 'pan-y',
        'disable-tap': true,
        'camera-orbit': viewCameras.front.orbit,
        'camera-target': viewCameras.front.target,
        'min-camera-orbit': 'auto 55deg 0.85m',
        'max-camera-orbit': 'auto 105deg 3.4m',
        'min-field-of-view': '18deg',
        'max-field-of-view': '48deg',
        exposure: '0.9',
        'shadow-intensity': '0',
        'interpolation-decay': '120',
        'orbit-sensitivity': '0.85',
        'zoom-sensitivity': '0.75',
        'pan-sensitivity': '0.3',
        'interaction-prompt': 'auto',
        'interaction-prompt-threshold': '1800',
        loading: 'eager',
        reveal: 'auto',
      }, ...modelChildren)
    : null;

  return (
    <div>
      <div className="relative min-h-[34rem] overflow-hidden rounded-2xl border border-line bg-canvas sm:min-h-[42rem]">
        {viewer}
        {(status === 'checking' || status === 'loading') && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-canvas/72 p-8 text-center" aria-live="polite">
            <div>
              <span className="mx-auto block size-7 animate-spin rounded-full border-2 border-line border-t-brand motion-reduce:animate-none" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold">Loading body model…</p>
              <p className="mt-1 text-xs text-subtle">The region list remains available while it loads.</p>
            </div>
          </div>
        )}
        {(status === 'missing' || status === 'error') && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center" role="status">
            <div className="max-w-sm">
              <span className="mx-auto grid size-14 place-items-center rounded-xl border border-line bg-surface text-brand" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21"/></svg>
              </span>
              <h3 className="mt-5 text-lg font-semibold">Human model unavailable</h3>
              <p className="mt-2 text-sm leading-6 text-muted">The 3D model could not be loaded. Select any region from the accessible text list and try reloading the page.</p>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
          <span className="rounded-lg border border-line bg-surface/90 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md">Tap a point to select <span aria-hidden="true">·</span> Drag to rotate</span>
          {selected && <span className="max-w-[55%] rounded-lg border border-brand/40 bg-brand/12 px-3 py-2 text-right text-xs font-semibold text-brand shadow-sm backdrop-blur-md">Selected · {selected.label}</span>}
        </div>
        <div className="absolute bottom-3 right-3 grid gap-1 rounded-xl border border-line bg-surface/92 p-1 shadow-lg backdrop-blur-md sm:bottom-4 sm:right-4" role="group" aria-label="Zoom and reset 3D body" aria-controls={viewerId}>
          <button type="button" aria-label="Zoom in" onClick={() => zoomCamera('in')} disabled={status !== 'ready'} className="grid size-11 place-items-center rounded-lg text-xl font-medium text-muted transition-[color,background-color,transform] hover:bg-surface-raised hover:text-ink active:scale-95 disabled:cursor-wait disabled:opacity-40 motion-reduce:active:scale-100">+</button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomCamera('out')} disabled={status !== 'ready'} className="grid size-11 place-items-center rounded-lg text-2xl font-light text-muted transition-[color,background-color,transform] hover:bg-surface-raised hover:text-ink active:scale-95 disabled:cursor-wait disabled:opacity-40 motion-reduce:active:scale-100">−</button>
          <span className="mx-2 h-px bg-line" aria-hidden="true" />
          <button type="button" aria-label="Reset 3D body view" onClick={resetCamera} disabled={status !== 'ready'} className="grid size-11 place-items-center rounded-lg text-muted transition-[color,background-color,transform] hover:bg-surface-raised hover:text-ink active:scale-95 disabled:cursor-wait disabled:opacity-40 motion-reduce:active:scale-100">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4.9 8.6A8 8 0 1 1 4 14"/><path d="M4 4v5h5"/></svg>
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl border border-line bg-canvas p-1 sm:flex-none" role="group" aria-label="View body from" aria-controls={viewerId}>
          {(['front', 'back', 'left', 'right'] as const).map((view) => (
            <button key={view} type="button" aria-label={`${view[0].toUpperCase()}${view.slice(1)}`} aria-pressed={activeView === view} onClick={() => chooseView(view)} disabled={status !== 'ready'} className={activeView === view ? 'min-h-10 flex-1 rounded-lg bg-brand/14 px-3 text-sm font-semibold capitalize text-brand disabled:cursor-wait disabled:opacity-40 sm:flex-none' : 'min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold capitalize text-muted transition-[color,background-color] hover:bg-surface-raised hover:text-ink disabled:cursor-wait disabled:opacity-40 sm:flex-none'}>{view}</button>
          ))}
        </div>
        <p className="text-xs leading-5 text-subtle sm:ml-auto">Pinch or scroll to zoom <span aria-hidden="true">·</span> Two-finger or right-drag to pan</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-subtle">3D body model: <a className="text-muted underline decoration-line-strong underline-offset-4 hover:text-ink" href="https://humanatlas.io/3d-reference-library" rel="license">HuBMAP Human Reference Atlas</a>, licensed under <a className="text-muted underline decoration-line-strong underline-offset-4 hover:text-ink" href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>.</p>
    </div>
  );
}
