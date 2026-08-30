export interface ExerciseIllustration {
  src: `/stretches/${string}.webp`;
  width: 1122;
  height: 1402;
  alt: string;
}

export const exerciseIllustrations = {
  'chin-tuck': illustration('chin-tuck', 'Seated person gently drawing their chin straight backward'),
  'shoulder-pendulum': illustration('shoulder-pendulum', 'Supported standing position with one arm relaxed and hanging for a shoulder pendulum'),
  'wall-slide': illustration('wall-slide', 'Person sliding both arms upward along a wall'),
  'open-book': illustration('open-book', 'Side-lying person rotating their upper body and opening the top arm'),
  'thoracic-extension': illustration('thoracic-extension', 'Seated person extending their upper back over a chair back'),
  'single-knee-hug': illustration('single-knee-hug', 'Person lying on their back and guiding one knee toward their chest'),
  'doorway-pec': illustration('doorway-pec', 'Person using a doorway for a gentle chest stretch'),
  'rib-breath': illustration('rib-breath', 'Seated person placing their hands around the lower ribs for 360-degree breathing'),
  'diaphragm-breath': illustration('diaphragm-breath', 'Person lying comfortably with hands positioned for relaxed abdominal breathing'),
  'supported-extension': illustration('supported-extension', 'Standing person supporting their lower back during a gentle backward lean'),
  'adductor-rockback': illustration('adductor-rockback', 'Person on hands and knees rocking backward with one leg extended to the side'),
  'kneeling-hip-flexor': illustration('kneeling-hip-flexor', 'Person in a supported half-kneeling hip flexor stretch'),
  'quad-set': illustration('quad-set', 'Seated person tightening the front thigh with the leg straight'),
  'standing-quad': illustration('standing-quad', 'Standing person using a strap to guide one heel toward their body'),
  'bent-knee-calf': illustration('bent-knee-calf', 'Seated person using a strap for a bent-knee calf stretch'),
  'knee-to-wall': illustration('knee-to-wall', 'Person guiding one knee toward a wall while keeping the heel down'),
  'plantar-stretch': illustration('plantar-stretch', 'Seated person gently drawing the toes back to stretch the sole of the foot'),
  'short-foot': illustration('short-foot', 'Seated person gently shortening the foot to activate the arch'),
  'wrist-extensor': illustration('wrist-extensor', 'Person gently guiding one hand downward for a wrist extensor stretch'),
  'tendon-glide': illustration('tendon-glide', 'Hand positions progressing through a gentle tendon glide'),
  'prayer-glide': illustration('prayer-glide', 'Person lowering palms together in a gentle prayer wrist glide'),
} as const satisfies Record<string, ExerciseIllustration>;

export function getExerciseIllustration(exerciseId: string): ExerciseIllustration | undefined {
  return exerciseIllustrations[exerciseId as keyof typeof exerciseIllustrations];
}

function illustration(filename: string, alt: string): ExerciseIllustration {
  return {
    src: `/stretches/${filename}.webp`,
    width: 1122,
    height: 1402,
    alt,
  };
}
