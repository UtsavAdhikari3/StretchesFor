export type BodySide = 'front' | 'back';
export type Answer = 'yes' | 'no' | 'unsure';
export type ResultKind = 'movement' | 'professional' | 'urgent';
export type ActionType = 'exercise' | 'professional-evaluation' | 'urgent-care';

export interface MapPoint { x: number; y: number; }

export interface BodyRegion {
  id: string;
  name: string;
  shortName: string;
  sides: BodySide[];
  points: Partial<Record<BodySide, MapPoint>>;
  summary: string;
  seoDescription: string;
}

export interface Source {
  title: string;
  publisher: string;
  url: string;
}

export interface PainPattern {
  id: string;
  regionId: string;
  name: string;
  summary: string;
  symptoms: string[];
  triggers: string[];
  matchQuestion: string;
  routineId?: string;
  evaluationOnly?: boolean;
  action: ActionType;
  sources: Source[];
}

export interface Exercise {
  id: string;
  externalExerciseId?: string;
  name: string;
  regionId: string;
  feltArea: string;
  direction: string;
  instructions: string[];
  dose: string;
  seconds: number;
  bilateral: boolean;
  mistakes: string[];
  easier: string;
  expectedSensation: string;
  stopConditions: string[];
}

export interface Routine {
  id: string;
  regionId: string;
  name: string;
  description: string;
  exerciseIds: string[];
}

export interface Question {
  id: string;
  prompt: string;
  help?: string;
  critical?: boolean;
}

export interface FlowResult {
  kind: ResultKind;
  title: string;
  description: string;
  nextStep: string;
}
