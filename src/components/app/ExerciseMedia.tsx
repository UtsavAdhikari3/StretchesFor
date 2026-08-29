import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/types';

export default function ExerciseMedia({ exercise }: { exercise: Exercise }) {
  const demoUrl = exercise.externalExerciseId
    ? `https://static.exercisedb.dev/media/${encodeURIComponent(exercise.externalExerciseId)}.gif`
    : undefined;
  const [status, setStatus] = useState<'ready' | 'unavailable'>(demoUrl ? 'ready' : 'unavailable');
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!demoUrl) {
      setStatus('unavailable');
      return;
    }
    const shouldPlay = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setPlaying(shouldPlay);
    setStatus('ready');
  }, [demoUrl]);

  return (
    <figure>
      <div className="relative mx-auto grid min-h-80 w-full max-w-sm place-items-center overflow-hidden rounded-2xl border border-line bg-canvas p-5">
        {demoUrl && status === 'ready' && playing && <img src={demoUrl} alt={`${exercise.name} exercise demonstration`} width="180" height="180" loading="lazy" decoding="async" className="size-[11.25rem] max-w-full rounded-xl bg-white object-contain" onError={() => setStatus('unavailable')} />}
        {status === 'ready' && !playing && <div className="max-w-xs text-center" role="status"><span className="mx-auto grid size-12 place-items-center rounded-full border border-line bg-surface text-brand" aria-hidden="true">Ⅱ</span><p className="mt-4 font-semibold">Demonstration paused</p><p className="mt-2 text-sm leading-6 text-muted">Use the written steps while motion is paused.</p></div>}
        {status === 'unavailable' && <div className="max-w-xs text-center" role="status"><span className="mx-auto grid size-12 place-items-center rounded-xl border border-line bg-surface text-subtle" aria-hidden="true">—</span><p className="mt-4 font-semibold">Exercise demonstration unavailable.</p><p className="mt-2 text-sm leading-6 text-muted">Do not substitute another movement. Follow only the written instructions below.</p></div>}
        {status === 'ready' && <button type="button" onClick={() => setPlaying((value) => !value)} className="absolute bottom-3 left-1/2 min-h-11 -translate-x-1/2 rounded-lg border border-line bg-surface/95 px-4 text-sm font-semibold shadow-xl backdrop-blur-md transition-[border-color,background-color] hover:border-line-strong hover:bg-surface-raised">{playing ? 'Pause demonstration' : 'Play demonstration'}</button>}
      </div>
      <figcaption className="mx-auto mt-3 max-w-sm text-center text-xs leading-5 text-subtle">Shown at its native resolution for a sharper demonstration. ExerciseDB supplies the media; StretchesFor supplies the safety guidance.</figcaption>
    </figure>
  );
}
