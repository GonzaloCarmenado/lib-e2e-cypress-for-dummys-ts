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

- **0.10.0** — current version on `main`. Includes specs 001–012, 014, 015, 016, 017.

---

## Backlog (prioritised)

1. ~~**Recorder refactor**~~ — done (spec 018). `lib-e2e-recorder.ts` 1053 → 936 lines; extracted `ensurePopupDimensions`, `injectAssertionBuilder`, `mountFilesystemSetupContent`, `mountComponentInSwal`, `openSwalDialog`.
2. ~~**File upload recording**~~ — done (spec 019). `input[type=file]` change → `.selectFile('cypress/fixtures/…')`. Bytes captured in memory; auto-copy via FSAA on Save-and-Edit or toast warning for IndexedDB save.
3. **More interactions (part 3)** — drag & drop / hover as recorded Cypress commands.
3. ~~**Auto-login generator**~~ — superseded by Login Setup Template (spec 015).
4. ~~**Runner hardening**~~ — closed: dual-source is intentional (see comments in code); `alert()` → `showToast` fixed.
