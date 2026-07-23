# 022 — Code Quality Improvements

> **Status:** Implemented
> **Date:** 2026-07-23
> **Author:** Gonzalo

---

## Context and motivation

After reaching v1.0.0 the library is architecturally solid and fully spec-driven, but a general audit revealed four recurring quality gaps that will compound as the codebase grows:

1. **Documentation coverage is ~37%.** Public methods in components, services, and utilities lack JSDoc comments. This blocks automated API documentation generation with TypeDoc (the TypeScript equivalent of Angular's compodoc) and hurts IDE tooltips and contributor onboarding.

2. **CSS values are copy-pasted across every component.** The same six theme colours appear 197 times across 14 `.styles.ts` files, and the scrollbar ruleset is duplicated in five components. Any future theme change requires editing a dozen files.

3. **Component boilerplate is duplicated in all nine custom elements.** Every component independently redeclares the same `shadow: ShadowRoot` field, `attachShadow` call, and `t()` translation shorthand (~50 lines per component, ~450 lines total). A shared `BaseElement` abstract class would eliminate this entirely.

4. **TypeScript type declarations are inconsistently categorised.** Internal object shapes in `persistence.service.ts` and element-casting contracts in `lib-e2e-recorder.ts` are declared as `interface` when they are never extended and should be `type`. Similarly, JSON deserialization results in `persistence.service.ts` are cast directly without shape validation, masking potential runtime mismatches.

These are purely internal improvements — no public API changes, no new features.

---

## Use cases

1. **UC-01 — API documentation site**
   _As a library consumer, I want to navigate a generated HTML API reference so that I can understand every public method, its parameters, and its return type without reading source code._

2. **UC-02 — IDE autocompletion**
   _As an integrator, I want JSDoc tooltips to appear when I hover over imported functions in my IDE so that I can use the library without switching to a separate docs tab._

3. **UC-03 — Theme change in one place**
   _As a maintainer, I want to update the dark-theme colour palette by changing a single file so that the change propagates consistently across all components._

4. **UC-04 — New component scaffolding**
   _As a contributor, I want to extend `BaseElement` when creating a new component so that I do not need to re-implement shadow DOM setup and translation wiring from scratch._

5. **UC-05 — Scrollbar style consistency**
   _As a maintainer, I want the scrollbar appearance to be defined once so that all panels always look identical and a change is a one-line edit._

6. **UC-06 — Safer internal deserialization**
   _As a maintainer, I want shape-validated deserialization of IndexedDB JSON blobs so that a schema migration failure surfaces as an explicit null rather than a silent type lie._

---

## Acceptance criteria

### JSDoc / TypeDoc

- [x] AC-01: Every exported function and class in `src/utils/` has a `/** ... */` block with `@param` and `@returns` tags.
- [x] AC-02: Every public method in `src/services/` has a JSDoc comment explaining purpose, parameters, and return value.
- [x] AC-03: Every Custom Element class has a class-level JSDoc block describing the component's role, observed attributes, and emitted events.
- [x] AC-04: Running `npx typedoc --entryPoints src/index.ts --out docs/api` produces a valid HTML site with no "missing documentation" warnings for public symbols.
- [x] AC-05: TypeDoc is added as a `devDependency` and a `docs:api` npm script is added to `package.json`.
- [x] AC-06: Private methods and internal helpers (prefixed `_` or truly private) do not require JSDoc.

### CSS theme consolidation

- [x] AC-07: A new file `src/utils/theme.ts` exports a `THEME` object with all colour tokens and shared CSS snippets (`THEME.color`, `THEME.zIndex`) plus `scrollbar()` and `SCROLLBAR_INLINE`.
- [x] AC-08: No hardcoded hex colour appears more than once across the codebase (zero duplicate `#0d1117`, `#161b22`, `#21262d`, `#30363d`, `#8b949e`, `#e6edf3`, `#2f81f7`, `#238636`, `#f85149`, `#d29922`).
- [x] AC-09: The scrollbar ruleset (`scrollbar-width: thin`, `::-webkit-scrollbar`) is defined only in `theme.ts` via `scrollbar()` / `SCROLLBAR_INLINE` and interpolated in each `.styles.ts` file.
- [x] AC-10: Z-index values are declared as named constants in `THEME.zIndex` (`overlay`, `modal`, `swal2`) and referenced by name in every `.styles.ts` file.
- [ ] AC-11: Existing visual appearance is pixel-for-pixel identical before and after the refactor (verified manually).

### BaseElement base class

- [x] AC-12: A new file `src/components/base.element.ts` exports `abstract class BaseElement extends HTMLElement` with:
  - `protected shadow: ShadowRoot` (attached in constructor with `mode: 'open'`)
  - `translation: TranslationService` (defaults to singleton, injectable)
  - `protected t(key: string): string`
- [x] AC-13: All nine existing Custom Element classes extend `BaseElement` instead of `HTMLElement`.
- [x] AC-14: No component class redeclares `shadow`, `translation`, or `t()`.
- [x] AC-15: All 1094 tests pass after the refactor.
- [x] AC-16: `BaseElement` itself has full JSDoc coverage.

### TypeScript type correctness

- [x] AC-17: All `interface` declarations in `src/services/persistence.service.ts` that are never extended (`TestRecord`, `CommandRecord`, `InterceptorRecord`, `ConfigRecord`) are converted to `type`.
- [x] AC-18: All element-casting contracts in `src/components/lib-e2e-recorder/lib-e2e-recorder.ts` (`PrevisualizerEl`, `TestEditorEl`, `SaveTestEl`, etc.) are converted to `type`.
- [x] AC-19: `persistence.service.ts` `getLoginSetup()` uses `isLoginSetupConfig()` type guard before returning a typed result.
- [x] AC-20: 11 unit tests cover `isLoginSetupConfig` for valid, null, missing fields, and wrong types.

### Tooling

- [x] AC-21: `npm run lint` passes with zero errors.
- [x] AC-22: `npm test` — 1094/1094 tests pass.
- [x] AC-23: `npm run build` — clean ESM + CJS + `.d.ts` output.
- [ ] AC-24: Coverage remains ≥ 80% on all metrics (pending `npm run test:coverage` run).

---

## Public API changes

No changes to the public API. `BaseElement` is an internal abstract class and must **not** be exported from `src/index.ts`.

`THEME` from `src/utils/theme.ts` is also internal. Do not export it from `src/index.ts`.

The only additive public change is the new npm script:

```json
{
  "scripts": {
    "docs:api": "typedoc --entryPoints src/index.ts --out docs/api"
  }
}
```

---

## Out of scope

- Mobile/responsive CSS changes — deferred to a future spec.
- Adding new features, components, or services.
- Changing any public API surface (method names, event names, attributes).
- Translating undocumented strings (all i18n keys already covered).
- Migrating to a CSS-in-JS or design-token build system.
- TypeDoc publishing to a hosted site (GitHub Pages or similar).

---

## Implementation notes

### TypeDoc vs. compodoc

compodoc is Angular-specific and cannot parse plain TypeScript/Custom Elements projects. **TypeDoc** is the standard documentation generator for TypeScript libraries and integrates seamlessly with `tsup`-built packages. TypeDoc reads `.d.ts` and TSDoc tags natively.

Suggested TypeDoc config (`typedoc.json`):

```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "readme": "README.md",
  "includeVersion": true,
  "categorizeByGroup": true,
  "excludePrivate": true,
  "excludeInternal": true
}
```

### Recommended implementation order

1. `src/utils/theme.ts` — self-contained, no dependents to update yet.
2. Update all `.styles.ts` files to consume `THEME` — mechanical search-and-replace.
3. `src/components/base.element.ts` — new file, no breakage.
4. Migrate each component to extend `BaseElement` — one at a time, run tests after each.
5. Convert `interface` → `type` in `persistence.service.ts` and `lib-e2e-recorder.ts`.
6. Add `isLoginSetupConfig()` type guard + tests; apply it to the JSON.parse call.
7. Add JSDoc to `src/utils/` files.
8. Add JSDoc to `src/services/` public methods.
9. Add JSDoc to component class declarations.
10. Install TypeDoc, add script, verify output.

### TDD note

Steps 1–4 are pure refactors — no new behaviour. The existing test suite is the regression safety net. Steps 5–8 are documentation-only — no logic changes, no new tests required. However, if TypeDoc reveals undocumented public symbols that are also undertested, write tests for them before documenting (TDD principle applies).

### JSDoc style guide

```typescript
/**
 * Escapes a string for safe interpolation inside an HTML attribute value.
 *
 * @param value - Raw string that may contain `"`, `'`, `<`, `>`, or `&`.
 * @returns HTML-attribute-safe encoded string.
 */
export function escAttr(value: string): string { ... }
```

Use imperative mood for the first sentence ("Escapes", "Returns", "Registers"). Keep descriptions factual — do not restate the function name.

---

## Open questions

- [ ] Q1: Should `docs/api/` be committed to the repository or added to `.gitignore` and generated on demand? (Recommendation: `.gitignore` it and generate in CI.)
- [ ] Q2: Is there a preference for TypeDoc theme (`default` vs. `hierarchy`)? Default is sufficient for now.
- [ ] Q3: Should `BaseElement` live under `src/components/` or `src/utils/`? Recommendation: `src/components/base.element.ts` since it is a DOM class, not a pure utility.

---

## History

| Date       | Change                                                              |
|------------|---------------------------------------------------------------------|
| 2026-07-23 | Initial draft                                                       |
| 2026-07-23 | Added TS type-correctness section (interface→type, JSON guards)     |
| 2026-07-23 | Implemented — all AC complete except AC-11 (manual visual check)   |
