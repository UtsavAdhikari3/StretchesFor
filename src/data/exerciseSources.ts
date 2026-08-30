import type { ExerciseSourceReference } from './types';

// Every local exercise is reviewed explicitly. A null value means that the
// provider was checked but no media-backed, semantically exact match was found.
// External names are identity checks only and are never shown to patients.
export const exerciseSourceManifest: Record<string, ExerciseSourceReference> = {
  'chin-tuck': ref(),
  'neck-turn': ref(null, 'x2chWLO', [], ['neck side stretch']),
  'shoulder-pendulum': ref(),
  'wall-slide': ref(),
  'open-book': ref(),
  'thoracic-extension': ref(),
  'pelvic-tilt': ref(null, 'NKJ8o6x', [], ['pelvic tilt']),
  'single-knee-hug': ref(),
  'doorway-pec': ref(),
  'rib-breath': ref(),
  'diaphragm-breath': ref(),
  'supported-extension': ref(),
  'adductor-rockback': ref(),
  'kneeling-hip-flexor': ref(),
  'figure-four': ref('1869', 'yn0LjwL', ['Lying Figure Four Stretch'], ['assisted lying glutes stretch']),
  'quad-set': ref(),
  'standing-quad': ref(),
  'wall-calf': ref('1239', 'PzNxakt', ['Standing Calf Stretch'], ['calf push stretch with hands against wall']),
  'bent-knee-calf': ref(),
  'knee-to-wall': ref(),
  'ankle-circles': ref('1864', 'uL9CsKm', ['Ankle Roll'], ['ankle circles']),
  'plantar-stretch': ref(),
  'short-foot': ref(),
  'wrist-extensor': ref(),
  'wrist-flexor': ref(null, 'UtmIqcI', [], ['side wrist pull stretch']),
  'wrist-circles': ref(null, '2zNKRUB', [], ['wrist circles']),
  'tendon-glide': ref(),
  'prayer-glide': ref(),
};

function ref(
  wgerId: string | null = null,
  exerciseDbId: string | null = null,
  wgerNames: string[] = [],
  exerciseDbNames: string[] = [],
): ExerciseSourceReference {
  return {
    wgerId,
    exerciseDbId,
    acceptedExternalNames: { wger: wgerNames, exerciseDb: exerciseDbNames },
    localAsset: null,
  };
}
