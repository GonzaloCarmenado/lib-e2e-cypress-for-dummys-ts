# 016 — Example: Microfrontend feature showcase

> **Status:** Done ✅
> **Date:** 2026-07-06
> **Author:** Gonzalo

---

## Context and motivation

The current example (`ejemplo/`) is an Angular app (Angular CLI + compodoc docs +
Cypress folder) that references the library through `file:..` pointing at source.
It only exercises a handful of interactions, does not cover the majority of the
library's features, and — critically — cannot demonstrate the flagship
**cross-app recording continuity** (spec 006), which by definition needs several
microfrontends served from the same origin with client-side navigation.

We want to **replace it entirely** with a purpose-built showcase that:

1. Exercises **every** user-facing capability of the library (all 18 feature
   areas), so a developer can validate the whole surface by hand in one place.
2. **Tells the user how to activate each feature** inline (shortcut / toggle /
   interaction) and shows the **expected generated Cypress command**, so the
   example doubles as living documentation.
3. Is built with the target stack — **Vite + TypeScript + Web Components** — with
   **zero framework runtime**, matching the library's own philosophy.
4. Uses **real microfrontends** (Module Federation) so spec 006 can be tested for
   real, including both placement strategies (recorder-in-shell vs recorder-per-MFE).

The existing Angular `ejemplo/` is deleted (recoverable from git history).

### Decisions (product owner)

- **Microfrontend tech:** Module Federation via `@originjs/vite-plugin-federation`.
  A shell (host) loads three remotes at runtime under the host origin.
- **Apps:** shell + **3 remotes** — `mfe-store`, `mfe-forms`, `mfe-admin`.
- **Recorder placement toggle:** the shell supports both spec-006 strategies,
  selected by query param: `?recorder=shell` (Option A, default) and
  `?recorder=mfe` (Option B). The Guide page explains B's double-`cy.wait` caveat.
- **Mock API:** MSW (Service Worker) so the library's patched `window.fetch` /
  `XMLHttpRequest` still observe every call; browser-only, no backend process.
- **Library consumption:** the example imports the built `dist/` of the parent
  package (`file:..`); a root script builds the lib before starting the apps.
- **Example copy language:** Spanish (matches the maintainer); the library's own
  i18n 5-language rule does not apply to example app copy.

---

## Use cases

1. **UC-01 — Exercise every feature by hand.**
   _As a maintainer, I want a single running example where I can trigger every
   interaction, HTTP, selector, config, and cross-app feature, so I can smoke-test
   the whole library after a change without an Angular app._

2. **UC-02 — Learn how to activate a feature.**
   _As a new user, I want each demo to state the shortcut/toggle/interaction that
   activates it and the Cypress command it should produce, so I can learn the tool
   by doing._

3. **UC-03 — Validate cross-app continuity for real.**
   _As a maintainer, I want to start recording in one microfrontend, navigate into
   another (same origin, client-side), and see the recording survive the crossing,
   so spec 006 is demonstrably working._

4. **UC-04 — Compare recorder placement strategies.**
   _As an integrator deciding where to mount the widget, I want to switch between
   "one recorder in the shell" and "one recorder per microfrontend" and observe the
   difference (including the duplicate-`cy.wait` caveat), so I can choose Option A
   or B for my own setup._

5. **UC-05 — Try the file-writing features locally.**
   _As a maintainer, I want the example to ship a real `cypress/` folder so I can
   test the File panel, fixture writing, and the `npx lib-e2e-cypress-runner` loop._

---

## Acceptance criteria

### Structure & build
- [x] AC-01: The old Angular `ejemplo/` is removed; a new example lives under
      `ejemplo/` as an npm-workspaces monorepo: `packages/{shared,shell,mfe-store,
      mfe-forms,mfe-admin}` plus a `cypress/` folder.
- [x] AC-02: Every package is **Vite + TypeScript + Web Components** (Custom
      Elements), no Angular/React/Vue runtime.
- [x] AC-03: `mfe-store`, `mfe-forms`, `mfe-admin` are Module Federation **remotes**
      (each exposes a `./mount` module: `mount(el) / unmount(el)`); `shell` is the
      **host** consuming all three via `@originjs/vite-plugin-federation`.
- [x] AC-04: A root script (`npm run dev` from `ejemplo/`) builds the library
      (`tsup` in the parent) and starts the shell + three remote dev servers
      (shell `:5000`, store `:5001`, forms `:5002`, admin `:5003`).
- [x] AC-05: The example imports the library's built `dist/index.js` (via `file:..`),
      not the parent's source.

### Feature coverage (every area triggerable)
- [x] AC-06: **Interaction capture** — the apps contain triggers for click,
      double-click, right-click, checkbox check/uncheck, radio, text input (with
      1s debounce), Enter/Escape in a field, and `<select>` change.
- [x] AC-07: **Selector strategy** — `mfe-store` has four clearly-labelled sections
      whose interactive elements expose respectively `data-cy`, `data-testid`,
      `aria-label`, and a clean `id`, plus a section with framework-prefixed ids
      (`cdk-*`, `mat-*`) that must be skipped, so switching the strategy in Config
      is observable.
- [x] AC-08: **Smart Selector Picker** — `mfe-store` has at least one interactive
      element with **no** valid selector (only classes/tag) so a click opens the
      picker when smart selector is enabled.
- [x] AC-09: **Assertion capture (Alt+click)** — `mfe-forms` has targets that
      produce each inferred assertion: a checkbox (`be.checked`), a filled input
      (`have.value`), a text element (`contain.text`), and a plain element
      (`be.visible`).
- [x] AC-10: **HTTP monitoring** — `mfe-store` fires `GET` (fetch), `mfe-forms`
      fires `POST` and `PUT` (fetch and/or XHR), and there is a `DELETE` trigger to
      confirm it is ignored. All are served by MSW returning JSON.
- [x] AC-11: **Extended HTTP body validations** and **fixture mode** are both
      exercisable from the store/forms flows, with the Config toggles documented in
      their feature cards.
- [x] AC-12: **SPA routing / cross-app crossing** — navigating between remotes in
      the shell uses the History API (client-side) and produces a
      `cy.url().should('include', …)`; `mfe-admin` additionally has **internal**
      sub-routes via `pushState`.
- [x] AC-13: **Cross-app continuity (spec 006)** — with `?recorder=shell` a
      recording started in one remote survives navigating to another; with
      `?recorder=mfe` each remote mounts its own recorder and continuity is carried
      by the persisted session.

### Guidance & "how to activate"
- [x] AC-14: A shared `<feature-card>` Web Component wraps each demo, showing:
      the feature name, **how to activate it** (shortcut/toggle/interaction), and
      the **expected Cypress command/output**.
- [x] AC-15: The shell has a **Guía** route: a matrix of all feature areas →
      activation method → which app/page to test it in → expected output, including
      the keyboard-shortcut table and the Option A/B explanation with the caveat.
- [x] AC-16: The recorder is mounted per the `?recorder=` query param (default
      `shell` = Option A); the Guide documents both and warns about B's transient
      double-`cy.wait`.

### File-system features
- [x] AC-17: The example ships a real `ejemplo/cypress/` with `e2e/` (a sample
      `.cy.ts`) and `fixtures/`, so the File panel, fixture writing, and the runner
      can be tried; the README documents `npx lib-e2e-cypress-runner`.

### Docs & gates
- [x] AC-18: `ejemplo/README.md` documents install, `npm run dev`, the ports, the
      `?recorder=` toggle, and a per-app feature checklist. The root `README.md`
      "example project" reference is updated to the new setup.
- [x] AC-19: The example builds cleanly (`npm run build` in `ejemplo/`) and each
      app boots. The **library's** own gates (root `lint` / `test` / `build` /
      coverage) remain green and unaffected (the example is not part of the
      library's test suite or coverage).

---

## Public API changes

None to the **library**. This spec only adds/changes the `ejemplo/` example
project. It relies exclusively on the already-public surface documented in the
README (the `<lib-e2e-recorder>` element, its attributes `start-hidden` /
`language`, the keyboard shortcuts, and the config toggles).

New example-only artifacts (not shipped in the npm package):

```
ejemplo/
  package.json                      # workspaces + orchestration scripts
  README.md
  cypress/
    e2e/showcase.cy.ts
    fixtures/.gitkeep
  packages/
    shared/                         # <feature-card>, MSW handlers, common CSS, mock data
    shell/                          # host: vite federation host, router, recorder mount, Guía
    mfe-store/                      # remote: expose ./mount
    mfe-forms/                      # remote: expose ./mount
    mfe-admin/                      # remote: expose ./mount
```

---

## Out of scope

- Any change to the library's own source, public API, tests, or coverage.
- Cross-**origin** microfrontends or `cy.origin` generation (spec 006 is same-origin).
- Server-side rendering, real backend, authentication, or a database — the mock
  API is MSW-only and in-memory.
- Production deployment of the example (dev-server experience only).
- Automated e2e tests *of the example itself*; the shipped `cypress/` spec is a
  fixture for trying the File panel/runner, not a CI gate.
- Translating the example UI to the 5 library languages (example copy is Spanish);
  the library widget inside it still auto-detects/【`language`】 as usual.

---

## Implementation notes

### Module Federation layout
- Host (`shell`) `vite.config.ts`: `federation({ name: 'shell', remotes: { store:
  'http://localhost:5001/assets/remoteEntry.js', forms: '…:5002…', admin:
  '…:5003…' }, shared: [] })`.
- Each remote: `federation({ name: 'mfe-store', filename: 'remoteEntry.js',
  exposes: { './mount': './src/mount.ts' } })` and `build.target: 'esnext'`.
- `mount.ts` contract per remote: `export function mount(el: HTMLElement): void`
  (defines/appends its custom elements) and `export function unmount(el): void`
  (cleans up), so the shell router can swap apps and exercise unmount/remount
  (spec 006 Option B).

### Shell router & recorder placement
- Client-side router using the History API (`pushState` + `popstate`); links call
  `history.pushState` so the recorder emits `cy.url()` on crossings.
- `?recorder=shell` (default): the shell mounts a single `<lib-e2e-recorder>` that
  is never torn down → Option A. `?recorder=mfe`: the shell mounts **no** recorder;
  each remote's `mount()` creates its own `<lib-e2e-recorder>` and removes it on
  `unmount()` → Option B (continuity via the persisted session).

### Mock API (MSW)
- One shared `handlers.ts` in `packages/shared` with `GET /api/products`,
  `GET /api/products/:id`, `POST /api/orders`, `PUT /api/orders/:id`,
  `DELETE /api/orders/:id` (returns 204), all JSON.
- The worker is started once from the shell (host origin), covering remotes since
  federation loads them into the host origin at runtime. MSW intercepts at the SW
  layer, so the library's `window.fetch`/XHR patches still run and record.

### `<feature-card>` (shared web component)
- Attributes/props: `feature`, `how` (activation steps), `expected` (Cypress
  snippet). Renders a titled panel with a "cómo activar" list and a code block.
  Pure, Shadow-DOM, reused across all apps to satisfy AC-14.

### Library consumption & scripts
- `ejemplo/package.json` root: `"dev": "npm --prefix .. run build && concurrently
  \"npm:dev:*\""` with `dev:shell/store/forms/admin` per workspace; `"build"`
  builds all workspaces.
- Remotes must be built (or running) for the host to resolve `remoteEntry.js`; in
  dev we run all four dev servers concurrently.

### Cypress folder
- `ejemplo/cypress/e2e/showcase.cy.ts` (a minimal `describe/it`) and an empty
  `fixtures/` so File-panel insertion, fixture writing, and `npx
  lib-e2e-cypress-runner` can be demonstrated against a real folder.

---

## Open questions

- [x] Q1: `concurrently` vs a single Vite multi-app runner for `npm run dev` —
      pick whichever gives the cleanest one-command start on Windows.
- [x] Q2: Should the Guide page live in the shell only, or also be reachable as a
      floating "?" independent of the library's own help panel? (Lean: shell route
      only, to avoid confusion with the widget's in-app help.)
- [x] Q3: MSW `onUnhandledRequest` policy — bypass (so federation/asset requests
      are untouched) vs warn. (Lean: bypass.)

---

## History

| Date       | Change                          |
|------------|---------------------------------|
| 2026-07-06 | Initial draft. Decisions: delete Angular example; rebuild as Vite + TS + Web Components monorepo; Module Federation host + 3 remotes; `?recorder=shell\|mfe` toggle for spec-006 Option A/B; MSW mock API; `<feature-card>` + Guía page for "how to activate"; real `cypress/` folder for File panel/fixtures/runner. |
