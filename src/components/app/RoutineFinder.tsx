import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { regions, patterns, questionsFor } from '../../data/content';
import { bodyRegions } from '../../data/bodyRegions';
import { exercises, routines } from '../../data/exercises';
import { everydayRoutines } from '../../data/everydayRoutines';
import { movementDetails, type Equipment, type Position } from '../../data/everydayExercises';
import type { Answer, PainPattern } from '../../data/types';
import { evaluateAnswers, type AnswerMap } from '../../lib/triage';
import { parseGuideState, type GuideStep } from '../../lib/guideFlow';
import { buildRoutine, type Preferences } from '../../lib/routineBuilder';
import { localeInfo, localePath, t, type Locale } from '../../i18n';
import { localizeResult } from '../../i18n/content';
import ExercisePlayer from './ExercisePlayer';
import VoiceToggle from './VoiceToggle';
import { useSpeechGuidance } from './useSpeechGuidance';

const BodyModel = lazy(() => import('./BodyModel'));
type Step = 'area' | 'feeling' | 'pattern' | 'safety' | 'preferences' | 'result' | 'move' | 'complete';
interface State extends Preferences { version: 1; step: Step; feeling?: 'stiffness' | 'pain'; pattern?: string; answers: AnswerMap; question: number; exercise?: string }
const storageKey = 'stretchesfor-routine-v1';
const initial: State = { version: 1, step: 'area', region: '', context: 'general', minutes: 5, positions: ['seated', 'standing'], equipment: ['chair', 'wall'], answers: {}, question: 0 };
const stepOrder: Step[] = ['area', 'feeling', 'pattern', 'safety', 'preferences', 'result', 'move', 'complete'];
const questionKeys = ['emergency', 'trauma', 'systemic', 'function', 'match'] as const;

export function validateRoutineState(raw: unknown): State {
  if (!raw || typeof raw !== 'object') return { ...initial };
  const value = raw as Partial<State>;
  if (value.version !== 1 || !regions.some(r => r.id === value.region)) return { ...initial };
  const answers: AnswerMap = {};
  for (const key of questionKeys) if (['yes', 'no', 'unsure'].includes(value.answers?.[key] ?? '')) answers[key] = value.answers![key];
  return { ...initial, region: value.region!, step: stepOrder.includes(value.step!) ? value.step! : 'area',
    feeling: ['chest', 'abdomen', 'lower-abdomen-groin'].includes(value.region!) && value.feeling ? 'pain' : value.feeling === 'stiffness' || value.feeling === 'pain' ? value.feeling : undefined,
    pattern: patterns.find(p => p.id === value.pattern && p.regionId === value.region)?.id,
    answers, question: Number.isInteger(value.question) ? Math.max(0, Math.min(4, value.question!)) : 0,
    context: ['desk', 'morning', 'general'].includes(value.context!) ? value.context! : 'general',
    minutes: [3, 5, 10].includes(value.minutes!) ? value.minutes! : 5,
    positions: Array.isArray(value.positions) ? value.positions.filter(p => ['seated', 'standing', 'floor'].includes(p)) : initial.positions,
    equipment: Array.isArray(value.equipment) ? value.equipment.filter(e => ['chair', 'wall', 'towel'].includes(e)) : initial.equipment,
    routineId: everydayRoutines.find(r => r.id === value.routineId)?.id,
    exercise: exercises.find(e => e.id === value.exercise)?.id };
}

export default function RoutineFinder({ locale = 'en', initialStep: _initialStep }: { locale?: Locale; initialStep?: GuideStep }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [model, setModel] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const speech = useSpeechGuidance(false, localeInfo[locale].speechLang);
  const tr = (value: string) => t(locale, value);
  useEffect(() => {
    let restored: State = { ...initial };
    try { restored = validateRoutineState(JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')); } catch { setStorageAvailable(false); }
    const legacyWindow = window as typeof window & { __sfLegacyGuide?: string };
    const search = legacyWindow.__sfLegacyGuide || window.location.search;
    if (search) {
      const legacy = parseGuideState(search);
      const params = new URLSearchParams(search);
      const exercise = exercises.find(e => e.id === legacy.exercise);
      const requestedRoutine = everydayRoutines.find(r => r.id === params.get('routine'));
      const pattern = patterns.find(p => p.id === legacy.pattern);
      const region = exercise?.regionId ?? requestedRoutine?.regionId ?? bodyRegions.find(r => r.id === legacy.region)?.contentRegionId ?? regions.find(r => r.id === legacy.region)?.id ?? pattern?.regionId;
      if (region) {
        restored = { ...initial, region, step: pattern ? 'safety' : 'feeling', pattern: pattern?.id, feeling: pattern ? 'pain' : undefined, answers: legacy.answers ?? {}, exercise: exercise?.id, routineId: requestedRoutine?.id, context: requestedRoutine?.context ?? 'general' };
        if (exercise) { const details = movementDetails(exercise); restored.positions = details.positions; restored.equipment = details.equipment; }
        if (pattern?.action === 'urgent-care' || legacy.answers?.emergency === 'yes') restored.step = 'result';
      }
      delete legacyWindow.__sfLegacyGuide;
    }
    window.history.replaceState({ sfStep: restored.step }, '', window.location.pathname);
    setState(restored); setReady(true);
    const back = (event: PopStateEvent) => {
      const step = event.state?.sfStep;
      if (stepOrder.includes(step)) setState(current => ({ ...current, step }));
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { setStorageAvailable(false); }
  }, [state, ready]);
  useEffect(() => { if (ready) heading.current?.focus(); }, [state.step, state.question, ready]);
  const navigate = (step: Step, changes: Partial<State> = {}) => {
    speech.stop();
    setState(current => ({ ...current, ...changes, step }));
    window.history.pushState({ sfStep: step }, '', window.location.pathname);
    const events: Partial<Record<Step, string>> = { feeling: 'guide_started', result: 'routine_selected', move: 'routine_started', complete: 'routine_finished' };
    if (events[step] && (step !== 'result' || eligible && built.exercises.length > 0)) window.dispatchEvent(new CustomEvent('sf:progress', { detail: events[step] }));
  };
  const update = (changes: Partial<State>) => setState(current => ({ ...current, ...changes }));
  const selectedPattern = patterns.find(p => p.id === state.pattern && p.regionId === state.region);
  const pattern: PainPattern = selectedPattern ?? { id: 'everyday-stiffness', regionId: state.region, name: 'Everyday stiffness', summary: '', symptoms: [], triggers: [], matchQuestion: '', action: 'exercise', sources: [] };
  const questions = questionsFor(pattern).filter(q => state.feeling === 'pain' || q.id !== 'match');
  const complete = questions.every(q => state.answers[q.id as keyof AnswerMap] !== undefined);
  const evaluation = evaluateAnswers(pattern, { ...state.answers, match: state.feeling === 'stiffness' ? 'yes' : state.answers.match });
  const eligible = complete && evaluation.kind === 'movement' && !!state.feeling && (state.feeling !== 'pain' || !!selectedPattern);
  const legacyRoutine = routines.find(r => r.id === selectedPattern?.routineId);
  const allowedIds = state.feeling === 'pain' ? (state.exercise ? legacyRoutine?.exerciseIds.filter(id => id === state.exercise) ?? [] : legacyRoutine?.exerciseIds ?? []) : state.exercise ? [state.exercise] : undefined;
  const built = useMemo(() => buildRoutine(state, eligible, allowedIds), [state, eligible, legacyRoutine]);
  const result = localizeResult(locale, evaluation);
  const firstMissing = questions.findIndex(q => state.answers[q.id as keyof AnswerMap] === undefined);
  const questionIndex = Math.min(state.question, firstMissing < 0 ? questions.length - 1 : firstMissing);
  const question = questions[questionIndex];
  const blocked = evaluation.kind === 'urgent' || (questions.some(q => state.answers[q.id as keyof AnswerMap] === 'yes' && q.id !== 'match') || questions.some(q => state.answers[q.id as keyof AnswerMap] === 'unsure')) || selectedPattern?.action === 'professional-evaluation';
  const effectiveStep: Step = evaluation.kind === 'urgent' && ['result', 'preferences', 'move', 'complete'].includes(state.step) ? 'result'
    : !state.region ? 'area' : !state.feeling && state.step !== 'area' ? 'feeling'
    : state.feeling === 'pain' && !selectedPattern && !['area', 'feeling'].includes(state.step) ? 'pattern'
    : ['preferences', 'move', 'complete'].includes(state.step) && !eligible ? (blocked ? 'result' : 'safety')
    : state.step === 'result' && !complete && !blocked ? 'safety' : state.step;
  const progress = effectiveStep === 'area' ? 1 : effectiveStep === 'feeling' || effectiveStep === 'pattern' ? 2 : effectiveStep === 'safety' ? 3 : effectiveStep === 'preferences' ? 4 : 5;
  const chooseArea = (region: string) => navigate('feeling', { ...initial, region, step: 'feeling' });
  const answer = (value: Answer) => {
    const answers = { ...state.answers, [question.id]: value };
    for (const q of questions.slice(questionIndex + 1)) delete answers[q.id as keyof AnswerMap];
    if (value !== 'no' && question.id !== 'match' || question.id === 'match' && value !== 'yes') navigate('result', { answers });
    else if (questionIndex === questions.length - 1) navigate('preferences', { answers });
    else update({ answers, question: questionIndex + 1 });
  };
  const toggle = <T extends Position | Equipment>(values: T[], value: T) => values.includes(value) ? values.filter(v => v !== value) : [...values, value];
  const title = { area: 'Where would you like to move more comfortably?', feeling: 'How does the area feel today?', pattern: 'Which description feels closest?', safety: question?.prompt ?? 'Safety check', preferences: 'Make this routine fit your day', result: eligible ? 'Your starting point' : result.title, move: 'Move at your own pace', complete: 'You made time to move' }[effectiveStep];
  useEffect(() => {
    if (ready && speech.enabled && effectiveStep !== 'move') speech.speak(t(locale, title));
  }, [ready, speech.enabled, speech.speak, effectiveStep, title, locale]);
  const equipmentLabels = { chair: 'Stable chair or table', wall: 'Wall or doorway', towel: 'Towel' };
  const routineEquipment = [...new Set(built.exercises.flatMap(exercise => movementDetails(exercise).equipment))];
  if (!ready) return <p role="status">{tr('Loading your routine…')}</p>;
  return <div className="sf-finder">
    <div className="sf-flow-top"><a href={localePath(locale, '/exercises/')}>{tr('Browse exercises')}</a><VoiceToggle enabled={speech.enabled} supported={speech.supported} onToggle={speech.toggle} label="Voice guide" locale={locale} /><button className="sf-text-button" onClick={() => navigate('area', initial)}>{tr('Start over')}</button></div>
    <div className="sf-progress" aria-label={tr('Routine progress')}><span style={{ width: `${progress * 20}%` }} /></div>
    <p className="sf-eyebrow">{tr('Your routine')} · {progress} / 5</p>
    <h2 ref={heading} tabIndex={-1} className="sf-question">{tr(title)}</h2>
    {!storageAvailable && <p className="sf-note" role="status">{tr('Progress stays on this page. Refreshing or changing language will restart the questions.')}</p>}
    {effectiveStep === 'area' && <><p className="sf-lead">{tr('Choose one area to start. You can build another routine later.')}</p><div className="sf-choice-grid">{regions.map(r => <button className="sf-choice" key={r.id} onClick={() => chooseArea(r.id)}>{tr(r.name)}<span aria-hidden="true">↗</span></button>)}</div><button className="sf-text-button" aria-expanded={model} onClick={() => setModel(!model)}>{tr(model ? 'Close body model' : 'Choose on the 3D body instead')}</button>{model && <Suspense fallback={<p role="status">{tr('Loading body model…')}</p>}><BodyModel locale={locale} onSelect={id => { const region = bodyRegions.find(r => r.id === id); if (region) chooseArea(region.contentRegionId); }} /></Suspense>}</>}
    {effectiveStep === 'feeling' && <><p className="sf-lead">{tr('This helps us choose the right questions. The guide does not diagnose symptoms.')}</p><div className="sf-options"><button className="sf-choice" onClick={() => navigate(['chest', 'abdomen', 'lower-abdomen-groin'].includes(state.region) ? 'pattern' : 'safety', { feeling: ['chest', 'abdomen', 'lower-abdomen-groin'].includes(state.region) ? 'pain' : 'stiffness', answers: {}, question: 0 })}>{tr('Mostly stiffness or tightness')}</button><button className="sf-choice" onClick={() => navigate('pattern', { feeling: 'pain', answers: {}, question: 0 })}>{tr('Pain or discomfort')}</button></div></>}
    {effectiveStep === 'pattern' && <><p className="sf-lead">{tr('These descriptions are educational patterns, not diagnoses.')}</p><div className="sf-options">{patterns.filter(p => p.regionId === state.region).map(p => <button className="sf-choice sf-choice-copy" key={p.id} onClick={() => navigate(p.action === 'exercise' ? 'safety' : 'result', { pattern: p.id, answers: {}, question: 0 })}><strong>{tr(p.name)}</strong><span>{tr(p.summary)}</span></button>)}<a className="sf-choice" href={localePath(locale, '/medical-disclaimer/')}>{tr('None fits — read when to seek advice')}</a></div></>}
    {effectiveStep === 'safety' && question && <><p className="sf-note">{tr('Safety question')} {questionIndex + 1} / {questions.length}</p>{question.help && <p className="sf-lead">{tr(question.help)}</p>}<div className="sf-options">{([['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']] as const).map(([value, label]) => <button key={value} className="sf-choice" onClick={() => answer(value)}>{tr(label)}</button>)}</div></>}
    {effectiveStep === 'preferences' && <><p className="sf-lead">{tr('We use these choices to select movements you can comfortably set up.')}</p>
      <fieldset className="sf-fieldset"><legend>{tr('When are you moving?')}</legend><div className="sf-pills">{([['desk', 'Desk break'], ['morning', 'Morning mobility'], ['general', 'General mobility']] as const).map(([value, label]) => <label key={value}><input type="radio" name="context" checked={state.context === value} onChange={() => update({ context: value, routineId: undefined })} />{tr(label)}</label>)}</div></fieldset>
      <fieldset className="sf-fieldset"><legend>{tr('Time available')}</legend><div className="sf-pills">{([3, 5, 10] as const).map(value => <label key={value}><input type="radio" name="minutes" checked={state.minutes === value} onChange={() => update({ minutes: value })} />{value} {tr('min')}</label>)}</div></fieldset>
      <fieldset className="sf-fieldset"><legend>{tr('Comfortable positions')}</legend><div className="sf-pills">{([['seated', 'Seated'], ['standing', 'Standing'], ['floor', 'On the floor']] as const).map(([value, label]) => <label key={value}><input type="checkbox" checked={state.positions.includes(value)} onChange={() => update({ positions: toggle(state.positions, value) })} />{tr(label)}</label>)}</div></fieldset>
      <fieldset className="sf-fieldset"><legend>{tr('What can you use?')}</legend><div className="sf-pills">{([['chair', 'Stable chair or table'], ['wall', 'Wall or doorway'], ['towel', 'Towel']] as const).map(([value, label]) => <label key={value}><input type="checkbox" checked={state.equipment.includes(value)} onChange={() => update({ equipment: toggle(state.equipment, value) })} />{tr(label)}</label>)}</div></fieldset>
      <button className="sf-button" onClick={() => navigate('result')}>{tr('Show my routine')}</button></>}
    {effectiveStep === 'result' && (eligible ? <><p className="sf-lead">{tr('Selected for your area, available time, and comfortable positions. Keep every movement easy.')}</p><div className="sf-summary"><span>{tr(regions.find(r => r.id === state.region)?.name ?? '')}</span><span>{built.exercises.length} {tr('exercises')}</span><span>≈ {Math.ceil(built.seconds / 60)} {tr('min')}</span></div>{built.shorter && built.exercises.length > 0 && <p className="sf-note">{tr('Your matches make a shorter routine. There is no need to hold stretches longer to fill the time.')}</p>}{built.exercises.length ? <><ol className="sf-routine-list">{built.exercises.map(e => <li key={e.id}><strong>{tr(e.name)}</strong><span>{tr(e.dose)}</span></li>)}</ol><button className="sf-button" onClick={() => navigate('move')}>{tr('Start my routine')}</button></> : <p role="status" className="sf-note">{tr('No movements fit these choices. Try another comfortable position or available support.')}</p>}<button className="sf-text-button" onClick={() => navigate('preferences')}>{tr('Edit preferences')}</button></> : <div className="sf-safety-result"><p className="sf-lead">{result.description}</p><p>{result.nextStep}</p><a className="sf-button" href={localePath(locale, '/medical-disclaimer/')}>{tr('Read the safety approach')}</a></div>)}
    {effectiveStep === 'result' && eligible && built.exercises.length > 0 && <div className="sf-note"><strong>{tr('What you will need')}</strong><p>{routineEquipment.length ? routineEquipment.map(item => tr(equipmentLabels[item])).join(' · ') : tr('No equipment')}</p></div>}
    {effectiveStep === 'move' && eligible && <ExercisePlayer routine={built.routine} exercises={built.exercises} locale={locale} voiceEnabled={speech.enabled} voiceSupported={speech.supported} onVoiceToggle={speech.toggle} onComplete={() => navigate('complete')} />}
    {effectiveStep === 'complete' && eligible && <><p className="sf-lead">{tr('Finish in a comfortable position. Notice how you feel, and stop if symptoms are worse afterward.')}</p><p>{tr('A short session counts. You can return for another comfortable movement break when it suits you.')}</p><a className="sf-button" href={localePath(locale, '/routines/')}>{tr('Explore more routines')}</a></>}
    {!['area', 'move', 'complete'].includes(effectiveStep) && <button className="sf-text-button sf-back" onClick={() => {
      if (effectiveStep === 'safety' && questionIndex > 0) { update({ question: questionIndex - 1 }); return; }
      const previous: Partial<Record<Step, Step>> = { feeling: 'area', pattern: 'feeling', safety: state.feeling === 'pain' ? 'pattern' : 'feeling', preferences: 'safety', result: eligible ? 'preferences' : 'feeling' };
      navigate(previous[effectiveStep] ?? 'area');
    }}>← {tr('Back')}</button>}
  </div>;
}
