# Roadmap & backlog — lib-e2e-cypress-for-dummys

Living document. Quick index of what the app does + what's pending. Detailed specs
live in `docs/specs/`.

---

## Shipped (with spec)

| Spec | Feature |
|------|---------|
| 001 | Smart selector picker (choose a better selector via a modal) |
| 002 | Test notes field |
| 003 | Export selection (all / manual / by tags) |
| 004 | Merge on import (never wipe existing tests) |
| 005 | Launch test runner (`npx lib-e2e-cypress-runner`, run a spec headless) |
| 006 | Cross-app recording continuity (micro-frontends, same origin) |
| 007 | Draggable recording widget (adaptive expansion, remembered position) |
| 008 | Lifecycle & fidelity fixes (reconnect rebuild, interceptor gate, drag-click, assertion escaping) |
| 009 | Assertion capture while recording (**Alt+click** → auto `should(...)`) |
| 010 | Richer interactions (dblclick, right-click, checkbox/radio, Enter/Escape) |
| 011 | In-app help panel (shortcut cheat-sheet, discoverable features) |
| 012 | HTTP responses → Cypress fixtures (`cy.intercept` with `{ fixture }`) |
| 013 | *(reserved / void — intentionally skipped)* |
| 014 | Ticket reference & grouping (Jira/Linear ticket field in settings) |
| 015 | Login Setup Template (scaffold or link existing login service, auto-inject before/beforeEach) |
| 016 | Example microfrontend showcase (Module Federation demo app with lab page) |

Other capabilities: HTTP monitoring (`cy.intercept`/`cy.wait`, optional body
validations), advanced editor + File System Access (insert into `.cy.ts`),
save/manage tests + tags, import/export JSON, i18n (es/en/fr/it/de), invisible
mode (`start-hidden`, Ctrl+Shift+E), keyboard shortcuts, assertion builder.

---

## Release status

- **1.0.0** — first stable release (public API frozen). Backed by the general
  audit (spec 021, `docs/audits/2026-07-14-audit.md`). Version bumped; publish
  pending.
- **0.10.0** — published. Includes specs 001–012, 014, 015, 016, 017, 018 (refactor), 019 (file upload → .selectFile()).

---

## Backlog (prioritised)

1. ~~**Recorder refactor**~~ — done (spec 018). `lib-e2e-recorder.ts` 1053 → 936 lines; extracted `ensurePopupDimensions`, `injectAssertionBuilder`, `mountFilesystemSetupContent`, `mountComponentInSwal`, `openSwalDialog`.
2. ~~**File upload recording**~~ — done (spec 019). `input[type=file]` change → `.selectFile('cypress/fixtures/…')`. Bytes captured in memory; auto-copy via FSAA on Save-and-Edit or toast warning for IndexedDB save.
3. **More interactions (part 3)** — drag & drop / hover as recorded Cypress commands.
4. ~~**Auto-login generator**~~ — superseded by Login Setup Template (spec 015).
5. ~~**Runner hardening**~~ — closed: dual-source is intentional (see comments in code); `alert()` → `showToast` fixed.

### Deferred from the 2026-07-14 audit (spec 021)

- **F4 — Login-setup surface decision.** Login-setup persistence methods are
  public but the feature is unvalidated (memory `spec_015_status`). Decide
  before/at 1.0 whether to freeze or mark experimental.
- **F5 — Recorder decomposition.** `lib-e2e-recorder.ts` (~940 lines) still owns
  widget-drag, session-continuity and dialog orchestration. Extract
  `WidgetDragController` / `SessionContinuityController` / `DialogManager`.
- **F6 — Magic-string storage keys.** Hoist `'extendedHttpCommands'`,
  `'fixtureMode'`, `'e2e-recording-history'` to shared exported constants.
- **LOW polish:** `runner.ts:137` floating promise → 500; `configuration.ts`
  unguarded element casts → `?.`; `escAttr` `&` escaping; FSAA filename
  sanitisation + per-file try/catch; dedupe write/permission blocks;
  `file-preview.ts` clipboard `.catch`; remove vestigial interceptor loop in
  `recoverLastRecording`; `filesystem-setup.ts`/`assertion-builder.ts` split into
  pure render + wire; `http-monitor.ts` `.service` rename.
- **devDependency advisories** (`ws`/cypress chain) — tooling only, never
  shipped; run `npm audit fix` opportunistically.
