# Everyday mobility refresh

The primary guide is `src/components/app/RoutineFinder.tsx`, mounted by `GuidePage.astro` at the existing guide URLs. The previous `PainFinder` remains as legacy source; it is not mounted by site pages. New navigation keeps answers in session storage and uses history entries containing only the current step. Legacy incoming query parameters are removed before analytics initialization.

There are 48 exercise guides and six new everyday routine pages in English, Spanish, French, German, and Portuguese. Routine selection applies the safety result, explicit exercise restrictions for pain pathways, position/equipment filters, then area/context ordering and an authored duration budget. Time includes both sides plus 15 seconds for setup per exercise; stretching duration is never increased to fill the budget.

## Validation commands

```text
npm run check
npm test
npm run build
npm run verify:site
npm run media:coverage
```

The site verifier checks generated internal links, canonicals, alternate-language URLs, JSON-LD syntax, indexing directives, sitemap coverage, absence of the body model from homepage HTML, and library filtering in all five languages. The report is written to `artifacts/site-verification.json`. CI runs these checks too.

Interaction tests cover safety gating, urgent warnings, uncertainty, direct exercise entry, answer editing, refresh restoration, and unavailable storage. Translation tests require every new exercise instruction and routine paragraph to exist in all four additional catalogs.

Translation generation uses the existing public-copy translation workflow. Exercise references are displayed on the new exercise pages. Neither machine translation nor source attribution is presented as clinical review.

The legacy media coverage command reports retained provider mappings. Runtime exercise pages now use only the local illustration catalog and optional supplied-media manifest; they do not contact those providers. See `exercise-media-checklist.md` for the user-supplied asset workflow.

## Preview and release

Run `npm run dev:background` and open `http://localhost:4321/en/`. The browser connector was unavailable during implementation, so the automated DOM and interaction checks do not constitute a visual browser review. Before production release, visually inspect mobile/desktop spacing, language switching, optional 3D selection, and timer/voice controls in an actual browser.

No production deployment is part of this refresh. The existing deployment command remains available for the separate release step.
