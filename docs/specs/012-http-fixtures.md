# 012 — HTTP responses → Cypress fixtures

> **Status:** Implemented
> **Date:** 2026-07-02
> **Author:** Gonzalo

---

## Context and motivation

Today HTTP monitoring records a **spy**: `cy.intercept('GET','**/api')` + a
`cy.wait('@alias')` that hits the real backend (optionally asserting body fields).
That couples the test to a live backend and to changing data.

This adds an optional **fixture (stub) mode**: while recording, a GET response is
saved as a `cypress/fixtures/<alias>.json` file and the interceptor becomes a
**stub** — `cy.intercept('GET','**/api',{ fixture:'<alias>.json' }).as('alias')` —
so the test replays deterministic data with no backend.

### Decisions (product owner)

- **Opt-in toggle** in ⚙️ Config ("Record responses as fixtures"). Off → current
  spy behaviour (unchanged). On → GET calls become fixture stubs.
- **Write files to `cypress/fixtures/`** via the File System Access API using the
  already-configured Cypress folder handle. No folder → fall back to a toast (and
  the interceptor still references the fixture, to be created manually).
- **GET only.** POST/PUT keep the spy + body-validation behaviour.

---

## Use cases

1. **UC-01** — As a QA engineer, I enable fixture mode, record a flow, and the GET
   responses are saved as fixtures with matching `cy.intercept(...,{fixture})`
   stubs, so the test runs deterministically offline.
2. **UC-02** — As a QA engineer, when I save the test the fixture files are written
   into my `cypress/fixtures/` folder automatically.

---

## Acceptance criteria

- [x] AC-01: A **"Record responses as fixtures"** toggle exists in ⚙️ Config,
      persisted (IndexedDB + a `localStorage` mirror `fixtureMode`), with i18n ×5.
- [x] AC-02: With fixture mode **on**, a captured **GET** with a JSON response
      registers a **spy** interceptor during recording (`cy.intercept('GET','<wildcard>').as('<alias>')`)
      and captures the response JSON for deferred use; the stub form
      (`{ fixture:'<alias>.json' }`) is only emitted at save-and-export time.
- [x] AC-03: The GET response JSON is captured as a **fixture** (`<alias>.json`,
      pretty-printed) held by `RecordingService`; non-JSON GETs fall back to the
      normal spy (no fixture).
- [x] AC-04: With fixture mode **off**, HTTP behaviour is **exactly as before**
      (spy + optional body validation). POST/PUT are always spy.
- [x] AC-05: **Save strategy is decided at save time** (not during recording):
      - **"Save" (IndexedDB only)**: spy interceptors + inline validations saved;
        no fixture files written — even when fixture mode is on.
      - **"Save and Edit" + fixture mode ON + folder permission**: fixture stubs
        emitted, inline wait validations simplified, fixture files written.
      - **"Save and Edit" + fixture mode ON + no folder/permission**: fallback to
        spy interceptors; toast warns the user; nothing throws.
- [x] AC-06: `RecordingService` exposes `registerFixture` / `getFixturesSnapshot`;
      fixtures are cleared with `clearCommands`. `registerInterceptor` gained an
      optional `fixtureFile` param producing the `{ fixture }` form.
- [x] AC-07: `PersistenceService.writeFixtures(fixtures)` writes each file under
      `cypress/fixtures/` using the stored directory handle (permission-checked).
- [x] AC-08: Unit tests cover: fixture-mode GET (intercept+fixture+wait),
      non-JSON fallback, mode-off unchanged, POST unchanged, `writeFixtures`
      (mocked handle, no-folder, permission-request/deny), and the config toggle.
- [x] AC-09: `README.md` documents fixture mode; the Help "what it does NOT cover"
      line about fixtures is updated (now covered).
- [x] AC-10: Gates green — lint 0, 872 tests, coverage 95.96%, build clean.

---

## Public API changes

```typescript
// RecordingService
registerInterceptor(method: string, url: string, alias: string, fixtureFile?: string): void;
registerFixture(name: string, content: string): void;
getFixturesSnapshot(): Array<{ name: string; content: string }>;

// PersistenceService
writeFixtures(fixtures: Array<{ name: string; content: string }>): Promise<number>; // count written
```

New `configuration` key + `localStorage` mirror: `fixtureMode` ('true'|'false').
New i18n keys: `CONFIG.FIXTURE_SECTION` / `_TITLE` / `_SUB`, toasts
`RECORDER.FIXTURES_WRITTEN_TOAST`, `RECORDER.FIXTURES_NO_FOLDER_TOAST`.

---

## Out of scope

- Fixtures for POST/PUT/DELETE.
- Storing fixture **content** in IndexedDB / the cross-app active session (fixtures
  live on disk; only written at save time).
- Editing/trimming fixtures in the UI, response headers/status stubbing.
- Auto-detecting when a fixture is stale vs the live API.

---

## Implementation notes

- **Toggle**: mirror the `extendedHttpCommands` pattern (config + localStorage;
  recorder syncs the mirror on mount; `HttpMonitor.isFixtureModeEnabled()` reads it).
- **HttpMonitor**: always registers a spy interceptor regardless of fixture mode.
  For GET + fixture mode ON + JSON response, also calls `registerFixture(alias +
  '.json', pretty)` to capture the content for deferred use. The response body text
  is read once and reused for both the fixture snapshot and the extended-HTTP
  inline validations.
- **Fixtures store**: a `Map<string,string>` in `RecordingService` (not reactive);
  snapshot returns entries; `clearCommands` clears it too.
- **Deferred conversion** (`src/utils/fixture-convert.utils.ts`):
  `toFixtureInterceptors` rewrites spy interceptors to `{ fixture }` form for any
  alias that has a captured fixture; `simplifyFixtureWaits` strips inline body
  validations from the matching `cy.wait` commands.
- **Writing**: `PersistenceService.writeFixtures` reads `cypressDirectoryHandle`
  from config, `getDirectoryHandle('fixtures',{create:true})`, then writes each
  file (query/request `readwrite` permission).
  Recorder `onSaveTest` — plain save — never writes fixture files.
  Recorder `onSaveAndExportTest` — if fixture mode ON + fixtures exist: writes
  files, then inserts the test with converted interceptors; on failure, inserts
  with spy interceptors and shows a warning toast.

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-07-02 | Initial draft. Decisions: opt-in Config toggle; write to cypress/fixtures via File System Access; GET only. |
| 2026-07-02 | Implemented: HttpMonitor fixture branch for GET; RecordingService fixtures + `registerInterceptor(fixtureFile)`; `PersistenceService.writeFixtures`; Config toggle + i18n ×5; recorder writes fixtures on save. README + Help updated. Gates green (lint 0, 872 tests, coverage 95.96%, build 0). |
| 2026-07-06 | Behavioral fix: fixture-stub form now deferred to save-and-export time. `HttpMonitor` always records spy interceptors; `registerFixture` still captures GET JSON for potential use. `onSaveTest` no longer writes fixtures. `onSaveAndExportTest` conditionally converts + writes. New `fixture-convert.utils.ts` with `toFixtureInterceptors` / `simplifyFixtureWaits` (13 unit tests). Gates green (lint 0, 906 tests, coverage 95.68%, build 0). |
