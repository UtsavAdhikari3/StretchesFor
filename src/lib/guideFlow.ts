import type { Answer } from '../data/types';
import type { AnswerMap } from './triage';
import { localePath, type Locale } from '../i18n';

export type GuideStep = 'finder' | 'questions' | 'result' | 'routine';

export interface GuideFlowState {
  region?: string;
  pattern?: string;
  question?: number;
  answers?: AnswerMap;
  exercise?: string;
  entry?: 'exercise';
}

export const guidePaths: Record<GuideStep, string> = {
  finder: '/guide/locate/',
  questions: '/guide/screen/',
  result: '/guide/result/',
  routine: '/guide/move/',
};

const answerKeys = ['emergency', 'trauma', 'systemic', 'function', 'match'] as const;
const validAnswers = new Set<Answer>(['yes', 'no', 'unsure']);

export function parseGuideState(search: string): GuideFlowState {
  const params = new URLSearchParams(search);
  const questionValue = params.get('question');
  const parsedQuestion = questionValue === null ? undefined : Number.parseInt(questionValue, 10);
  const answers: AnswerMap = {};

  for (const key of answerKeys) {
    const value = params.get(key) as Answer | null;
    if (value && validAnswers.has(value)) answers[key] = value;
  }

  return {
    region: params.get('region') || undefined,
    pattern: params.get('pattern') || undefined,
    question: parsedQuestion !== undefined && Number.isFinite(parsedQuestion) && parsedQuestion >= 0 ? parsedQuestion : undefined,
    answers,
    exercise: params.get('exercise') || undefined,
    entry: params.get('entry') === 'exercise' ? 'exercise' : undefined,
  };
}

export function createGuideHref(step: GuideStep, state: GuideFlowState = {}, locale?: Locale): string {
  const params = new URLSearchParams();
  if (state.region) params.set('region', state.region);
  if (state.pattern) params.set('pattern', state.pattern);
  if (state.question !== undefined) params.set('question', String(Math.max(0, Math.floor(state.question))));
  for (const key of answerKeys) {
    const value = state.answers?.[key];
    if (value) params.set(key, value);
  }
  if (state.exercise) params.set('exercise', state.exercise);
  if (state.entry) params.set('entry', state.entry);
  const query = params.toString();
  const href = `${guidePaths[step]}${query ? `?${query}` : ''}`;
  return locale ? localePath(locale, href) : href;
}
