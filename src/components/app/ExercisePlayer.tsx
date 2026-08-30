import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, Routine } from '../../data/types';
import ExerciseMedia from './ExerciseMedia';
import VoiceToggle from './VoiceToggle';
import { useSpeechGuidance } from './useSpeechGuidance';
import { getExercisePath } from '../../lib/exerciseUrls';

interface Props {
  routine: Routine;
  exercises: Exercise[];
  compact?: boolean;
  initialExerciseId?: string;
  voiceEnabled?: boolean;
  voiceSupported?: boolean;
  onVoiceToggle?: () => void;
}

export default function ExercisePlayer({ routine, exercises, compact = false, initialExerciseId, voiceEnabled, voiceSupported, onVoiceToggle }: Props) {
  const ordered = useMemo(() => routine.exerciseIds.map((id) => exercises.find((exercise) => exercise.id === id)).filter(Boolean) as Exercise[], [routine, exercises]);
  const initialIndex = Math.max(0, ordered.findIndex((exercise) => exercise.id === initialExerciseId));
  const [index, setIndex] = useState(initialIndex);
  const current = ordered[index];
  const [remaining, setRemaining] = useState(current?.seconds ?? 30);
  const [running, setRunning] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('left');
  const halfwayAnnounced = useRef(false);
  const speech = useSpeechGuidance();
  const activeVoice = voiceEnabled ?? speech.enabled;
  const activeVoiceSupported = voiceSupported ?? speech.supported;
  const toggleVoice = onVoiceToggle ?? speech.toggle;

  useEffect(() => {
    setRemaining(current?.seconds ?? 30);
    setRunning(false);
    setSide('left');
    halfwayAnnounced.current = false;
  }, [current]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || remaining < 1 || remaining > 5) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.addEventListener('ended', () => void context.close(), { once: true });
  }, [remaining, running]);

  useEffect(() => {
    if (!current || !running || halfwayAnnounced.current || remaining !== Math.floor(current.seconds / 2)) return;
    halfwayAnnounced.current = true;
    if (activeVoice) speech.speak('Halfway. Keep the movement gentle and keep breathing.');
  }, [remaining, running, current, activeVoice, speech.speak]);

  useEffect(() => {
    if (remaining !== 0 || !running) return;
    setRunning(false);
    if (activeVoice) speech.speak('Hold complete. Relax slowly, then continue when you are ready.');
  }, [remaining, running, activeVoice, speech.speak]);

  if (!current) return null;

  const startOrPauseTimer = () => {
    if (running) {
      setRunning(false);
      if (activeVoice) speech.speak('Timer paused. Resume when you feel ready.');
      return;
    }
    if (remaining === 0) {
      setRemaining(current.seconds);
      halfwayAnnounced.current = false;
    }
    setRunning(true);
    if (activeVoice) speech.speak(`${current.name}. ${current.instructions.join(' ')} ${current.dose}. Timer started. Keep breathing and stop if pain worsens.`);
  };

  const chooseSide = (nextSide: 'left' | 'right') => {
    setSide(nextSide);
    setRemaining(current.seconds);
    setRunning(false);
    halfwayAnnounced.current = false;
    if (activeVoice) speech.speak(`${nextSide} side. Set up comfortably before starting the timer.`);
  };

  const goTo = (nextIndex: number) => {
    speech.stop();
    setIndex(nextIndex);
  };

  const progress = ((index + 1) / ordered.length) * 100;
  return (
    <section aria-label={`${routine.name} exercise player`} className="surface-card overflow-hidden">
      <header className="border-b border-line bg-surface-raised/45 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0" aria-live="polite"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Exercise {index + 1} of {ordered.length}</p><h3 className="mt-2 text-balance text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{current.name}</h3></div>
          <VoiceToggle enabled={activeVoice} supported={activeVoiceSupported} onToggle={toggleVoice} label="Voice guide" />
        </div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true"><div className="h-full rounded-full bg-brand transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
      </header>

      <nav aria-label="Choose another exercise" className="border-b border-line bg-canvas/55 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-sm font-semibold">Choose another exercise</p><p className="mt-1 text-xs leading-5 text-subtle">Not comfortable with this one? Jump to any other option.</p></div>
          <p className="text-xs tabular-nums text-subtle">{ordered.length} options</p>
        </div>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          {ordered.map((exercise, exerciseIndex) => (
            <li key={exercise.id}>
              <button
                type="button"
                aria-current={exerciseIndex === index ? 'true' : undefined}
                aria-label={`Choose ${exercise.name}`}
                onClick={() => goTo(exerciseIndex)}
                className={exerciseIndex === index ? 'flex min-h-14 w-full items-center gap-3 rounded-xl border border-brand bg-brand/10 px-3 text-left text-sm font-semibold text-brand' : 'flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 text-left text-sm font-medium text-muted transition-[border-color,color,background-color] hover:border-line-strong hover:bg-surface-raised hover:text-ink'}
              >
                <span className={exerciseIndex === index ? 'grid size-7 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white' : 'grid size-7 shrink-0 place-items-center rounded-full border border-line bg-canvas text-[11px] font-bold text-subtle'}>{exerciseIndex + 1}</span>
                <span className="leading-5">{exercise.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-8 p-5 sm:p-7 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,.95fr)] xl:p-9">
        <div className="min-w-0">
          <ExerciseMedia exercise={current} />
          <div className="mx-auto mt-5 grid max-w-[30rem] gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-3">
              <div><p className="text-xs font-medium text-subtle">Guided timer</p><p className="font-mono text-2xl font-semibold tabular-nums">{remaining > 0 ? `0:${String(remaining).padStart(2, '0')}` : 'Complete'}</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={startOrPauseTimer} className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-[background-color,opacity] hover:bg-brand-hover">{running ? 'Pause timer' : 'Start timer'}</button>
                <button type="button" onClick={() => { setRemaining(current.seconds); setRunning(false); halfwayAnnounced.current = false; }} className="min-h-11 rounded-lg border border-line bg-surface px-3 text-sm font-semibold transition-[border-color,background-color] hover:border-line-strong hover:bg-surface-raised">Reset</button>
              </div>
              <span className="sr-only" aria-live="polite">{remaining === 0 ? 'Exercise timer complete.' : ''}</span>
            </div>
            {current.bilateral && <div className="flex rounded-xl border border-line bg-canvas p-1" aria-label="Exercise side"><button type="button" aria-pressed={side === 'left'} onClick={() => chooseSide('left')} className={side === 'left' ? 'min-h-11 rounded-lg bg-surface-raised px-4 text-sm font-semibold text-ink' : 'min-h-11 rounded-lg px-4 text-sm font-medium text-muted transition-colors hover:text-ink'}>Left</button><button type="button" aria-pressed={side === 'right'} onClick={() => chooseSide('right')} className={side === 'right' ? 'min-h-11 rounded-lg bg-surface-raised px-4 text-sm font-semibold text-ink' : 'min-h-11 rounded-lg px-4 text-sm font-medium text-muted transition-colors hover:text-ink'}>Right</button></div>}
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line"><div className="bg-canvas p-4"><p className="text-xs text-subtle">Target</p><p className="mt-1 text-sm font-semibold">{current.feltArea}</p></div><div className="bg-canvas p-4"><p className="text-xs text-subtle">Reps / hold</p><p className="mt-1 text-sm font-semibold">{current.dose}</p></div></div>
          <div className="mt-4 rounded-xl border border-brand/25 bg-brand/8 p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand">Expected sensation</p><p className="mt-2 text-sm leading-6 text-muted">{current.expectedSensation}</p></div>
          <h4 className="mt-7 font-semibold">Step-by-step guidance</h4>
          <ol className="mt-4 grid gap-4">{current.instructions.map((instruction, instructionIndex) => <li key={instruction} className="flex gap-3 text-sm leading-6 text-muted"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-canvas text-xs font-semibold text-ink">{instructionIndex + 1}</span><span>{instruction}</span></li>)}</ol>
          {current.bilateral && <p className="mt-5 rounded-xl border border-line bg-canvas p-4 text-sm leading-6 text-muted"><strong className="text-ink">Left / right:</strong> Complete the comfortable side first, reset, then repeat on the other side. Do not force both sides to match.</p>}
          {!compact && <div className="mt-7 grid gap-5 border-t border-line pt-6 text-sm"><div><h4 className="font-semibold">Common mistakes</h4><ul className="mt-2 grid gap-2 text-muted">{current.mistakes.map((mistake) => <li key={mistake} className="flex gap-2"><span className="text-subtle" aria-hidden="true">×</span><span>{mistake}</span></li>)}</ul></div><div className="rounded-xl border border-line bg-canvas p-4"><h4 className="font-semibold">Easier variation</h4><p className="mt-2 leading-6 text-muted">{current.easier}</p></div></div>}
        </div>
      </div>

      <div className="border-t border-danger/30 bg-danger/5 px-5 py-4 text-sm leading-6 text-muted sm:px-7"><strong className="text-danger">Stop if pain worsens.</strong> {current.stopConditions.join('. ')}.</div>
      <footer className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-7"><button type="button" disabled={index === 0} onClick={() => goTo(index - 1)} className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold transition-[border-color,opacity] hover:not-disabled:border-line-strong disabled:cursor-not-allowed disabled:opacity-40">Previous</button><a href={getExercisePath(current.id)} className="hidden text-sm font-medium text-brand transition-colors hover:text-brand-hover sm:block">Open exercise guide</a><button type="button" disabled={index === ordered.length - 1} onClick={() => goTo(index + 1)} className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-canvas transition-opacity hover:not-disabled:opacity-85 disabled:cursor-not-allowed disabled:opacity-40">Skip to next</button></footer>
    </section>
  );
}
