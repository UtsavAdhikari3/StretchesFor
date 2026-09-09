# Exercise image mapping

All 48 exercises now have local images: the 27 supplied PNG files below and 21 existing WebP illustrations. Exercise pages and the guided player use these mappings; exercise page social previews and HowTo structured data use the same images.

Files live in `public/stretches/`. Keep filename capitalization exact for production hosting. Mappings, actual dimensions, and alt text are in `src/data/exerciseMediaAssets.ts`; the existing illustrations remain in `src/data/exerciseIllustrations.ts`. Alt text reuses exercise names translated into Spanish, French, German, and Portuguese.

| Exercise ID | File | Dimensions |
| --- | --- | --- |
| neck-turn | LateralNeckStretch.png | 1122 × 1402 |
| pelvic-tilt | PelvicTilt.png | 1122 × 1402 |
| figure-four | SupportedFigureFour.png | 1086 × 1448 |
| wall-calf | RunnersCalfStretch.png | 1086 × 1448 |
| ankle-circles | ControlledAnkleCircles.png | 1122 × 1402 |
| wrist-flexor | WristFlexorStretch.png | 1122 × 1402 |
| wrist-circles | ControlledWristCircles.png | 1122 × 1402 |
| gentle-neck-rotation | GentleNeckRotation.png | 1122 × 1402 |
| shoulder-rolls | ShoulderRolls.png | 1122 × 1402 |
| shoulder-blade-squeezes | ShoulderBladeSqueezes.png | 1122 × 1402 |
| cross-body-shoulder | Cross-bodyShoulderStretch.png | 1122 × 1402 |
| table-shoulder-flexion | SupportedTableShoulderFlexion.png | 1122 × 1402 |
| seated-thoracic-rotation | SeatedThoracicRotation.png | 1122 × 1402 |
| cat-cow | CatCow.png | 1122 × 1402 |
| standing-side-reach | StandingSideStretch.png | 1122 × 1402 |
| seated-pelvic-rocking | SeatedPelvicRocking.png | 1086 × 1448 |
| supine-knee-rolls | SupineKneeRolls.png | 1086 × 1448 |
| seated-hamstring | SeatedHamstringStretch.png | 1086 × 1448 |
| supine-hamstring-towel | SupineHamstringStretchWithTowel.png | 1086 × 1448 |
| standing-hip-flexor | StandingHipFlexor.png | 1086 × 1448 |
| seated-figure-four | SeatedFigureFour.png | 1086 × 1448 |
| supported-butterfly | SupportedButterflyStretch.png | 1086 × 1448 |
| standing-adductor | StandingAdductorStretch.png | 1086 × 1448 |
| forearm-rotation | ForeArmRotation.png | 1122 × 1402 |
| finger-spread-release | FingerSpreadRelease.png | 1122 × 1402 |
| seated-ankle-pumps | SeatedAnklePumps.png | 1122 × 1402 |
| toe-spreading | ToeSpreading.png | 1122 × 1402 |

## Image review note

`SupineHamstringStretchWithTowel.png` depicts a towel around the foot. The written `supine-hamstring-towel` exercise instead supports the thigh with the towel. The file is mapped as supplied; replace it with a matching thigh-supported demonstration to align the photo with the written setup. The written instructions remain unchanged.

## Future replacements

Replace the corresponding file and update its dimensions in the mapping if they change. Images use `type: 'image'`; the media component also supports GIF and video with explicit playback controls. Use descriptive, localized alt text for any new movements.
