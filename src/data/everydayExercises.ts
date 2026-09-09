import type { Exercise, Source } from './types';

export type Position = 'seated' | 'standing' | 'floor';
export type Equipment = 'chair' | 'wall' | 'towel';
export interface MovementDetails {
  positions: Position[];
  equipment: Equipment[];
  category: 'stretch' | 'mobility';
  targetAreas: string[];
  timing: { secondsPerSide: number; repetitions?: number; sides: 1 | 2; setupSeconds: number };
  sources: Source[];
}
type Blueprint = Omit<Exercise, 'sourceRef' | 'expectedSensation' | 'stopConditions'>;
const references = {
  seated: { publisher: 'NHS', title: 'Sitting exercises', url: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/' },
  flexibility: { publisher: 'NHS', title: 'Flexibility exercises', url: 'https://www.nhs.uk/live-well/exercise/flexibility-exercises/' },
  spine: { publisher: 'AAOS', title: 'Spine conditioning program', url: 'https://orthoinfo.aaos.org/en/recovery/spine-conditioning-program/' },
  shoulder: { publisher: 'AAOS', title: 'Rotator cuff and shoulder conditioning program', url: 'https://orthoinfo.aaos.org/en/recovery/rotator-cuff-and-shoulder-conditioning-program/' },
  hip: { publisher: 'AAOS', title: 'Hip conditioning program', url: 'https://orthoinfo.aaos.org/en/recovery/hip-conditioning-program/' },
  hand: { publisher: 'University Hospital Southampton NHS Foundation Trust', title: 'Upper limb exercises', url: 'https://www.uhs.nhs.uk/Media/UHS-website-2019/Patientinformation/Respiratory/Upper-limb-exercises-756-PIL.pdf' },
  ankle: { publisher: 'AAOS', title: 'Foot and ankle conditioning program', url: 'https://orthoinfo.aaos.org/en/recovery/foot-and-ankle-conditioning-program/' },
} satisfies Record<string, Source>;

const additions: Array<[string, string, string, Position, Equipment[], string, string[], string, boolean, keyof typeof references]> = [
  ['gentle-neck-rotation', 'Gentle neck rotation', 'neck', 'seated', ['chair'], 'Turn your head comfortably', ['Sit upright and relax your shoulders.', 'Slowly turn your head to look over one shoulder without tilting it.', 'Return to the centre and repeat on the other side.'], 'Keep the turn small and your eyes level.', true, 'seated'],
  ['shoulder-rolls', 'Shoulder rolls', 'shoulder', 'seated', ['chair'], 'Circle the shoulders slowly', ['Sit tall with your arms relaxed by your sides.', 'Lift your shoulders slightly, then roll them back and down.', 'Relax fully between slow circles.'], 'Make a small backward circle.', false, 'shoulder'],
  ['shoulder-blade-squeezes', 'Shoulder-blade squeezes', 'upper-back', 'seated', ['chair'], 'Draw the shoulder blades gently together', ['Sit tall with your feet supported.', 'Gently draw your shoulder blades together without shrugging.', 'Pause briefly, release, and breathe normally.'], 'Use very little effort and keep your arms relaxed.', false, 'shoulder'],
  ['cross-body-shoulder', 'Cross-body shoulder stretch', 'shoulder', 'standing', [], 'Bring one arm across the chest', ['Stand comfortably with both shoulders relaxed.', 'Bring one arm across your chest and support the upper arm with the other hand.', 'Hold a mild stretch behind the shoulder, release, then switch arms.'], 'Keep the arm lower if raising it feels uncomfortable.', true, 'shoulder'],
  ['table-shoulder-flexion', 'Supported table shoulder flexion', 'shoulder', 'seated', ['chair'], 'Slide the arms forward on a table', ['Sit facing a stable table and rest your forearms on it.', 'Slide your arms forward while gently leaning from the hips.', 'Stop before pinching, then slide back to sit upright.'], 'Move only a short distance on a table at a comfortable height.', false, 'shoulder'],
  ['seated-thoracic-rotation', 'Seated thoracic rotation', 'upper-back', 'seated', ['chair'], 'Turn the upper body gently', ['Sit tall with feet flat and arms crossed loosely over your chest.', 'Keep your hips facing forward as you rotate your upper body to one side.', 'Return to the centre, then repeat on the other side.'], 'Rest your hands on your thighs and make a smaller turn.', true, 'seated'],
  ['cat-cow', 'Cat–cow', 'lower-back', 'floor', [], 'Round and release the back slowly', ['Begin on hands and knees with your back comfortable.', 'Gently round your back as you breathe out.', 'Return through neutral and gently lengthen the chest forward without forcing an arch.'], 'Use a small range or choose seated pelvic rocking instead.', false, 'spine'],
  ['standing-side-reach', 'Standing side reach', 'upper-back', 'standing', [], 'Reach gently to one side', ['Stand with feet hip-width apart and knees relaxed.', 'Slide one hand down your thigh while reaching the other arm gently overhead.', 'Return upright without twisting, then switch sides.'], 'Keep both hands low and use a very small side bend.', true, 'flexibility'],
  ['seated-pelvic-rocking', 'Seated pelvic rocking', 'lower-back', 'seated', ['chair'], 'Rock the pelvis through a small range', ['Sit near the front of a stable chair with both feet supported.', 'Gently rock your pelvis back, allowing a small rounding of the lower back.', 'Rock forward to a comfortable upright position and repeat slowly.'], 'Make the movement barely visible and keep breathing.', false, 'spine'],
  ['supine-knee-rolls', 'Supine knee rolls', 'lower-back', 'floor', [], 'Let bent knees move gently side to side', ['Lie on your back with knees bent and feet resting on the floor.', 'Keep your shoulders down and let both knees move a short distance to one side.', 'Return to the centre and repeat toward the other side.'], 'Use a smaller movement and support your head if needed.', true, 'spine'],
  ['seated-hamstring', 'Seated hamstring stretch', 'hip', 'seated', ['chair'], 'Hinge forward over a supported heel', ['Sit near the front of a stable chair and extend one leg with the heel on the floor.', 'Keep your back long and hinge forward slightly from the hips.', 'Hold a mild stretch behind the thigh, sit upright, then switch legs.'], 'Keep a soft bend in the knee and lean less.', true, 'hip'],
  ['supine-hamstring-towel', 'Supine hamstring stretch with towel', 'hip', 'floor', ['towel'], 'Lift one leg with gentle towel support', ['Lie on your back with one knee bent and a towel behind the other thigh.', 'Use the towel to support the thigh as you slowly straighten that knee.', 'Hold a mild stretch behind the thigh, then lower and switch legs.'], 'Keep the lifted knee bent and avoid pulling the foot toward you.', true, 'hip'],
  ['standing-hip-flexor', 'Standing hip-flexor stretch', 'hip', 'standing', ['chair'], 'Lengthen the front of the back hip', ['Stand in a short split stance with a hand on a stable chair.', 'Keep your trunk upright and gently tuck your pelvis.', 'Bend the front knee slightly until you feel a mild stretch at the front of the back hip; release and switch.'], 'Shorten the stance and keep the movement small.', true, 'hip'],
  ['seated-figure-four', 'Seated figure-four', 'hip', 'seated', ['chair'], 'Rest one ankle over the opposite thigh', ['Sit upright on a stable chair with feet on the floor.', 'Rest one ankle over the opposite thigh without pressing the raised knee down.', 'If comfortable, hinge forward slightly, then release and switch legs.'], 'Stay upright; skip this position if the hip or knee pinches.', true, 'hip'],
  ['supported-butterfly', 'Supported butterfly stretch', 'hip', 'floor', ['towel'], 'Relax the thighs with support', ['Sit on the floor with the soles of your feet together in front of you.', 'Place folded towels under your outer thighs for support.', 'Sit tall and allow a mild inner-thigh stretch without pushing your knees down.'], 'Move your feet farther from your body and add more support.', false, 'hip'],
  ['standing-adductor', 'Standing adductor stretch', 'lower-abdomen-groin', 'standing', ['chair'], 'Shift weight gently to one side', ['Stand with your feet wider than your hips and hold a stable chair.', 'Bend one knee slightly while keeping the other leg long and both feet down.', 'Hold a mild inner-thigh stretch, return to the centre, then switch sides.'], 'Use a narrower stance and a smaller weight shift.', true, 'hip'],
  ['forearm-rotation', 'Forearm rotation', 'elbow', 'seated', ['chair'], 'Turn the palm up and down', ['Sit with your elbow bent and tucked comfortably beside your body.', 'Slowly turn your forearm so the palm faces up, then down.', 'Keep your wrist relaxed and repeat on the other arm.'], 'Turn through a smaller range without forcing the wrist.', true, 'hand'],
  ['finger-spread-release', 'Finger spread and release', 'wrist', 'seated', ['chair'], 'Open the fingers and relax', ['Rest your forearms comfortably with wrists straight.', 'Gently spread your fingers apart without straining.', 'Bring the fingers together and fully relax before repeating.'], 'Open the fingers only a little and avoid squeezing.', false, 'hand'],
  ['seated-ankle-pumps', 'Seated ankle pumps', 'ankle', 'seated', ['chair'], 'Point and lift the feet slowly', ['Sit on a stable chair with your legs comfortably supported.', 'Slowly point your feet away, then draw your toes back toward your shins.', 'Keep the movement smooth and within a comfortable range.'], 'Keep your heels down and lift just the forefoot.', false, 'ankle'],
  ['toe-spreading', 'Toe spreading', 'foot', 'seated', ['chair'], 'Spread the toes without curling', ['Sit with your bare feet resting comfortably on the floor.', 'Try to gently spread the toes apart while keeping them long.', 'Relax completely; a small movement is enough.'], 'Practise with one foot at a time without gripping the floor.', false, 'ankle'],
];
const stretches = new Set(['cross-body-shoulder', 'seated-hamstring', 'supine-hamstring-towel', 'standing-hip-flexor', 'seated-figure-four', 'supported-butterfly', 'standing-adductor']);
const specificReferences: Record<string, Source> = {
  'cat-cow': { publisher: 'Mayo Clinic', title: 'Back exercises', url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/back-pain/art-20546859' },
  'supine-knee-rolls': { publisher: 'Mayo Clinic', title: 'Back exercises', url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/back-pain/art-20546859' },
  'table-shoulder-flexion': { publisher: 'Newcastle Hospitals NHS Foundation Trust', title: 'Shoulder movement exercises', url: 'https://www.newcastle-hospitals.nhs.uk/services/newcastle-occupational-health-service/information-for-staff/physiotherapy/self-help-leaflets/painful-shoulder/' },
  'supported-butterfly': { publisher: 'Wirral Community Health and Care NHS Foundation Trust', title: 'Pelvic stretches', url: 'https://www.wchc.nhs.uk/services/pelvic-health/pelvic-stretches/' },
  'seated-pelvic-rocking': { publisher: 'Royal Free London NHS Foundation Trust', title: 'Musculoskeletal outpatient physiotherapy', url: 'https://www.royalfree.nhs.uk/services/therapy-services/physiotherapy/musculoskeletal-outpatient-physiotherapy' },
  'toe-spreading': { publisher: 'NHS Hampshire and Isle of Wight', title: 'Foot movement advice', url: 'https://www.hantsiow.icb.nhs.uk/common-conditions' },
  'finger-spread-release': { publisher: 'Sherwood Forest Hospitals NHS Foundation Trust', title: 'Hand exercises', url: 'https://sfh-tr.nhs.uk/media/bhwjs2hs/rheumatology-occupational-therapy-hand-exercises.pdf' },
};
export const additionalDetails: Record<string, MovementDetails> = Object.fromEntries(additions.map(([id, , region, position, equipment, , , , bilateral, source]) => [id, {
  positions: [position], equipment, category: stretches.has(id) ? 'stretch' : 'mobility', targetAreas: [region],
  timing: { secondsPerSide: stretches.has(id) ? 20 : 30, repetitions: stretches.has(id) ? undefined : 5, sides: bilateral ? 2 : 1, setupSeconds: 15 },
  sources: [specificReferences[id] ?? references[source]],
}]));
export const additionalBlueprints: Blueprint[] = additions.map(([id, name, regionId, , , direction, instructions, easier, bilateral]) => ({
  id, name, regionId, feltArea: regionId === 'lower-abdomen-groin' ? 'Inner thighs' : ({ neck: 'Neck', shoulder: 'Shoulders', 'upper-back': 'Upper back', 'lower-back': 'Lower back', hip: 'Hips and thighs', elbow: 'Forearms', wrist: 'Hands', ankle: 'Ankles', foot: 'Feet' }[regionId] ?? regionId),
  direction, instructions, easier, bilateral, seconds: additionalDetails[id].timing.secondsPerSide,
  dose: stretches.has(id) ? (bilateral ? '20 seconds each side' : '20 seconds') : (bilateral ? '5 slow repetitions each side' : '5 slow repetitions'),
  mistakes: ['Forcing a painful range', 'Holding your breath'],
}));

// Positions describe the written setup, not an imagined alternative.
const floorIds = new Set(['open-book', 'pelvic-tilt', 'single-knee-hug', 'diaphragm-breath', 'adductor-rockback', 'kneeling-hip-flexor', 'figure-four']);
const standingIds = new Set(['shoulder-pendulum', 'wall-slide', 'doorway-pec', 'supported-extension', 'standing-quad', 'wall-calf', 'knee-to-wall']);
const legacyMobility = new Set(['chin-tuck', 'shoulder-pendulum', 'wall-slide', 'open-book', 'thoracic-extension', 'pelvic-tilt', 'rib-breath', 'diaphragm-breath', 'supported-extension', 'adductor-rockback', 'quad-set', 'knee-to-wall', 'ankle-circles', 'short-foot', 'wrist-circles', 'tendon-glide', 'prayer-glide']);
export function movementDetails(exercise: Pick<Exercise, 'id' | 'regionId' | 'seconds' | 'bilateral'>): MovementDetails {
  if (additionalDetails[exercise.id]) return additionalDetails[exercise.id];
  const position = floorIds.has(exercise.id) ? 'floor' : standingIds.has(exercise.id) ? 'standing' : 'seated';
  const equipment: Equipment[] = position === 'seated' ? ['chair'] : [];
  if (['wall-slide', 'doorway-pec', 'wall-calf', 'knee-to-wall'].includes(exercise.id)) equipment.push('wall');
  if (['standing-quad', 'bent-knee-calf'].includes(exercise.id)) equipment.push('towel');
  if (['standing-quad', 'shoulder-pendulum', 'kneeling-hip-flexor'].includes(exercise.id)) equipment.push('chair');
  return { positions: exercise.id === 'short-foot' ? ['seated', 'standing'] : [position], equipment, category: legacyMobility.has(exercise.id) ? 'mobility' : 'stretch', targetAreas: [exercise.regionId], timing: { secondsPerSide: exercise.bilateral && /^(neck-turn|single-knee-hug|doorway-pec|figure-four|standing-quad|wall-calf|bent-knee-calf|plantar-stretch|wrist-extensor|wrist-flexor)$/.test(exercise.id) ? 20 : exercise.seconds, sides: exercise.bilateral ? 2 : 1, setupSeconds: 15 }, sources: [] };
}
