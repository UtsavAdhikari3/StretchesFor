import { useCallback, useEffect, useMemo, useRef } from 'react';
import BodyModel from './BodyModel';
import ExercisePlayer from './ExercisePlayer';
import VoiceToggle from './VoiceToggle';
import { useSpeechGuidance } from './useSpeechGuidance';
import { bodyRegionGroups, bodyRegions, getBodyRegionHotspot } from '../../data/bodyRegions';
import { getRegion, patterns, questionsFor } from '../../data/content';
import { exercises, routines } from '../../data/exercises';
import type { Answer, PainPattern } from '../../data/types';
import { evaluateAnswers, type AnswerMap } from '../../lib/triage';
import { createGuideHref, parseGuideState, type GuideFlowState, type GuideStep } from '../../lib/guideFlow';
import { localeInfo, t, type Locale } from '../../i18n';
import { localizeExercise, localizeHotspot, localizePattern, localizeQuestion, localizeRegion, localizeResult, localizeRoutine } from '../../i18n/content';
import { useLocalizedDom } from './useLocalizedDom';

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

interface Props {
  initialStep: GuideStep;
  initialSearch?: string;
  onNavigate?: (href: string) => void;
  locale?: Locale;
}

export default function PainFinder({ initialStep, initialSearch, onNavigate, locale }: Props) {
  const routeLocale = locale;
  locale ??= 'en';
  const guideSectionRef = useRef<HTMLDivElement>(null);
  const patternSelectionRef = useRef<HTMLDivElement>(null);
  useLocalizedDom(guideSectionRef, locale);
  const localizedExercises = useMemo(() => exercises.map((exercise) => localizeExercise(locale, exercise)), [locale]);
  const localizedRoutines = useMemo(() => routines.map((routine) => localizeRoutine(locale, routine)), [locale]);
  const localizedPatterns = useMemo(() => patterns.map((item) => localizePattern(locale, item)), [locale]);
  const localizedBodyRegions = useMemo(() => bodyRegions.map((item) => localizeHotspot(locale, item)), [locale]);
  const localizedRegionGroups = useMemo(() => bodyRegionGroups.map((group) => t(locale, group)), [locale]);
  const urlState = useMemo(
    () => parseGuideState(initialSearch ?? (typeof window === 'undefined' ? '' : window.location.search)),
    [initialSearch],
  );
  const directExercise = useMemo(
    () => urlState.exercise ? localizedExercises.find((item) => item.id === urlState.exercise) : undefined,
    [localizedExercises, urlState.exercise],
  );
  const directRoutine = useMemo(
    () => directExercise
      ? localizedRoutines.find((item) => item.regionId === directExercise.regionId && item.exerciseIds.includes(directExercise.id))
        ?? localizedRoutines.find((item) => item.exerciseIds.includes(directExercise.id))
      : undefined,
    [directExercise, localizedRoutines],
  );
  const directPattern = useMemo(
    () => directRoutine ? localizedPatterns.find((item) => item.routineId === directRoutine.id && item.action === 'exercise') : undefined,
    [directRoutine, localizedPatterns],
  );
  const directHotspot = useMemo(
    () => directExercise ? localizedBodyRegions.find((item) => item.contentRegionId === directExercise.regionId) : undefined,
    [directExercise, localizedBodyRegions],
  );
  const selectedHotspot = useMemo(
    () => directHotspot ?? (urlState.region ? localizedBodyRegions.find((item) => item.id === urlState.region) ?? localizedBodyRegions.find((item) => item.contentRegionId === urlState.region) : undefined),
    [directHotspot, localizedBodyRegions, urlState.region],
  );
  const pattern = useMemo(
    () => directPattern ?? (urlState.pattern ? localizedPatterns.find((item) => item.id === urlState.pattern && (!selectedHotspot || item.regionId === selectedHotspot.contentRegionId)) : undefined),
    [directPattern, localizedPatterns, selectedHotspot, urlState.pattern],
  );
  const step = initialStep;
  const answers: AnswerMap = urlState.answers ?? {};
  const initialExerciseId = directExercise?.id;
  const needsSafetyCheck = urlState.entry === 'exercise';
  const speech = useSpeechGuidance(false, localeInfo[locale].speechLang);
  const region = useMemo(() => {
    const found = getRegion(selectedHotspot?.contentRegionId ?? '');
    return found ? localizeRegion(locale, found) : undefined;
  }, [locale, selectedHotspot]);
  const regionPatterns = useMemo(() => localizedPatterns.filter((item) => item.regionId === region?.id), [localizedPatterns, region]);
  const questions = useMemo(() => pattern ? questionsFor(pattern).map((question) => localizeQuestion(locale, question)) : [], [locale, pattern]);
  const firstUnansweredQuestionIndex = questions.findIndex((question) => answers[question.id as keyof AnswerMap] === undefined);
  const lastAccessibleQuestionIndex = firstUnansweredQuestionIndex >= 0 ? firstUnansweredQuestionIndex : Math.max(questions.length - 1, 0);
  const questionIndex = Math.min(urlState.question ?? 0, lastAccessibleQuestionIndex);
  const result = useMemo(() => pattern ? localizeResult(locale, evaluateAnswers(pattern, answers)) : undefined, [locale, pattern, answers]);
  const routine = useMemo(() => directRoutine ?? (pattern?.routineId ? localizedRoutines.find((item) => item.id === pattern.routineId) : undefined), [directRoutine, localizedRoutines, pattern]);
  const canShowResult = pattern?.action === 'urgent-care' || answers.emergency === 'yes' || firstUnansweredQuestionIndex < 0;
  const canShowRoutine = needsSafetyCheck || firstUnansweredQuestionIndex < 0;

  const navigate = useCallback((nextStep: GuideStep, nextState: GuideFlowState = {}) => {
    speech.stop();
    const href = createGuideHref(nextStep, nextState, routeLocale);
    if (onNavigate) onNavigate(href);
    else window.location.assign(href);
  }, [onNavigate, routeLocale, speech.stop]);

  const currentState = useMemo<GuideFlowState>(() => ({
    region: selectedHotspot?.id,
    pattern: pattern?.id,
    question: step === 'questions' ? questionIndex : urlState.question,
    answers,
    exercise: initialExerciseId,
    entry: urlState.entry,
  }), [answers, initialExerciseId, pattern?.id, questionIndex, selectedHotspot?.id, step, urlState.entry, urlState.question]);

  const chooseRegion = useCallback((id: string) => {
    const next = getBodyRegionHotspot(id);
    if (!next) return;
    navigate('finder', { region: next.id });
  }, [navigate]);

  const choosePattern = (next: PainPattern) => {
    navigate(next.action === 'urgent-care' ? 'result' : 'questions', {
      region: selectedHotspot?.id,
      pattern: next.id,
      question: next.action === 'urgent-care' ? undefined : 0,
      answers: {},
    });
  };

  const answerQuestion = (answer: Answer) => {
    const question = questions[questionIndex];
    const nextAnswers = { ...answers, [question.id]: answer };
    if (question.id === 'emergency' && answer === 'yes') {
      navigate('result', { ...currentState, question: questionIndex, answers: nextAnswers, exercise: undefined, entry: undefined });
      return;
    }
    if (questionIndex === questions.length - 1) navigate('result', { ...currentState, question: questionIndex, answers: nextAnswers, exercise: undefined, entry: undefined });
    else navigate('questions', { ...currentState, question: questionIndex + 1, answers: nextAnswers, exercise: undefined, entry: undefined });
  };

  const reset = () => {
    navigate('finder');
  };

  const changeRegion = () => {
    navigate('finder');
  };

  const goToPreviousQuestion = () => {
    if (questionIndex === 0) {
      navigate('finder', { region: selectedHotspot?.id });
      return;
    }
    const previousQuestionIndex = questionIndex - 1;
    const previousAnswers = { ...answers };
    for (const question of questions.slice(previousQuestionIndex)) delete previousAnswers[question.id as keyof AnswerMap];
    navigate('questions', {
      ...currentState,
      question: previousQuestionIndex,
      answers: previousAnswers,
      exercise: undefined,
      entry: undefined,
    });
  };

  const updateRoutineExercise = useCallback((exerciseId: string) => {
    const href = createGuideHref('routine', { ...currentState, question: undefined, exercise: exerciseId }, routeLocale);
    window.history.pushState({}, '', href);
  }, [currentState, routeLocale]);

  useEffect(() => {
    const section = guideSectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;

    let isVisible = false;
    let hasScrolled = window.scrollY > 0;
    const enableWhenReady = () => {
      if (!isVisible || !hasScrolled) return;
      speech.setEnabled(true);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
    const handleScroll = () => {
      hasScrolled = true;
      enableWhenReady();
    };
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      enableWhenReady();
    }, { threshold: 0.1 });

    observer.observe(section);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speech.setEnabled]);

  useEffect(() => {
    if (step === 'finder') return;
    if (step === 'routine' && directExercise && directRoutine && directPattern && directHotspot) return;
    if (!selectedHotspot || !pattern) {
      navigate('finder', selectedHotspot ? { region: selectedHotspot.id } : {});
      return;
    }
    if (step === 'questions' && pattern.action === 'urgent-care') {
      navigate('result', currentState);
      return;
    }
    if (firstUnansweredQuestionIndex >= 0 && answers.emergency !== 'yes' && (step === 'result' || (step === 'routine' && !needsSafetyCheck))) {
      navigate('questions', { ...currentState, question: firstUnansweredQuestionIndex, exercise: undefined, entry: undefined });
      return;
    }
    if (step === 'routine' && !routine) navigate('result', currentState);
  }, [answers.emergency, currentState, directExercise, directHotspot, directPattern, directRoutine, firstUnansweredQuestionIndex, navigate, needsSafetyCheck, pattern, routine, selectedHotspot, step]);

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
    if (step === 'finder' && !selectedHotspot) speech.speak(t(locale, 'Where does it hurt? Rotate the body, or choose a region from the text list.'));
    if (step === 'finder' && selectedHotspot) speech.speak(`${selectedHotspot.label}. ${t(locale, 'Next, choose the description that feels closest.')}`);
    if (step === 'questions' && questions[questionIndex]) {
      const question = questions[questionIndex];
      speech.speak(`${question.prompt} ${question.help ?? ''} ${t(locale, 'Yes')}, ${t(locale, 'No')}, ${t(locale, 'Not sure')}.`);
    }
    if (step === 'result' && result) speech.speak(`${result.title}. ${result.description} ${result.nextStep}`);
  }, [locale, speech.enabled, speech.speak, step, selectedHotspot?.id, questions, questionIndex, result]);

  const activeStepIndex = flowSteps.findIndex((item) => item.id === step);
  const progress = step === 'finder' ? (selectedHotspot ? 28 : 10) : step === 'questions' ? 35 + ((questionIndex + 1) / Math.max(questions.length, 1)) * 35 : step === 'result' ? 85 : 100;
  const isChoosingRegion = selectedHotspot === undefined;

  return (
    <div ref={guideSectionRef} className="surface-card overflow-hidden shadow-[0_28px_80px_-48px_rgba(0,0,0,.5)]">
      <div className="flex flex-wrap items-center justify-end gap-4 border-b border-line bg-surface-raised/40 px-5 py-4 sm:px-7">
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
                {localizedRegionGroups.map((group) => (
                  <fieldset key={group}>
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-subtle">{group}</legend>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {localizedBodyRegions.filter((item) => item.group === group).map((item) => (
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
            <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={goToPreviousQuestion} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-muted transition-colors hover:text-ink">← {questionIndex > 0 ? 'Previous question' : 'Back to possible causes'}</button></div>
          </section>
        )}

        {step === 'result' && result && pattern && canShowResult && <section aria-labelledby="result-heading" aria-live="polite" className="mx-auto max-w-3xl py-4 sm:py-8"><p className="text-sm font-semibold text-brand">Safety result</p><div className={result.kind === 'urgent' ? 'mt-5 rounded-2xl border border-danger/50 bg-danger/10 p-6 sm:p-9' : result.kind === 'professional' ? 'mt-5 rounded-2xl border border-warning/50 bg-warning/10 p-6 sm:p-9' : 'mt-5 rounded-2xl border border-success/50 bg-success/10 p-6 sm:p-9'}><div className={result.kind === 'urgent' ? 'grid size-11 place-items-center rounded-full bg-danger text-white' : result.kind === 'professional' ? 'grid size-11 place-items-center rounded-full bg-warning text-canvas' : 'grid size-11 place-items-center rounded-full bg-success text-canvas'} aria-hidden="true">{result.kind === 'movement' ? '✓' : '!'}</div><h2 id="result-heading" className="mt-5 text-balance text-3xl font-semibold tracking-[-0.045em]">{result.title}</h2><p className="mt-4 text-pretty leading-7 text-muted">{result.description}</p><p className="mt-4 font-medium leading-7">{result.nextStep}</p>{result.kind === 'movement' && routine && <button type="button" onClick={() => navigate('routine', { ...currentState, question: undefined, exercise: routine.exerciseIds[0], entry: undefined })} className="mt-7 min-h-12 rounded-lg bg-ink px-5 text-sm font-semibold text-canvas transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-85 motion-reduce:hover:translate-y-0">Start {routine.name}</button>}</div><p className="mt-5 text-sm leading-6 text-subtle">This limited screen cannot rule out every cause. If you are worried or symptoms change, seek professional care.</p></section>}

        {step === 'routine' && routine && canShowRoutine && <section aria-labelledby="routine-heading"><button type="button" onClick={() => navigate(needsSafetyCheck ? 'questions' : 'result', needsSafetyCheck ? { region: selectedHotspot?.id, pattern: pattern?.id, question: 0, answers: {} } : { ...currentState, exercise: undefined, entry: undefined })} className="mb-5 min-h-11 rounded-lg px-2 text-sm font-semibold text-muted transition-colors hover:text-ink">← {needsSafetyCheck ? 'Run the safety check first' : 'Back to safety result'}</button>{needsSafetyCheck && <div className="mb-6 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm leading-6 text-muted"><strong className="text-warning">Direct exercise entry.</strong> This opens the requested movement immediately, but it does not mean stretching is appropriate for your symptoms. Use the safety check above if you have not already screened for warning signs.</div>}<div className="mb-6"><p className="text-sm font-semibold text-brand">Your mapped movement routine</p><h2 id="routine-heading" className="mt-2 text-balance text-3xl font-semibold tracking-[-0.045em]">{routine.name}</h2><p className="mt-2 text-pretty text-muted">{routine.description}</p></div><ExercisePlayer routine={routine} exercises={localizedExercises} locale={locale} initialExerciseId={initialExerciseId} voiceEnabled={speech.enabled} voiceSupported={speech.supported} onVoiceToggle={speech.toggle} onExerciseChange={updateRoutineExercise} /></section>}
      </div>
    </div>
  );
}
