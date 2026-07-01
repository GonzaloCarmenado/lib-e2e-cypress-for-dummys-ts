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

Other capabilities: HTTP monitoring (`cy.intercept`/`cy.wait`, optional body
validations), advanced editor + File System Access (insert into `.cy.ts`),
save/manage tests + tags, import/export JSON, i18n (es/en/fr/it/de), invisible
mode (`start-hidden`, Ctrl+Shift+E), keyboard shortcuts, assertion builder.

---

## Release status

- **0.7.0** (spec 009, assertions): on `main`, tagged `v0.7.0`, pushed — **not yet
  published to npm** (held for manual testing).
- **spec 010** (interactions): done + green, on branch `feat/010-richer-interactions`
  — not merged/published yet.
- **Plan (recommended):** merge 010 → `main` and cut a single **0.8.0** that ships
  assertions + interactions (npm jumps 0.6.1 → 0.8.0; `v0.7.0` stays an internal
  milestone). Decide after testing.

---

## Backlog (prioritised)

1. **In-app Help modal** — a discoverable "what can this do?" panel (shortcuts +
   features cheat-sheet), because the app has grown a lot. *(candidate spec 011)*
2. **HTTP → fixtures** — save captured responses to `cypress/fixtures/*.json` and
   generate `cy.intercept(..., { fixture })`.
3. **More interactions (part 2)** — file upload (`<input type=file>` →
   `.selectFile(...)`); drag & drop / hover.
4. **Auto-login generator** — generate a programmatic login `beforeEach`/command
   from the captured auth request (real call, reusable). *Deferred (complex).*

## Tech debt (from the general review)

- Runner CORS `*` + no auth (dev-only, but tighten).
- `extendedHttpCommands` dual source of truth (IndexedDB + localStorage).
- `alert()` → `showToast` in configuration import feedback.
- `lib-e2e-recorder.ts` is large (≈1000 lines) — extract the duplicated Swal
  dialog scaffold + inline HTML/styles.
- Optional: redact sensitive typed values / HTTP bodies before persist/export.
