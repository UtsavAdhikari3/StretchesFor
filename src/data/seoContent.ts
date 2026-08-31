import { getRegion, patterns } from './content';
import { exercises, routines } from './exercises';

export interface ConditionFaq {
  question: string;
  answer: string;
}

export interface ConditionPage {
  slug: string;
  name: string;
  keyword: string;
  title: string;
  metaDescription: string;
  regionId: string;
  patternId?: string;
  summary: string;
  causes: string[];
  symptoms: string[];
  exerciseIds: string[];
  movementNote: string;
  redFlags: string[];
  faqs: ConditionFaq[];
  relatedSlugs: string[];
}

interface ConditionSeed extends Omit<ConditionPage, 'title' | 'metaDescription' | 'redFlags' | 'faqs'> {
  faqFocus: string;
}

const generalRedFlags = [
  'severe or rapidly worsening pain',
  'new numbness, tingling, weakness, or loss of normal function',
  'pain after a major fall, collision, or other significant injury',
  'fever, unexplained swelling or redness, or feeling seriously unwell',
];

const regionalRedFlags: Record<string, string[]> = {
  neck: ['a severe new headache, fainting, confusion, or symptoms after a significant neck injury'],
  'lower-back': ['new loss of bladder or bowel control, saddle-area numbness, or rapidly worsening leg weakness'],
  chest: ['new chest pressure, shortness of breath, sweating, faintness, or pain spreading to the arm, jaw, back, or neck'],
  abdomen: ['sudden severe abdominal pain, repeated vomiting, bleeding, or a rigid or swollen abdomen'],
  'lower-abdomen-groin': ['a painful groin lump, vomiting, fever, or an inability to bear weight'],
  calf: ['one-sided calf swelling, warmth, or color change, especially with chest pain or shortness of breath'],
  foot: ['a wound, marked swelling, loss of sensation, or an inability to take four steps'],
};

const seeds: ConditionSeed[] = [
  {
    slug: 'stretches-for-lower-back-pain',
    name: 'Lower back pain',
    keyword: 'stretches for lower back pain',
    regionId: 'lower-back',
    patternId: 'nonspecific-lower-back',
    summary: 'Lower back pain is commonly felt around the beltline and may change with sitting, bending, lifting, or returning to movement after rest. Many episodes are described as nonspecific because no single structure can be identified from symptoms alone.',
    causes: ['A sudden increase in lifting, bending, or training load', 'Long periods of sitting or staying in one position', 'A manageable muscle strain after an unfamiliar movement', 'Sensitivity that persists after the original irritation has settled'],
    symptoms: ['A local ache or stiffness around the beltline', 'Discomfort that changes with position or movement', 'Stiffness after rest that eases with gentle activity', 'Tightness through the lower back, hips, or buttocks'],
    exerciseIds: ['pelvic-tilt', 'single-knee-hug', 'diaphragm-breath'],
    movementNote: 'Small, comfortable movements can be a useful starting point when walking is normal and motion feels neutral or relieving. The goal is not to force flexibility or push through pain.',
    faqFocus: 'back pain',
    relatedSlugs: ['stretches-for-hip-pain', 'stretches-for-upper-back-pain', 'stretches-for-groin-pain'],
  },
  {
    slug: 'stretches-for-knee-pain',
    name: 'Knee pain',
    keyword: 'stretches for knee pain',
    regionId: 'knee',
    patternId: 'patellofemoral-pattern',
    summary: 'Knee pain may be felt around the kneecap, joint line, tendons, or back of the knee. Symptoms often respond to how much running, jumping, stair climbing, or squatting the area has recently handled.',
    causes: ['A rapid increase in running, hills, stairs, or jumping', 'Repeated squatting or kneeling beyond current tolerance', 'Thigh or calf stiffness changing how the knee is loaded', 'A twist, fall, or impact that may require assessment'],
    symptoms: ['Ache around or behind the kneecap', 'Pain on stairs, hills, squats, or after sitting', 'Local tenderness above or below the kneecap', 'Stiffness without major swelling, locking, or giving way'],
    exerciseIds: ['quad-set', 'standing-quad', 'wall-calf'],
    movementNote: 'Gentle thigh activation and comfortable calf or quadriceps mobility may help restore motion without placing a large load through the knee.',
    faqFocus: 'knee pain',
    relatedSlugs: ['stretches-for-hip-pain', 'stretches-for-calf-pain', 'stretches-for-ankle-pain'],
  },
  {
    slug: 'stretches-for-neck-pain',
    name: 'Neck pain',
    keyword: 'stretches for neck pain',
    regionId: 'neck',
    patternId: 'mechanical-neck-strain',
    summary: 'Neck pain often appears as an ache or stiffness between the base of the skull and the shoulders. It may build after sustained postures, awkward sleep, unfamiliar lifting, or a sudden increase in desk or phone time.',
    causes: ['Long periods at a laptop, phone, or steering wheel', 'An awkward sleeping position', 'Unfamiliar lifting or upper-body training', 'Repeatedly holding the head in one position'],
    symptoms: ['Local neck ache or stiffness', 'Reduced but still usable turning or tilting', 'Tightness through the upper shoulders', 'Symptoms that ease temporarily after changing position'],
    exerciseIds: ['chin-tuck', 'neck-turn', 'open-book'],
    movementNote: 'Frequent, low-effort position changes usually make more sense than one forceful stretch. Keep your eyes level and let the shoulders remain relaxed.',
    faqFocus: 'neck pain',
    relatedSlugs: ['stretches-for-shoulder-pain', 'stretches-for-upper-back-pain', 'stretches-for-wrist-pain'],
  },
  {
    slug: 'stretches-for-plantar-fasciitis',
    name: 'Plantar fasciitis',
    keyword: 'stretches for plantar fasciitis',
    regionId: 'foot',
    patternId: 'plantar-heel-pattern',
    summary: 'Plantar heel pain, often called plantar fasciitis, is commonly felt under the heel or along the arch. First steps after sleep or rest may be uncomfortable, and symptoms may flare after a jump in walking, running, or standing time.',
    causes: ['A rapid increase in walking, running, or standing', 'A change in footwear or training surface', 'Reduced tolerance of the plantar fascia and nearby foot tissues', 'Calf or ankle stiffness that changes foot loading'],
    symptoms: ['Pain under the heel or along the inner arch', 'First-step pain after sleep or prolonged sitting', 'Tenderness that may ease as the foot warms up', 'Symptoms that return after longer periods on the feet'],
    exerciseIds: ['plantar-stretch', 'short-foot', 'bent-knee-calf'],
    movementNote: 'A mild toe and arch stretch, gentle foot-muscle activation, and comfortable calf mobility may help manage load. Avoid aggressively pulling into sharp heel pain.',
    faqFocus: 'plantar fasciitis',
    relatedSlugs: ['stretches-for-foot-pain', 'stretches-for-calf-pain', 'stretches-for-ankle-pain'],
  },
  {
    slug: 'stretches-for-shin-splints',
    name: 'Shin splints',
    keyword: 'stretches for shin splints',
    regionId: 'calf',
    summary: 'Shin splints is a common name for exercise-related pain along the inner border of the shin, often associated with medial tibial stress syndrome. It usually follows a change in running, jumping, surface, or footwear.',
    causes: ['Increasing running distance, speed, or hills too quickly', 'A sudden return to impact exercise after time off', 'A change in footwear or running surface', 'Lower-leg tissues not yet tolerating the current training load'],
    symptoms: ['A diffuse ache along a broader section of the inner shin', 'Tenderness during or after running and jumping', 'Lower-leg tightness that settles with relative rest', 'Symptoms linked to impact load rather than one sudden injury'],
    exerciseIds: ['wall-calf', 'bent-knee-calf', 'ankle-circles'],
    movementNote: 'Stretching may ease lower-leg tightness, but load management is usually more important. Reduce aggravating impact and rebuild gradually rather than using stretching to continue painful running.',
    faqFocus: 'shin splints',
    relatedSlugs: ['stretches-for-calf-pain', 'stretches-for-ankle-pain', 'stretches-for-foot-pain'],
  },
  {
    slug: 'stretches-for-shoulder-pain', name: 'Shoulder pain', keyword: 'stretches for shoulder pain', regionId: 'shoulder', patternId: 'rotator-cuff-related',
    summary: 'Shoulder pain may be felt around the shoulder cap, upper arm, or shoulder blade. Reaching, lifting, throwing, or lying on one side often changes symptoms.',
    causes: ['Repeated overhead work or sport', 'A sudden increase in pressing, pulling, or lifting', 'Long periods with little shoulder movement', 'A fall or direct impact that may need assessment'],
    symptoms: ['Pain lifting or reaching with the arm', 'An ache around the outer upper arm', 'Discomfort lying on the affected side', 'Stiffness without a visible deformity or major loss of function'],
    exerciseIds: ['shoulder-pendulum', 'wall-slide', 'doorway-pec'], movementNote: 'Use supported movements and a smaller range first. A mild stretch is acceptable; pinching, catching, or worsening pain is a reason to stop.', faqFocus: 'shoulder pain', relatedSlugs: ['stretches-for-neck-pain', 'stretches-for-upper-back-pain', 'stretches-for-chest-muscle-pain'],
  },
  {
    slug: 'stretches-for-upper-back-pain', name: 'Upper back pain', keyword: 'stretches for upper back pain', regionId: 'upper-back', patternId: 'thoracic-muscle-strain',
    summary: 'Upper back pain is commonly felt between the shoulder blades or across the upper ribs. It can follow sustained desk work, unfamiliar pulling, lifting, or rotation.',
    causes: ['Long static sitting or driving', 'Unfamiliar pulling, rowing, or lifting', 'A sudden but manageable trunk rotation', 'Reduced variety in upper-back and rib movement'],
    symptoms: ['Ache or stiffness between the shoulder blades', 'Symptoms that change with posture or trunk movement', 'Local muscle tenderness', 'A tight feeling across the chest or upper ribs'],
    exerciseIds: ['open-book', 'thoracic-extension', 'rib-breath'], movementNote: 'Gentle rotation, supported extension, and relaxed rib movement can provide variety without forcing the spine into its end range.', faqFocus: 'upper back pain', relatedSlugs: ['stretches-for-neck-pain', 'stretches-for-shoulder-pain', 'stretches-for-lower-back-pain'],
  },
  {
    slug: 'stretches-for-hip-pain', name: 'Hip pain', keyword: 'stretches for hip pain', regionId: 'hip', patternId: 'hip-flexor-strain',
    summary: 'Hip pain can be felt at the front, side, or back of the hip. Walking changes, hills, sprinting, side sleeping, or prolonged sitting may influence symptoms.',
    causes: ['A jump in walking, running, hills, or sprinting', 'Long sitting followed by demanding activity', 'Repeated compression while lying on one side', 'Deep twisting or catching that may require assessment'],
    symptoms: ['Front-of-hip, outer-hip, or buttock ache', 'Pain lifting the knee or climbing stairs', 'Tenderness at the side of the hip', 'Stiffness after sitting that changes with movement'],
    exerciseIds: ['figure-four', 'kneeling-hip-flexor', 'adductor-rockback'], movementNote: 'Choose the position that matches where you feel limited and avoid deep pinching in the groin. Support and a small range are useful starting points.', faqFocus: 'hip pain', relatedSlugs: ['stretches-for-lower-back-pain', 'stretches-for-groin-pain', 'stretches-for-knee-pain'],
  },
  {
    slug: 'stretches-for-calf-pain', name: 'Calf pain', keyword: 'stretches for calf pain', regionId: 'calf', patternId: 'calf-muscle-strain',
    summary: 'Calf pain may follow sprinting, jumping, hills, or an unfamiliar volume of walking. Not every calf symptom is muscular, so one-sided swelling or unexplained warmth needs prompt medical attention.',
    causes: ['Sprinting, jumping, hills, or a forceful push-off', 'A rapid increase in walking or running volume', 'Exercise-related cramping or fatigue', 'Achilles or lower-calf tissues reacting to load'],
    symptoms: ['Local muscle tightness or tenderness', 'Discomfort during a calf raise or push-off', 'Stiffness after activity', 'A mild ache that remains compatible with normal walking'],
    exerciseIds: ['wall-calf', 'bent-knee-calf', 'ankle-circles'], movementNote: 'Use a stable support, keep the stretch mild, and avoid bouncing. A suspected tear or unexplained swelling is not a stretching problem.', faqFocus: 'calf pain', relatedSlugs: ['stretches-for-shin-splints', 'stretches-for-ankle-pain', 'stretches-for-knee-pain'],
  },
  {
    slug: 'stretches-for-ankle-pain', name: 'Ankle pain', keyword: 'stretches for ankle pain', regionId: 'ankle', patternId: 'ankle-stiffness-pattern',
    summary: 'Ankle pain and stiffness may follow a minor sprain, time away from activity, or a change in running and jumping load. Comfortable weight-bearing is an important starting point.',
    causes: ['A minor ankle roll or previously settled sprain', 'Reduced movement after inactivity or immobilization', 'A sudden rise in running, hills, or jumping', 'Calf or Achilles stiffness affecting ankle motion'],
    symptoms: ['Stiffness when the knee moves over the foot', 'Mild ache around either side of the ankle', 'Reduced but comfortable ankle circles', 'Symptoms without major swelling or inability to walk'],
    exerciseIds: ['ankle-circles', 'knee-to-wall', 'bent-knee-calf'], movementNote: 'Controlled circles and a small knee-to-wall glide can restore movement gradually. Keep the heel down and do not force through swelling or instability.', faqFocus: 'ankle pain', relatedSlugs: ['stretches-for-calf-pain', 'stretches-for-foot-pain', 'stretches-for-shin-splints'],
  },
  {
    slug: 'stretches-for-foot-pain', name: 'Foot pain', keyword: 'stretches for foot pain', regionId: 'foot', patternId: 'foot-tendon-overuse',
    summary: 'Foot pain may be felt in the heel, arch, forefoot, or toes. A change in walking, running, standing time, shoes, or surface often changes how the foot is loaded.',
    causes: ['A rapid increase in walking, running, or standing', 'A footwear or surface change', 'Repeated pressure through the heel or forefoot', 'Foot muscles and tendons reacting to unfamiliar load'],
    symptoms: ['Heel, arch, or forefoot ache', 'Tenderness with push-off or longer periods on the feet', 'Fatigue through the arch', 'Symptoms that change with shoes, surface, or activity'],
    exerciseIds: ['plantar-stretch', 'short-foot', 'ankle-circles'], movementNote: 'Gentle toe mobility and low-effort arch control may help when walking remains comfortable. Do not stretch through wounds, numbness, or marked swelling.', faqFocus: 'foot pain', relatedSlugs: ['stretches-for-plantar-fasciitis', 'stretches-for-ankle-pain', 'stretches-for-calf-pain'],
  },
  {
    slug: 'stretches-for-groin-pain', name: 'Groin pain', keyword: 'stretches for groin pain', regionId: 'lower-abdomen-groin', patternId: 'adductor-strain',
    summary: 'Groin pain is often felt where the lower abdomen meets the inner thigh. Cutting, kicking, sprinting, and wide-stance loading can irritate the adductor and nearby tissues.',
    causes: ['A sudden change of direction, sprint, or kick', 'Repeated wide-stance or side-to-side loading', 'Forceful abdominal bracing', 'A hernia or hip problem that requires examination'],
    symptoms: ['Inner-thigh or groin tenderness', 'Pain squeezing the knees or stepping sideways', 'A manageable ache after sport', 'Tightness at the front or inside of the hip'],
    exerciseIds: ['adductor-rockback', 'kneeling-hip-flexor', 'figure-four'], movementNote: 'Use support and keep the range shallow. A groin lump, deep catching, testicular pain, or difficulty walking needs assessment rather than stretching.', faqFocus: 'groin pain', relatedSlugs: ['stretches-for-hip-pain', 'stretches-for-lower-back-pain', 'stretches-for-knee-pain'],
  },
  {
    slug: 'stretches-for-elbow-pain', name: 'Elbow pain', keyword: 'stretches for elbow pain', regionId: 'elbow', patternId: 'lateral-elbow-tendon',
    summary: 'Elbow pain is often felt at the inner or outer elbow and may be linked to gripping, tools, racquet sports, climbing, or repeated wrist movement.',
    causes: ['Repeated gripping or wrist extension', 'Throwing, climbing, racquet sport, or manual work', 'A sudden increase in lifting volume', 'A fall or impact that may require assessment'],
    symptoms: ['Outer- or inner-elbow tenderness', 'Pain with gripping or lifting', 'Forearm tightness', 'Symptoms tied to hand and wrist use'],
    exerciseIds: ['wrist-flexor', 'wrist-extensor', 'wrist-circles'], movementNote: 'Keep the elbow soft and use gentle hand pressure. Tendon symptoms often need gradual load changes as well as mobility.', faqFocus: 'elbow pain', relatedSlugs: ['stretches-for-wrist-pain', 'stretches-for-shoulder-pain', 'stretches-for-neck-pain'],
  },
  {
    slug: 'stretches-for-wrist-pain', name: 'Wrist pain', keyword: 'stretches for wrist pain', regionId: 'wrist', patternId: 'wrist-overuse',
    summary: 'Wrist pain and stiffness may build with keyboard work, gripping, lifting, phone use, or sport. Tingling, numbness, weakness, or pain after a fall needs individual assessment.',
    causes: ['Repeated keyboard, mouse, phone, or tool use', 'Gripping, lifting, or racquet sports', 'Sustained wrist positions', 'A fall, nerve irritation, or tendon problem'],
    symptoms: ['Ache with wrist movement', 'Forearm tightness', 'Stiffness after repeated use', 'Thumb-side or palm-side tenderness without numbness'],
    exerciseIds: ['wrist-circles', 'tendon-glide', 'prayer-glide'], movementNote: 'Use a small range and relaxed fingers. Stop if movement brings on tingling, numbness, weakness, or stronger pain.', faqFocus: 'wrist pain', relatedSlugs: ['stretches-for-elbow-pain', 'stretches-for-shoulder-pain', 'stretches-for-neck-pain'],
  },
  {
    slug: 'stretches-for-chest-muscle-pain', name: 'Chest muscle pain', keyword: 'stretches for chest muscle pain', regionId: 'chest', patternId: 'pectoral-muscle-strain',
    summary: 'Chest-wall muscle discomfort can follow pressing, lifting, coughing, or upper-body training. New or unexplained chest pain must be treated cautiously because serious causes cannot be ruled out online.',
    causes: ['Pressing or lifting beyond current tolerance', 'Repeated coughing', 'A manageable upper-body muscle strain', 'Rib or internal causes that need medical assessment'],
    symptoms: ['Surface-level tenderness linked to arm or trunk movement', 'A mild ache after training or coughing', 'Chest-wall tightness with normal comfortable breathing', 'Symptoms that are clearly reproducible with a manageable movement'],
    exerciseIds: ['rib-breath', 'doorway-pec', 'open-book'], movementNote: 'Only consider gentle movement when symptoms are clearly muscular and there are no warning signs. Use quiet breathing and low arm positions.', faqFocus: 'chest muscle pain', relatedSlugs: ['stretches-for-shoulder-pain', 'stretches-for-upper-back-pain', 'stretches-for-neck-pain'],
  },
  {
    slug: 'stretches-for-abdominal-muscle-pain', name: 'Abdominal muscle pain', keyword: 'stretches for abdominal muscle pain', regionId: 'abdomen', patternId: 'abdominal-muscle-strain',
    summary: 'Abdominal-wall soreness can follow lifting, coughing, or direct core training. Deep, severe, unexplained, digestive, or steadily worsening abdominal pain is not appropriate for an exercise guide.',
    causes: ['Direct abdominal or core training', 'Heavy lifting or forceful bracing', 'Repeated coughing', 'A hernia or internal cause that requires assessment'],
    symptoms: ['Mild surface-level soreness after activity', 'Tenderness that changes with bracing', 'Discomfort with trunk movement', 'Normal eating, breathing, and daily function'],
    exerciseIds: ['diaphragm-breath', 'supported-extension', 'rib-breath'], movementNote: 'Begin with relaxed breathing and very small supported movement. Do not use stretching to test severe, deep, or unexplained abdominal pain.', faqFocus: 'abdominal muscle pain', relatedSlugs: ['stretches-for-groin-pain', 'stretches-for-lower-back-pain', 'stretches-for-chest-muscle-pain'],
  },
];

function makeFaqs(seed: ConditionSeed): ConditionFaq[] {
  const exercisesForPage = seed.exerciseIds.map((id) => exercises.find((exercise) => exercise.id === id)?.name).filter(Boolean);
  const exerciseList = exercisesForPage.slice(0, 3).join(', ');
  return [
    {
      question: `What are the best stretches for ${seed.faqFocus}?`,
      answer: `There is no single best stretch for every cause. For a mild, movement-related pattern, options may include ${exerciseList}. Start with the easiest position, use a comfortable range, and stop if symptoms worsen.`,
    },
    {
      question: `How often should I stretch for ${seed.faqFocus}?`,
      answer: 'A short, gentle session once or twice a day is a reasonable trial when movement feels comfortable. More is not automatically better. Use the dose on each exercise page and reduce the range or frequency if symptoms are worse later that day or the next morning.',
    },
    {
      question: `Should stretching for ${seed.faqFocus} hurt?`,
      answer: 'No. Aim for a mild stretch or light muscular effort, not sharp, spreading, electrical, or steadily increasing pain. Stop and reassess if the movement changes your strength, sensation, breathing, balance, or ability to use the area normally.',
    },
    {
      question: `When should I see a clinician about ${seed.faqFocus}?`,
      answer: `Arrange an assessment when symptoms follow a significant injury, keep worsening, repeatedly return, interrupt sleep, or limit normal activity. Seek urgent help for any warning signs listed in the safety section below.`,
    },
  ];
}

export const conditions: ConditionPage[] = seeds.map((seed) => {
  const { faqFocus: _faqFocus, ...page } = seed;
  return {
    ...page,
    title: `${seed.keyword.replace(/\b\w/g, (letter) => letter.toUpperCase())}: Gentle Exercises & Safety`,
    metaDescription: `Explore gentle ${seed.keyword}, common causes and symptoms, step-by-step exercise guides, safety warnings, and answers to common questions.`,
    redFlags: [...(regionalRedFlags[seed.regionId] ?? []), ...generalRedFlags],
    faqs: makeFaqs(seed),
  };
});

const muscleTargetsByRegion: Record<string, string[]> = {
  neck: ['deep neck flexors', 'upper trapezius', 'levator scapulae'],
  shoulder: ['rotator cuff', 'deltoid', 'pectorals'],
  'upper-back': ['thoracic spine', 'rhomboids', 'mid-back muscles'],
  'lower-back': ['lumbar muscles', 'abdominals', 'gluteal muscles'],
  chest: ['pectorals', 'intercostals', 'rib-cage muscles'],
  abdomen: ['abdominals', 'diaphragm', 'lower rib muscles'],
  'lower-abdomen-groin': ['adductors', 'hip flexors', 'inner thigh'],
  hip: ['hip flexors', 'gluteal muscles', 'deep hip rotators'],
  knee: ['quadriceps', 'hamstrings', 'calf muscles'],
  calf: ['gastrocnemius', 'soleus', 'Achilles-calf complex'],
  ankle: ['calf muscles', 'ankle stabilizers', 'Achilles-calf complex'],
  foot: ['plantar fascia', 'intrinsic foot muscles', 'toe flexors'],
  elbow: ['wrist flexors', 'wrist extensors', 'forearm muscles'],
  wrist: ['wrist flexors', 'wrist extensors', 'hand tendons'],
};

const exerciseTargetOverrides: Record<string, string[]> = {
  'chin-tuck': ['deep neck flexors', 'suboccipital region', 'cervical postural muscles'],
  'open-book': ['thoracic spine', 'pectorals', 'rib-cage muscles'],
  'thoracic-extension': ['thoracic spine', 'mid-back muscles', 'rib-cage joints'],
  'single-knee-hug': ['gluteal muscles', 'lower back', 'posterior hip'],
  'plantar-stretch': ['plantar fascia', 'toe flexors', 'foot arch'],
  'short-foot': ['intrinsic foot muscles', 'arch stabilizers', 'big-toe support muscles'],
};

export const getCondition = (slug: string) => conditions.find((condition) => condition.slug === slug);
export const getConditionsForRegion = (regionId: string) => conditions.filter((condition) => condition.regionId === regionId);
export const getConditionsForExercise = (exerciseId: string, regionId: string) => {
  const direct = conditions.filter((condition) => condition.exerciseIds.includes(exerciseId));
  const regional = conditions.filter((condition) => condition.regionId === regionId && !direct.includes(condition));
  return [...direct, ...regional].slice(0, 4);
};

export function getExerciseSeo(exerciseId: string) {
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) return undefined;
  const routine = routines.find((item) => item.exerciseIds.includes(exercise.id));
  const region = getRegion(exercise.regionId);
  const relatedExercises = exercises
    .filter((item) => item.id !== exercise.id && (routine?.exerciseIds.includes(item.id) || item.regionId === exercise.regionId))
    .slice(0, 4);
  return {
    exercise,
    routine,
    region,
    targets: exerciseTargetOverrides[exercise.id] ?? muscleTargetsByRegion[exercise.regionId] ?? [exercise.feltArea],
    conditions: getConditionsForExercise(exercise.id, exercise.regionId),
    relatedExercises,
  };
}

export function getConditionContext(condition: ConditionPage) {
  return {
    region: getRegion(condition.regionId),
    pattern: condition.patternId ? patterns.find((item) => item.id === condition.patternId) : undefined,
    exercises: condition.exerciseIds.map((id) => exercises.find((exercise) => exercise.id === id)).filter(Boolean),
    related: condition.relatedSlugs.map((slug) => getCondition(slug)).filter(Boolean),
  };
}

export function getConditionFlowHref(condition: ConditionPage) {
  const params = new URLSearchParams({ region: condition.regionId });
  if (condition.patternId) params.set('pattern', condition.patternId);
  if (condition.patternId) params.set('question', '0');
  return `/guide/${condition.patternId ? 'screen' : 'locate'}/?${params.toString()}`;
}

export const getExerciseFlowHref = (exerciseId: string) => `/guide/move/?exercise=${encodeURIComponent(exerciseId)}&entry=exercise`;
