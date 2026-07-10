# 017 — Security & Quality Audit Fixes

> **Status:** In Progress
> **Date:** 2026-07-09
> **Author:** Gonzalo
> **Source:** `AUDITORIA.md` (automated audit dated 2026-07-09)

---

## Context and motivation

An automated audit of the repo surfaced four categories of issues: security
vulnerabilities, architectural smells, code-quality gaps, and process/org
weaknesses. This spec tracks every actionable finding so nothing is lost and
work can be prioritized and closed one item at a time.

Issues are ordered by priority exactly as in the audit: 🔴 security first,
then 🟠 architecture, 🟡 code quality, 🟢 org/process.

---

## Use cases

1. **UC-01** — A CI pipeline catches a code-injection regression before it
   reaches npm.
2. **UC-02** — A developer or security tool scanning the published package
   finds no obvious injection vectors in the generated Cypress commands.
3. **UC-03** — Two instances of the widget on the same page do not interfere
   with each other's `window.fetch` / `window.XMLHttpRequest` patching.
4. **UC-04** — A new contributor can push a branch and get lint + test +
   coverage + build feedback without touching their machine.
5. **UC-05** — Sensitive fields (passwords, tokens) do not appear in generated
   fixtures or `cy.intercept` stubs.

---

## Acceptance criteria

### 🔴 Security

- [ ] **AC-01 — Code injection in generated Cypress commands.**
  All selector values, attribute values, and HTTP response-key identifiers that
  get interpolated into generated `.cy.ts` code in
  `src/services/recording.service.ts` and `src/services/http-monitor.ts` are
  escaped with `escapeSingleQuotes` (or equivalent) before interpolation.
  A unit test covers a selector containing `'); cy.exec('rm -rf /')` and
  verifies the output string is syntactically safe.

- [ ] **AC-02 — CORS on the local runner.**
  `src/runner/runner.ts` does **not** send `Access-Control-Allow-Origin: *`.
  Instead it restricts to `http://localhost` or reads the allowed origin from
  an env-var / CLI flag.
  A unit test asserts that requests from an unexpected origin get a non-2xx
  response (or that the header value is not `*`).

- [ ] **AC-03 — Sensitive-field redaction in HTTP fixtures.**
  `src/services/http-monitor.ts` (registerFixture / addCommand path) redacts
  values for keys matching `password`, `token`, `secret`, `authorization`,
  `cookie`, `access_token`, `refresh_token` (case-insensitive, nested objects
  included) before persisting to IndexedDB or writing fixtures.
  Redacted value is the string `"[REDACTED]"`.
  Unit tests cover: top-level key, nested key, array of objects, and a key
  that does NOT match (must pass through unchanged).

- [ ] **AC-04 — Custom Element namespacing + safe registration.**
  All `customElements.define` calls use the prefix `lib-e2e-` (e.g.
  `lib-e2e-help-panel`, `lib-e2e-save-test`, `lib-e2e-selector-picker`, etc.).
  Every registration is wrapped in a guard:
  ```typescript
  if (!customElements.get('lib-e2e-xxx')) {
    customElements.define('lib-e2e-xxx', XxxElement);
  }
  ```
  Templates / parent components that use these elements by tag name are updated
  to use the new prefixed names.
  Unit tests that reference element tag names are updated accordingly.

- [ ] **AC-05 — Production-use warning in README.**
  `README.md` contains a clearly visible warning (e.g. `> ⚠️ **Do not use in
  production**`) near the top explaining that this is a dev/QA tool and that
  mounting it in production exposes the runner endpoint and may log sensitive
  data.

### 🟠 Architecture

- [ ] **AC-06 — HttpMonitor as a true singleton with ref-counting.**
  `src/services/http-monitor.ts` is refactored into a module-level singleton.
  `install()` increments a counter; `uninstall()` only restores
  `window.fetch`/`window.XMLHttpRequest` when the counter reaches zero.
  Unit tests cover: two installs → one uninstall leaves fetch patched; two
  installs → two uninstalls restores original fetch.

- [ ] **AC-07 — Remove dead singleton export from PersistenceService.**
  The `persistenceService` singleton export at the bottom of
  `src/services/persistence.service.ts` is removed. No external callers exist
  (verified by grep). Tests and barrel `src/index.ts` are updated if needed.

- [ ] **AC-08 — Remove Subject from public barrel.**
  `Subject` is removed from `src/index.ts` exports. It is an internal
  implementation detail. This is a **breaking change** only if consumers import
  it directly — add a note in the changelog.

- [ ] **AC-09 — Archive obsolete migration docs.**
  `HANDOFF.md` and `MIGRATION_PLAN.md` are moved to `docs/archive/` with a
  one-line header noting they describe a completed migration and are kept for
  historical reference only.

- [ ] **AC-10 — Update ROADMAP.md.**
  `docs/ROADMAP.md` is updated to reflect the current state: specs 011/012
  shipped, current version is 0.9.0, spec 013 noted as intentionally skipped
  (reserved/void), specs 015/017 in progress.

### 🟡 Code quality

- [ ] **AC-11 — Elevate no-explicit-any and no-non-null-assertion to error.**
  `eslint.config.js` changes `warn` → `error` for
  `@typescript-eslint/no-explicit-any` and
  `@typescript-eslint/no-non-null-assertion`. `npm run lint` still exits 0
  (no current violations to fix).

- [ ] **AC-12 — Cover DEFAULT_LOGIN_SETUP_CONFIG.**
  `specs/models.spec.ts` (or a new model spec) exercises
  `DEFAULT_LOGIN_SETUP_CONFIG` so `src/models/login-setup.model.ts` reaches
  ≥ 80% line coverage.

- [ ] **AC-13 — Fix branch coverage in test-editor.**
  `src/components/test-editor/test-editor.ts` lines 61-63 and 174-175
  (currently uncovered branches) are exercised by new or updated tests in
  `specs/components/test-editor.spec.ts`. File-level branch coverage ≥ 80%.

### 🟢 Org / process

- [ ] **AC-14 — GitHub Actions CI.**
  A workflow file `.github/workflows/ci.yml` is added that runs on every push
  and pull request to `main`:
  - `npm run lint`
  - `npm test`
  - `npm run test:coverage` (fails if coverage drops below 80%)
  - `npm run build`
  Uses `ubuntu-latest`, Node 20.

- [ ] **AC-15 — Git tags for v0.8.0 and v0.9.0.**
  Annotated tags `v0.8.0` and `v0.9.0` are created pointing at the appropriate
  commits (last commit before the 0.9.0 bump for v0.8.0; the version bump
  commit for v0.9.0).

---

## Out of scope

- Refactoring `lib-e2e-recorder.ts` into sub-services (AC-06 in the audit —
  large scope, separate spec).
- Replacing SweetAlert2 with `<dialog>` native (low priority, mentioned in
  audit but deferred).
- `noUncheckedIndexedAccess` / `noImplicitOverride` tsconfig flags — evaluated
  but not committed until impact is measured.
- ESLint `complexity` / `max-lines` rules — evaluated but not added until
  baselines are agreed.
- Automated npm publish workflow (related to AC-15 but separate concern).
- README TOC (cosmetic, out of scope for this spec).

---

## Implementation notes

### AC-01 — Injection in generated code

`escapeSingleQuotes` already exists in `src/utils/code-format.utils.ts` and is
used in some paths. The fix is to apply it (and `escHtml`/`escAttr` where
needed) at every interpolation point in `recording.service.ts` and
`http-monitor.ts`. A secondary check: JSON keys used as identifiers should be
validated against `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/` before direct interpolation.

#### Laboratorio de casos extremos (ejemplo app)

A dedicated lab page (`/lab` route in the shell, `packages/shell/src/pages/lab.ts`)
contains interactive elements that trigger each of the three escape problems:

| Section | Element | Problem exercised |
|---|---|---|
| Caso A | `<button data-cy="o'brien-btn">` | Single-quote in selector |
| Caso A | `<a aria-label="don't click me">` | Single-quote in aria-label |
| Caso A | `<input data-cy="apostrophe-input">` | Single-quote in typed value |
| Caso A | `<input data-cy="backslash-input">` | Backslash in typed value |
| Caso B | `<button data-cy='say "hello"'>` | Double-quote in CSS attribute |
| Caso B | `<a aria-label='10" screen'>` | Double-quote in aria-label |
| Caso C | `GET /api/edge-case` (MSW handler) | Kebab-case JSON keys |

Each section includes a "¿Cuándo afecta a tu empresa?" explanation and the
expected command output so the reviewer knows exactly what to verify.

To use the lab for manual AC-01 verification:
1. Start the ejemplo app (`npm run dev` from `ejemplo/`)
2. Navigate to `http://localhost:5000/lab`
3. Start recording (`Ctrl+R`)
4. Interact with each element as instructed
5. Stop recording and inspect the generated commands panel (`Ctrl+2`)

### AC-03 — Redaction

A pure utility function `redactSensitiveFields(obj: unknown): unknown` in
`src/utils/redact.utils.ts` handles the traversal. It is called just before
`registerFixture` and `addCommand` in `http-monitor.ts`. Being pure makes it
fully unit-testable without any I/O.

### AC-04 — Custom Element renaming

Old name → New name mapping:
| Old tag | New tag |
|---|---|
| `help-panel` | `lib-e2e-help-panel` |
| `selector-picker` | `lib-e2e-selector-picker` |
| `save-test` | `lib-e2e-save-test` |
| `file-preview` | `lib-e2e-file-preview` |
| `test-editor` | `lib-e2e-test-editor` |
| `test-previsualizer` | `lib-e2e-test-previsualizer` |
| `advanced-test-editor` | `lib-e2e-advanced-test-editor` |
| `e2e-configuration` | `lib-e2e-configuration` |

`lib-e2e-recorder` already has the right prefix — no change needed.
The rename must propagate to: template strings in
`lib-e2e-recorder.ts`, `configuration.template.ts`, `save-test.template.ts`,
the ejemplo shell, and all spec files that use `document.createElement(...)`.

### AC-06 — HttpMonitor singleton

```typescript
// module-level state
let _refCount = 0;
let _originalFetch: typeof window.fetch | null = null;
let _originalXHR: typeof window.XMLHttpRequest | null = null;

export function installMonitor(): void { ... }
export function uninstallMonitor(): void { ... }
```

Existing `HttpMonitor` class is kept as a wrapper that delegates to these
module-level functions, so public API surface is unchanged.

### AC-14 — CI

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run test:coverage
      - run: npm run build
```

---

## Open questions

- [ ] Q1: For AC-04 (Custom Element renaming), the ejemplo app hard-codes the
  old tag names. Should the rename be applied there too, or only in the library
  source? (The ejemplo is a showcase, not a consumer dependency.)
  → Pending decision.

- [ ] Q2: For AC-02 (CORS), should the allowed origin be configurable via CLI
  arg (`--allow-origin=http://myapp.test`) or always locked to `localhost`?
  → Pending decision.

---

## History

| Date       | Change        |
|------------|---------------|
| 2026-07-09 | Initial draft from AUDITORIA.md findings |
