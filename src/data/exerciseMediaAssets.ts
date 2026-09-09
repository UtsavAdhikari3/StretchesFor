export interface ExerciseMediaAsset {
  src: `/${string}`;
  type: 'image' | 'gif' | 'video';
  width: number;
  height: number;
  alt: string;
  poster?: `/${string}`;
}
// User-supplied files retain their exact, case-sensitive names in public/stretches.
// Alt text uses the exercise names already translated in every locale.
export const exerciseMediaAssets: Record<string, ExerciseMediaAsset> = {
  'neck-turn': photo('LateralNeckStretch', 'Lateral neck stretch'),
  'pelvic-tilt': photo('PelvicTilt', 'Pelvic tilt'),
  'figure-four': photo('SupportedFigureFour', 'Supported figure-four', 1086, 1448),
  'wall-calf': photo('RunnersCalfStretch', 'Runner’s calf stretch', 1086, 1448),
  'ankle-circles': photo('ControlledAnkleCircles', 'Controlled ankle circles'),
  'wrist-flexor': photo('WristFlexorStretch', 'Wrist flexor stretch'),
  'wrist-circles': photo('ControlledWristCircles', 'Controlled wrist circles'),
  'gentle-neck-rotation': photo('GentleNeckRotation', 'Gentle neck rotation'),
  'shoulder-rolls': photo('ShoulderRolls', 'Shoulder rolls'),
  'shoulder-blade-squeezes': photo('ShoulderBladeSqueezes', 'Shoulder-blade squeezes'),
  'cross-body-shoulder': photo('Cross-bodyShoulderStretch', 'Cross-body shoulder stretch'),
  'table-shoulder-flexion': photo('SupportedTableShoulderFlexion', 'Supported table shoulder flexion'),
  'seated-thoracic-rotation': photo('SeatedThoracicRotation', 'Seated thoracic rotation'),
  'cat-cow': photo('CatCow', 'Cat–cow'),
  'standing-side-reach': photo('StandingSideStretch', 'Standing side reach'),
  'seated-pelvic-rocking': photo('SeatedPelvicRocking', 'Seated pelvic rocking', 1086, 1448),
  'supine-knee-rolls': photo('SupineKneeRolls', 'Supine knee rolls', 1086, 1448),
  'seated-hamstring': photo('SeatedHamstringStretch', 'Seated hamstring stretch', 1086, 1448),
  'supine-hamstring-towel': photo('SupineHamstringStretchWithTowel', 'Supine hamstring stretch with towel', 1086, 1448),
  'standing-hip-flexor': photo('StandingHipFlexor', 'Standing hip-flexor stretch', 1086, 1448),
  'seated-figure-four': photo('SeatedFigureFour', 'Seated figure-four', 1086, 1448),
  'supported-butterfly': photo('SupportedButterflyStretch', 'Supported butterfly stretch', 1086, 1448),
  'standing-adductor': photo('StandingAdductorStretch', 'Standing adductor stretch', 1086, 1448),
  'forearm-rotation': photo('ForeArmRotation', 'Forearm rotation'),
  'finger-spread-release': photo('FingerSpreadRelease', 'Finger spread and release'),
  'seated-ankle-pumps': photo('SeatedAnklePumps', 'Seated ankle pumps'),
  'toe-spreading': photo('ToeSpreading', 'Toe spreading'),
};

function photo(filename: string, alt: string, width = 1122, height = 1402): ExerciseMediaAsset {
  return { src: `/stretches/${filename}.png`, type: 'image', width, height, alt };
}
