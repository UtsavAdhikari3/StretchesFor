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
  sourceRef: ExerciseSourceReference;
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

export interface ExerciseSourceReference {
  wgerId: string | null;
  exerciseDbId: string | null;
  acceptedExternalNames: {
    wger: string[];
    exerciseDb: string[];
  };
  /**
   * First-party media is enabled only after the immutable files and clinical
   * approval metadata are complete. A reviewed `null` is intentional: it
   * means no approved local asset is currently allowed to reach the player.
   */
  localAsset: LocalExerciseAsset | null;
}

export interface LocalExerciseAsset {
  approved: true;
  version: `v${number}`;
  demonstrationPath: `/${string}.mp4`;
  posterPath: `/${string}.webp`;
  width: 960;
  height: 540;
  durationSeconds: number;
  checksums: {
    demonstrationSha256: string;
    posterSha256: string;
  };
  approvalDate: `${number}-${number}-${number}`;
  reviewerRole: string;
  checklistVersion: string;
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
