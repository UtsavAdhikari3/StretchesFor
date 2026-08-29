# StretchesFor

StretchesFor is a frontend-only Astro application for exploring non-diagnostic pain patterns, completing deterministic safety checks, and following curated movement routines. It has no login, database, backend, or saved medical profile.

## Free technology stack

- Astro and React islands
- Tailwind CSS 4 through the Vite plugin
- Google `<model-viewer>` for the interactive body
- A MakeHuman-generated GLB supplied by the project owner
- ExerciseDB V1 for exercise GIF media and basic metadata
- The browser SpeechSynthesis API for optional voice guidance

ExerciseDB never receives questionnaire answers, pain locations, symptoms, or safety results. The app requests only the fixed external exercise ID mapped in `src/data/exercises.ts`, and only after the user reaches a routine. Exercise selection and safety decisions remain local and deterministic.

## Human body model setup

The pain finder uses this bundled file:

```text
public/models/human-body.glb
```

The current model is the male skin reference mesh from the [HuBMAP Human Reference Atlas](https://humanatlas.io/3d-reference-library), distributed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [`VH_M_Skin.glb`](https://github.com/hubmapconsortium/ccf-releases/blob/main/v1.2/models/VH_M_Skin.glb). Its provenance and checksum are recorded in `public/models/README.md`.

The model should:

- have realistic human proportions;
- stand upright in a neutral anatomical pose;
- use a modest, low-distraction material;
- be optimised for browser delivery;
- preferably stay under roughly 5–10 MB;
- use compressed textures where possible; and
- face the positive Z axis, use metres, and place the feet near `y=0` where practical.

The application displays an accessible placeholder and still builds when the GLB is absent. The complete text region list also remains usable. Hotspots are configured in `src/data/bodyRegions.ts`, and `BodyModel.tsx` applies the bundled mesh's centred-origin offset.

Before shipping, optimise the GLB with an appropriate free glTF tool, inspect it on desktop and mobile, and verify every hotspot against the final mesh. Avoid embedding unnecessarily large textures or unused animation/rig data.

## ExerciseDB integration

The client uses the no-key endpoint:

```text
https://oss.exercisedb.dev/api/v1/exercises
```

`src/lib/exerciseDb.ts` provides paginated fetching, ID/name lookup, graceful failures, TypeScript interfaces, and in-memory request caching. `src/data/exercises.ts` is the locally verified mapping. Verified demonstrations load directly from ExerciseDB's media CDN to avoid API rate-limit failures. An unavailable or mismatched GIF is never substituted; the player shows “Exercise demonstration unavailable.”

## Privacy and safety

- Questionnaire answers live only in React state and disappear on refresh.
- Answers are not written to localStorage, cookies, analytics, or any API.
- Every pain pattern has a local action: `exercise`, `professional-evaluation`, or `urgent-care`.
- Urgent-care results immediately stop the questionnaire and routine path.
- Professional-evaluation results do not expose an exercise routine.
- ExerciseDB supplies media only and never decides what is safe.
- The experience does not diagnose conditions or claim certainty.

## Commands

```sh
npm install
npm run check
npm test
npm run build
```

Start the development server in background mode:

```sh
npm run dev:background
npm run dev:status
npm run dev:logs
npm run dev:stop
```

Astro’s background server also supports `astro dev status`, `astro dev logs`, and `astro dev stop` directly.
