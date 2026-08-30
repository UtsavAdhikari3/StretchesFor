# StretchesFor

StretchesFor is a frontend-only Astro application for exploring non-diagnostic pain patterns, completing deterministic safety checks, and following curated movement routines. It has no login, database, backend, or saved medical profile.

## Free technology stack

- Astro and React islands
- Tailwind CSS 4 through the Vite plugin
- Google `<model-viewer>` for the interactive body
- A MakeHuman-generated GLB supplied by the project owner
- Wger for reviewed video/image media
- ExerciseDB V1 for reviewed GIF media
- A first-party Cloudflare R2 media origin for clinician-approved demonstrations
- The browser SpeechSynthesis API for optional voice guidance

Media providers never receive questionnaire answers, pain locations, symptoms, safety results, or voice settings. The app requests only fixed reviewed exercise IDs or immutable media paths from `src/data/exerciseSources.ts`, and only after the user reaches a routine. Exercise selection and safety decisions remain local and deterministic.

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

## Exercise demonstration sources

The resolver uses this exact order:

1. playable Wger video;
2. Wger image;
3. ExerciseDB GIF;
4. approved StretchesFor MP4;
5. approved StretchesFor poster; and
6. the explicit unavailable state.

`src/data/exerciseSources.ts` is the production manifest. A remote mapping requires an exact reviewed ID/name pair. A local mapping requires immutable relative paths, checksums, dimensions, duration, clinical approval metadata, and `approved: true`. Null remote IDs make no provider request, and a null local asset cannot reach the player. Similar exercises are never substituted.

Set the public CDN origin per environment; it is not a secret:

```sh
PUBLIC_EXERCISE_MEDIA_BASE_URL=https://media.stretchesfor.com
```

See [docs/exercise-media-operations.md](docs/exercise-media-operations.md) for curation, production, R2, release, validation, smoke-test, and rollback procedures.

## Privacy and safety

- Questionnaire answers live only in React state and disappear on refresh.
- Answers are not written to localStorage, cookies, analytics, or any API.
- Every pain pattern has a local action: `exercise`, `professional-evaluation`, or `urgent-care`.
- Urgent-care results immediately stop the questionnaire and routine path.
- Professional-evaluation results do not expose an exercise routine.
- Wger, ExerciseDB, and the first-party CDN supply media only and never decide what is safe.
- The experience does not diagnose conditions or claim certainty.

## Commands

```sh
npm install
npm run check
npm test
npm run build
npm run media:coverage
```

Media operations:

```sh
npm run media:curate -- --exercise chin-tuck
npm run media:validate -- --mp4 path/to/demonstration.mp4 --poster path/to/poster.webp
npm run media:smoke
```

Start the development server in background mode:

```sh
npm run dev:background
npm run dev:status
npm run dev:logs
npm run dev:stop
```

Astro’s background server also supports `astro dev status`, `astro dev logs`, and `astro dev stop` directly.
