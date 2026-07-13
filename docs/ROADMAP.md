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

1. **Auto-login generator** — generate a programmatic login `beforeEach`/command
   from the captured auth request (real call, reusable). *Deferred (complex).*
2. **More interactions (part 2)** — file upload (`<input type=file>` →
   `.selectFile(...)`); drag & drop / hover.
3. **Runner hardening** — ~~`extendedHttpCommands` dual source~~ (intentional: localStorage = sync cache for real-time interception, IndexedDB = persistence; mirrored on mount by `initHttpConfig()`); ~~`alert()` → `showToast` in config import~~ (fixed).
4. **Recorder refactor** — `lib-e2e-recorder.ts` is ≈1000 lines; extract duplicated
   Swal dialog scaffold + inline HTML/styles into sub-services.
