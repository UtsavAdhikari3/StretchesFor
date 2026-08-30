# Exercise media operations

Production mappings are evidence, not search results. No automated command in this repository writes `src/data/exerciseSources.ts`.

## Curation and clinical review

Run `npm run media:curate -- --exercise <slug>` before filming each batch. The tool searches Wger and ExerciseDB from the local movement name, aliases, setup, direction, inferred equipment/support, target area, and safety cues. It merges suggestions into `media/curation/review-ledger.json` while preserving existing review fields.

A qualified clinician must set every candidate to `accepted` or `rejected`, explain every rejection, identify the reviewer and role, date the review, and complete the setup, support/equipment, direction, range, tempo, bilateral-behaviour, and safety-cue checklist. A nearby movement is not an exact match.

## First-party production

Film only unresolved movements. AI-generated demonstrations are excluded. Each demonstration must show a full setup–movement–return cycle with a stable camera, neutral background, relevant joints visible, no embedded text, and a clean loop.

- MP4: 960×540, H.264, 30 fps, `yuv420p`, no audio, 6–12 seconds, at most 3 MB, fast-start enabled.
- Poster: 960×540 WebP, at most 150 KB.
- Retain source footage, model release, production release, clinical approval, and checksums in the access-controlled production archive. Do not commit identifiable source footage or signed releases to the public application repository.

Use `media/production-record.example.json` for the archive record. Validate the delivery files before upload:

```sh
npm run media:validate -- --mp4 ./demonstration.mp4 --poster ./poster.webp
```

The validator uses `ffprobe`, image stream inspection, MP4 atom inspection, byte limits, and SHA-256. Copy its checksums into the production record and, only after approval, into the manifest.

## Cloudflare R2

Create a private production bucket and attach only `media.stretchesfor.com` as its public custom domain. Do not enable the `r2.dev` public development URL. Apply `media/r2-cors.json`. Use a Cloudflare WAF rule at the custom domain to allow only `GET` and `HEAD`; R2 object storage does not provide directory indexes.

Upload new, immutable objects at:

```text
/v1/<exercise-slug>/demonstration.mp4
/v1/<exercise-slug>/poster.webp
```

Set `Content-Type: video/mp4` or `image/webp` and `Cache-Control: public, max-age=31536000, immutable` as object metadata. Before upload, confirm `HEAD` returns 404 for both destination paths. Never overwrite an existing object; increment the version instead.

After upload, run:

```sh
PUBLIC_EXERCISE_MEDIA_BASE_URL=https://media.stretchesfor.com npm run media:smoke
```

The smoke check uses `HEAD` to verify status, content type, exact CORS origin, and immutable caching, then `GET` to verify each manifest checksum.

## Rollout gates

- Batch 1 (15/28): bent-knee calf, wrist extensor, chin tuck, open book, single-knee hug, diaphragmatic breathing, adductor rock-back, supported hip-flexor stretch.
- Batch 2 (22/28): knee-to-wall, quad set, standing quad stretch, plantar stretch, short-foot activation, tendon glide, prayer glide.
- Batch 3 (28/28): shoulder pendulum, wall slide, doorway chest opener, thoracic extension, rib breathing, supported standing extension.

Re-audit providers first, film only remaining gaps, upload objects, validate CDN responses, collect clinical approval, and only then enable manifest entries. Run the matching gate (`media:coverage:batch1`, `media:coverage:batch2`, or `media:coverage:batch3`). A new exact provider match raises the count and does not reduce the gate.

Upload assets before deploying mappings. Roll back by deploying the preceding manifest commit; never replace or mutate a CDN object. At every release manually verify desktop/mobile layout, keyboard controls, reduced motion, slow loading, broken Wger, broken ExerciseDB, broken CDN media, and the full unavailable fallback. Written steps, timer, voice guidance, and safety state must remain functional in every case.
