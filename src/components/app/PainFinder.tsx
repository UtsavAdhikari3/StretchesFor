import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BodyModel from './BodyModel';
import ExercisePlayer from './ExercisePlayer';
import VoiceToggle from './VoiceToggle';
import { useSpeechGuidance } from './useSpeechGuidance';
import { bodyRegionGroups, bodyRegions, getBodyRegionHotspot, type BodyRegionHotspot } from '../../data/bodyRegions';
import { getRegion, patterns, questionsFor } from '../../data/content';
import { exercises, routines } from '../../data/exercises';
import type { Answer, PainPattern } from '../../data/types';
import { evaluateAnswers, type AnswerMap } from '../../lib/triage';

type Step = 'finder' | 'questions' | 'result' | 'routine';

const answerOptions: Array<{ value: Answer; label: string; hint: string; symbol: string }> = [
  { value: 'yes', label: 'Yes', hint: 'This is present', symbol: '✓' },
  { value: 'no', label: 'No', hint: 'This is not present', symbol: '×' },
  { value: 'unsure', label: 'Not sure', hint: 'You cannot tell', symbol: '?' },
];

const flowSteps = [
  { id: 'finder', label: 'Locate' },
  { id: 'questions', label: 'Screen' },
  { id: 'result', label: 'Guide' },
  { id: 'routine', label: 'Move' },
] as const;

export default function PainFinder() {
  const patternSelectionRef = useRef<HTMLDivElement>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<BodyRegionHotspot>();
  const [pattern, setPattern] = useState<PainPattern>();
  const [step, setStep] = useState<Step>('finder');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [initialExerciseId, setInitialExerciseId] = useState<string>();
  const [needsSafetyCheck, setNeedsSafetyCheck] = useState(false);
  const speech = useSpeechGuidance();
  const region = useMemo(() => getRegion(selectedHotspot?.contentRegionId ?? ''), [selectedHotspot]);
  const regionPatterns = useMemo(() => patterns.filter((item) => item.regionId === region?.id), [region]);
  const questions = useMemo(() => pattern ? questionsFor(pattern) : [], [pattern]);
  const result = useMemo(() => pattern ? evaluateAnswers(pattern, answers) : undefined, [pattern, answers]);
  const routine = useMemo(() => pattern?.routineId ? routines.find((item) => item.id === pattern.routineId) : undefined, [pattern]);

  const chooseRegion = useCallback((id: string) => {
    const next = getBodyRegionHotspot(id);
    if (!next) return;
    setSelectedHotspot(next);
    setPattern(undefined);
    setAnswers({});
    setQuestionIndex(0);
    setInitialExerciseId(undefined);
    setNeedsSafetyCheck(false);
    setStep('finder');
  }, []);

  const choosePattern = (next: PainPattern) => {
    setPattern(next);
    setAnswers({});
    setQuestionIndex(0);
    setInitialExerciseId(undefined);
    setNeedsSafetyCheck(false);
    setStep(next.action === 'urgent-care' ? 'result' : 'questions');
  };

  const answerQuestion = (answer: Answer) => {
    const question = questions[questionIndex];
    const nextAnswers = { ...answers, [question.id]: answer };
    setAnswers(nextAnswers);
    if (question.id === 'emergency' && answer === 'yes') {
      setStep('result');
      return;
    }
    if (questionIndex === questions.length - 1) setStep('result');
    else setQuestionIndex((value) => value + 1);
  };

  const reset = () => {
    speech.stop();
    setSelectedHotspot(undefined);
    setPattern(undefined);
    setAnswers({});
    setQuestionIndex(0);
    setInitialExerciseId(undefined);
    setNeedsSafetyCheck(false);
    setStep('finder');
  };

  const changeRegion = () => {
    setSelectedHotspot(undefined);
    setPattern(undefined);
    setAnswers({});
    setQuestionIndex(0);
    setInitialExerciseId(undefined);
    setNeedsSafetyCheck(false);
    setStep('finder');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exerciseId = params.get('exercise');
    const regionId = params.get('region');
    const patternId = params.get('pattern');

    if (exerciseId) {
      const exercise = exercises.find((item) => item.id === exerciseId);
      const directRoutine = exercise ? routines.find((item) => item.exerciseIds.includes(exercise.id)) : undefined;
      const directPattern = directRoutine ? patterns.find((item) => item.routineId === directRoutine.id && item.action === 'exercise') : undefined;
      const hotspot = exercise ? bodyRegions.find((item) => item.contentRegionId === exercise.regionId) : undefined;
      if (exercise && directRoutine && directPattern && hotspot) {
        setSelectedHotspot(hotspot);
        setPattern(directPattern);
        setInitialExerciseId(exercise.id);
        setNeedsSafetyCheck(true);
        setStep('routine');
        return;
      }
    }

    if (!regionId) return;
    const hotspot = getBodyRegionHotspot(regionId) ?? bodyRegions.find((item) => item.contentRegionId === regionId);
    if (!hotspot) return;
    setSelectedHotspot(hotspot);
    const selectedPattern = patternId ? patterns.find((item) => item.id === patternId && item.regionId === hotspot.contentRegionId) : undefined;
    if (selectedPattern) {
      setPattern(selectedPattern);
      setStep(selectedPattern.action === 'urgent-care' ? 'result' : 'questions');
    }
  }, []);

  useEffect(() => {
    if (!selectedHotspot || step !== 'finder') return;
    const frame = window.requestAnimationFrame(() => {
      const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      patternSelectionRef.current?.scrollIntoView?.({ behavior, block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedHotspot, step]);

  useEffect(() => {
    if (!speech.enabled) return;
    if (step === 'finder' && !selectedHotspot) speech.speak('Where does it hurt? Rotate the body, or choose a region from the text list.');
    if (step === 'finder' && selectedHotspot) speech.speak(`${selectedHotspot.label} selected. Compare the possible symptom patterns below.`);
    if (step === 'questions' && questions[questionIndex]) {
      const question = questions[questionIndex];
      speech.speak(`${question.prompt} ${question.help ?? ''} Choose yes, no, or not sure.`);
    }
    if (step === 'result' && result) speech.speak(`${result.title}. ${result.description} ${result.nextStep}`);
  }, [speech.enabled, speech.speak, step, selectedHotspot?.id, questions, questionIndex, result]);

  const activeStepIndex = flowSteps.findIndex((item) => item.id === step);
  const progress = step === 'finder' ? (selectedHotspot ? 28 : 10) : step === 'questions' ? 35 + ((questionIndex + 1) / Math.max(questions.length, 1)) * 35 : step === 'result' ? 85 : 100;
  const isChoosingRegion = selectedHotspot === undefined;

  return (
    <div className="surface-card overflow-hidden shadow-[0_28px_80px_-48px_rgba(0,0,0,.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-raised/40 px-5 py-4 sm:px-7">
        <div className="min-w-0"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" aria-hidden="true" /><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Private browser session</p></div><p className="mt-1 text-sm text-muted">Answers exist only in temporary JavaScript memory.</p></div>
        <div className="flex flex-wrap gap-2"><VoiceToggle enabled={speech.enabled} supported={speech.supported} onToggle={speech.toggle} label="Voice guide" />{(selectedHotspot || step !== 'finder') && <button type="button" onClick={reset} className="min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-muted transition-[border-color,color,background-color] hover:border-line-strong hover:bg-surface-raised hover:text-ink">Start over</button>}</div>
      </div>
      <div className="h-1 bg-line" aria-hidden="true"><div className="h-full bg-brand transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
      <div className="border-b border-line px-5 py-4 sm:px-7"><ol className="grid grid-cols-4 gap-2" aria-label="Pain finder progress">{flowSteps.map((item, index) => <li key={item.id} aria-current={index === activeStepIndex ? 'step' : undefined} className="min-w-0"><div className="flex items-center gap-2"><span className={index < activeStepIndex ? 'grid size-6 shrink-0 place-items-center rounded-full bg-success text-[10px] font-bold text-white' : index === activeStepIndex ? 'grid size-6 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-white' : 'grid size-6 shrink-0 place-items-center rounded-full border border-line bg-canvas text-[10px] font-bold text-subtle'}>{index < activeStepIndex ? '✓' : index + 1}</span><span className={index === activeStepIndex ? 'truncate text-xs font-semibold' : 'truncate text-xs font-medium text-subtle'}>{item.label}</span></div></li>)}</ol></div>

      <div className="p-5 sm:p-7 lg:p-9">
        {step === 'finder' && <section aria-labelledby="region-heading">
          {isChoosingRegion && <>
          <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold text-brand">Interactive pain finder</p><h2 id="region-heading" className="mt-2 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Tap where it hurts.</h2><p className="mt-3 text-pretty leading-7 text-muted">Tap directly on the body, choose a visible marker, or use the text list. Drag the model when you need to see another side.</p></div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
            <BodyModel onSelect={chooseRegion} />
            <div className="min-w-0 rounded-2xl border border-line bg-canvas p-4 sm:p-5">
              <div><h3 className="font-semibold">Choose from the list</h3><p className="mt-1 text-xs leading-5 text-subtle">24 precise regions</p></div>
              <div className="mt-5 grid gap-6 xl:max-h-[38rem] xl:overflow-y-auto xl:pr-2">
                {bodyRegionGroups.map((group) => (
                  <fieldset key={group}>
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-subtle">{group}</legend>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {bodyRegions.filter((item) => item.group === group).map((item) => (
                        <button key={item.id} type="button" aria-label={`Select ${item.label}`} onClick={() => chooseRegion(item.id)} className="min-h-11 rounded-lg border border-line bg-surface px-3 text-left text-sm font-medium text-muted transition-[border-color,color,background-color] hover:border-line-strong hover:bg-surface-raised hover:text-ink">{item.label}</button>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          </div>
          </>}

          {selectedHotspot && region && (
            <div ref={patternSelectionRef} className="scroll-mt-24 rounded-2xl border border-brand/30 bg-brand/8 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5" aria-live="polite">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Pain area selected</p>
                <h2 id="region-heading" className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{selectedHotspot.label}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">Next, choose the description that feels closest.</p>
              </div>
              <button type="button" onClick={changeRegion} className="mt-4 min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-muted transition-[border-color,color,background-color] hover:border-line-strong hover:bg-surface-raised hover:text-ink sm:mt-0 sm:shrink-0">Change pain area</button>
            </div>
          )}

          {selectedHotspot && region && <div className="mt-9 border-t border-line pt-8" aria-live="polite"><p className="text-sm font-semibold text-brand">Possible causes · {selectedHotspot.label}</p><h3 className="mt-2 text-balance text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Which symptom pattern sounds closest?</h3><p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">These descriptions overlap and cannot identify the cause. Choose one only to run its deterministic safety path.</p><div className="mt-6 grid gap-4 lg:grid-cols-2">{regionPatterns.map((item) => <article key={item.id} className="surface-card group flex flex-col p-5 transition-[border-color,transform,background-color] hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-raised/35 motion-reduce:hover:translate-y-0"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Possible pattern</p>{item.action !== 'exercise' && <span className={item.action === 'urgent-care' ? 'rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-danger' : 'rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-warning'}>{item.action === 'urgent-care' ? 'Urgent care' : 'Assessment first'}</span>}</div><h4 className="mt-2 text-balance text-xl font-semibold tracking-[-0.03em]">{item.name}</h4><p className="mt-3 text-sm leading-6 text-muted">{item.summary}</p><div className="mt-5 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2"><div><p className="font-medium">Often feels like</p><ul className="mt-2 grid gap-1.5 text-muted">{item.symptoms.map((symptom) => <li key={symptom}>· {symptom}</li>)}</ul></div><div><p className="font-medium">Often linked to</p><ul className="mt-2 grid gap-1.5 text-muted">{item.triggers.map((trigger) => <li key={trigger}>· {trigger}</li>)}</ul></div></div><button type="button" onClick={() => choosePattern(item)} className="mt-6 min-h-12 rounded-lg bg-ink px-4 text-sm font-semibold text-canvas transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-85 motion-reduce:hover:translate-y-0">This sounds like me</button></article>)}</div></div>}
        </section>}

        {step === 'questions' && pattern && (
          <section aria-labelledby="question-heading" aria-live="polite" aria-atomic="true" className="mx-auto min-h-[34rem] max-w-3xl py-4 sm:py-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-brand">Condition-specific safety screen</p>
              <p className="text-sm tabular-nums text-subtle">Question {questionIndex + 1} of {questions.length}</p>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden="true">
              {questions.map((question, index) => <span key={question.id} className={index <= questionIndex ? 'h-1 rounded-full bg-brand' : 'h-1 rounded-full bg-line'} />)}
            </div>
            <div className="mt-6 flex min-h-[27rem] flex-col rounded-2xl border border-line bg-canvas p-6 sm:p-9">
              <div className="flex items-center gap-2 text-sm font-medium text-muted"><span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />For the “{pattern.name}” pattern</div>
              <div className="mt-4 min-h-40 sm:min-h-44">
                <h2 id="question-heading" className="text-balance text-xl font-semibold leading-tight tracking-[-0.035em] sm:text-2xl">{questions[questionIndex].prompt}</h2>
                {questions[questionIndex].help && <p className="mt-4 text-pretty text-sm leading-6 text-muted sm:text-base sm:leading-7">{questions[questionIndex].help}</p>}
              </div>
              <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-3">
                {answerOptions.map((option) => <button key={option.value} type="button" aria-label={option.label} onClick={() => answerQuestion(option.value)} className="group min-h-20 rounded-xl border border-line bg-surface px-5 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-brand/5 motion-reduce:hover:translate-y-0"><span className="flex items-center justify-between gap-3"><span className="text-base font-semibold">{option.label}</span><span className="grid size-7 place-items-center rounded-full border border-line bg-canvas text-xs font-semibold text-subtle group-hover:border-brand group-hover:text-brand" aria-hidden="true">{option.symbol}</span></span><span className="mt-1 block text-xs text-subtle">{option.hint}</span></button>)}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => questionIndex > 0 ? setQuestionIndex((value) => value - 1) : setStep('finder')} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:text-ink">← {questionIndex > 0 ? 'Previous question' : 'Back to possible causes'}</button></div>
          </section>
        )}

        {step === 'result' && result && pattern && <section aria-labelledby="result-heading" aria-live="polite" className="mx-auto max-w-3xl py-4 sm:py-8"><p className="text-sm font-semibold text-brand">Safety result</p><div className={result.kind === 'urgent' ? 'mt-5 rounded-2xl border border-danger/50 bg-danger/10 p-6 sm:p-9' : result.kind === 'professional' ? 'mt-5 rounded-2xl border border-warning/50 bg-warning/10 p-6 sm:p-9' : 'mt-5 rounded-2xl border border-success/50 bg-success/10 p-6 sm:p-9'}><div className={result.kind === 'urgent' ? 'grid size-11 place-items-center rounded-full bg-danger text-white' : result.kind === 'professional' ? 'grid size-11 place-items-center rounded-full bg-warning text-canvas' : 'grid size-11 place-items-center rounded-full bg-success text-canvas'} aria-hidden="true">{result.kind === 'movement' ? '✓' : '!'}</div><h2 id="result-heading" className="mt-5 text-balance text-3xl font-semibold tracking-[-0.045em]">{result.title}</h2><p className="mt-4 text-pretty leading-7 text-muted">{result.description}</p><p className="mt-4 font-medium leading-7">{result.nextStep}</p>{result.kind === 'movement' && routine && <button type="button" onClick={() => { setNeedsSafetyCheck(false); setStep('routine'); }} className="mt-7 min-h-12 rounded-lg bg-ink px-5 text-sm font-semibold text-canvas transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-85 motion-reduce:hover:translate-y-0">Start {routine.name}</button>}</div><p className="mt-5 text-sm leading-6 text-subtle">This limited screen cannot rule out every cause. If you are worried or symptoms change, seek professional care.</p></section>}

        {step === 'routine' && routine && <section aria-labelledby="routine-heading"><button type="button" onClick={() => { setAnswers({}); setQuestionIndex(0); setStep(needsSafetyCheck ? 'questions' : 'result'); }} className="mb-5 min-h-11 rounded-lg px-2 text-sm font-semibold text-muted transition-colors hover:text-ink">← {needsSafetyCheck ? 'Run the safety check first' : 'Back to safety result'}</button>{needsSafetyCheck && <div className="mb-6 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm leading-6 text-muted"><strong className="text-warning">Direct exercise entry.</strong> This opens the requested movement immediately, but it does not mean stretching is appropriate for your symptoms. Use the safety check above if you have not already screened for warning signs.</div>}<div className="mb-6"><p className="text-sm font-semibold text-brand">Your mapped movement routine</p><h2 id="routine-heading" className="mt-2 text-balance text-3xl font-semibold tracking-[-0.045em]">{routine.name}</h2><p className="mt-2 text-pretty text-muted">{routine.description}</p></div><ExercisePlayer routine={routine} exercises={exercises} initialExerciseId={initialExerciseId} voiceEnabled={speech.enabled} voiceSupported={speech.supported} onVoiceToggle={speech.toggle} /></section>}
      </div>
    </div>
  );
}
