# Exercise media review ledger

`review-ledger.json` is curation-only evidence. Generate or refresh candidates with:

```sh
npm run media:curate -- --exercise chin-tuck
```

The tool searches reviewed provider catalogs using the local name, accepted aliases, setup, direction, inferred support/equipment, and target area. It never edits `src/data/exerciseSources.ts`. A candidate remains `pending` until a qualified clinician records `accepted` or `rejected`, a rejection reason when applicable, their role/name, the review date, and every checklist item.

Acceptance requires an exact match for setup, support/equipment, direction, range, tempo, bilateral behaviour, and every local safety cue. Similar movements are rejected.
