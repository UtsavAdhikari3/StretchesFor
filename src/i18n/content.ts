import type { BodyRegion, Exercise, FlowResult, PainPattern, Question, Routine } from '../data/types';
import type { BodyRegionHotspot } from '../data/bodyRegions';
import { contentIdentityFields, t, translateRecord, type Locale } from './index';

export const localizeRegion = (locale: Locale, region: BodyRegion): BodyRegion => translateRecord(locale, region, contentIdentityFields);
export const localizePattern = (locale: Locale, pattern: PainPattern): PainPattern => translateRecord(locale, pattern, contentIdentityFields);
export const localizeRoutine = (locale: Locale, routine: Routine): Routine => translateRecord(locale, routine, contentIdentityFields);
export const localizeQuestion = (locale: Locale, question: Question): Question => translateRecord(locale, question, contentIdentityFields);
export const localizeResult = (locale: Locale, result: FlowResult): FlowResult => translateRecord(locale, result, contentIdentityFields);

export function localizeExercise(locale: Locale, exercise: Exercise): Exercise {
  const translated = translateRecord(locale, exercise, contentIdentityFields);
  if (locale !== 'en') {
    translated.expectedSensation = `${t(locale, 'A mild, controlled stretch or light effort around the selected area.')} ${t(locale, 'Target')}: ${translated.feltArea}.`;
  }
  return translated;
}

export function localizeHotspot(locale: Locale, hotspot: BodyRegionHotspot): BodyRegionHotspot {
  return { ...hotspot, label: t(locale, hotspot.label), group: t(locale, hotspot.group) as BodyRegionHotspot['group'] };
}

