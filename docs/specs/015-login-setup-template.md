# 015 — Login Setup Template

> **Status:** In Progress
> **Date:** 2026-07-09
> **Author:** Gonzalo

---

## Context and motivation

Every real Cypress suite needs a login strategy. The current library generates
`it()` blocks and `beforeEach()` interceptors, but has no concept of
authentication setup. Each team ends up manually wiring their own login service
into every new test file.

The established pattern in IESA projects is:

```
cypress/
  common-services/
    login.service.ts     ← shared auth logic (never committed, each project fills it)
  support/
    e2e.ts               ← global before() that calls fetchToken once
  e2e/
    *.cy.ts              ← each file has a beforeEach() that calls setupInterceptors(token)
```

This spec adds a **Login Setup** panel inside the recorder configuration that
lets the user:

1. **Create** a virgin scaffold `login.service.ts` in their project, or
   **select** one that already exists.
2. **Detect** the exported functions of that file automatically.
3. **Assign** one function to the global `before()` block (run once per suite)
   and one to the `beforeEach()` block (run before every test).
4. Have those blocks **auto-injected** into every new `.cy.ts` file the library
   creates, with the correct import statement.

The library never reads or writes login credentials. It only manages the
generated scaffold structure — the user fills in all the logic.

---

## Use cases

1. **UC-01 — New project, create scaffold from scratch**
   As a QA engineer starting a new project, I want to open the Login Setup panel
   and generate an empty `login.service.ts` scaffold in my Cypress folder so
   that I have a consistent starting point to implement my own auth logic.

2. **UC-02 — Existing project, reuse existing service**
   As a QA engineer whose project already has a login service, I want to point
   the library to that file so it can detect the exported functions without
   creating anything new.

3. **UC-03 — Select which functions to inject**
   As a QA engineer, I want to choose from the detected exports which function
   goes in the `before()` block and which goes in `beforeEach()`, so that I
   can match the architecture of my project.

4. **UC-04 — Auto-inject into new test files**
   As a QA engineer, I want every new `.cy.ts` file the library creates to
   already contain the correct import and the `before()`/`beforeEach()` blocks
   so that I never have to add them manually.

5. **UC-05 — Disable login setup**
   As a QA engineer working on a project without shared auth, I want to be
   able to turn off login setup entirely so that generated files remain clean.

6. **UC-06 — Reset / change the service file**
   As a QA engineer, I want to change the linked service file or clear the
   configuration at any time from the Login Setup panel.

---

## Acceptance criteria

### Panel and navigation

- [ ] AC-01: The configuration panel shows a **"Login Setup"** card with a
      button that opens the Login Setup panel (full modal overlay, not an
      inline section — consistent with the export dialog pattern).
- [ ] AC-02: The Login Setup panel can be closed without saving changes via a
      cancel/close action; no state is mutated on cancel.
- [ ] AC-03: The panel shows the current configured state on open (file path,
      detected functions, assigned roles) if a service has already been linked.

### File selection — create or pick

- [ ] AC-04: The panel presents two mutually exclusive starting options:
      **"Create scaffold"** and **"Select existing file"**.
- [ ] AC-05: **Create scaffold** — clicking the action uses the File System
      Access API (same grant the library already holds) to write a new
      `login.service.ts` file at a path the user chooses within the cypress
      folder. The file is a commented stub with two exported function skeletons
      (one for token retrieval, one for interceptor setup). No credentials, no
      logic.
- [ ] AC-06: **Select existing** — clicking the action opens a file picker
      restricted to `.ts` files; the user picks their existing login service.
- [ ] AC-07: After creating or selecting a file, the panel immediately scans
      it and displays the list of detected exported functions (see AC-08).

### Function detection

- [ ] AC-08: The library parses the selected `.ts` file with a lightweight
      regex scan (no full TypeScript parser required) and extracts the names
      of all top-level `export function` and `export const … = (…) =>` 
      declarations.
- [ ] AC-09: If no exported functions are found, the panel shows an
      informational message ("No exported functions found — fill in the
      scaffold and reopen") and disables the assignment step.
- [ ] AC-10: A **"Re-scan"** button re-reads the file (via File System Access
      API if the handle is still valid, otherwise from the cached content) and
      refreshes the function list and the cache in IndexedDB — no re-picking
      required after a page reload.

### Function assignment

- [ ] AC-11: The panel shows two dropdowns (or select elements):
      - **"before() function"** — called once per suite to retrieve the token /
        set up global state. Optional (can be left as "None").
      - **"beforeEach() function"** — called before every test to configure
        interceptors / restore state. Optional (can be left as "None").
- [ ] AC-12: Both dropdowns list the detected exported functions plus a
      "None" option.
- [ ] AC-13: The same function can be assigned to both dropdowns simultaneously
      (some projects use a single all-in-one setup function).

### Persistence

- [ ] AC-14: The configured state (file path, before function name, beforeEach
      function name, enabled flag) is persisted in IndexedDB via
      `PersistenceService` — survives page reload, same as other settings.
- [ ] AC-15: A **"Clear"** button in the panel resets all login setup state and
      removes the persisted config.

### Code generation

- [ ] AC-16: When login setup is enabled and a function is assigned,
      `createNewFile()` in `AdvancedTestEditorElement` injects the following
      at the top of the generated `describe` scaffold:

      ```typescript
      import { fnName } from '../common-services/login.service';
      // (path relative to the new file's location, derived from both paths)

      describe('suite name', () => {
        before(() => { beforeFn(); });       // only if before() fn is assigned
        beforeEach(() => { beforeEachFn(); }); // only if beforeEach() fn is assigned

        it('should ', () => {
          // ...
        });
      });
      ```

- [ ] AC-17: The import path is computed relative to the new file's location
      (both paths are known from the File System Access handles).
- [ ] AC-18: If only `beforeEach()` is assigned (no `before()`), only the
      `beforeEach` block is injected — no empty `before(() => {})`.
- [ ] AC-19: If login setup is disabled or no functions are assigned, file
      generation is identical to the current behaviour (no regression).

### Scaffold file content

- [ ] AC-20: The generated scaffold contains:
      - A file-level comment explaining the purpose and that the user must fill
        in the logic.
      - Two exported stub functions with generic names
        (`fetchAuthToken` and `setupRequestInterceptors`), empty bodies, and
        a `// TODO: implement` comment inside each.
      - No imports, no credentials, no project-specific logic.

### Injection into existing files

- [ ] AC-24: When saving commands to an **existing** `.cy.ts` file via the
      advanced editor, if login setup is enabled and the file does not already
      contain the configured function calls, the library presents a confirmation
      dialog ("Add login blocks?"). If the user confirms, the import line is
      prepended to the file and the `before()`/`beforeEach()` blocks are
      inserted right after the `describe(` opening — identical content to what
      `createNewFile()` would generate. If the file already contains the
      function calls, no dialog is shown and the save proceeds silently.

### Settings card (summary view)

- [ ] AC-21: When login setup is configured, the settings card shows a
      one-line summary: the filename and the two assigned function names (or
      "—" for unassigned).
- [ ] AC-22: When login setup is not configured, the card shows "Not
      configured" and a single "Set up" button.

### i18n

- [ ] AC-23: All user-visible strings in the panel go through `TranslationService`;
      new keys are added to all 5 language files (`es`, `en`, `fr`, `it`, `de`).

---

## Public API changes

```typescript
// PersistenceService — new settings key alongside existing ones
interface LoginSetupConfig {
  enabled: boolean;
  filePath: string;            // user-defined path (display only, for the summary)
  fileContent: string;         // cached file content — enables re-scan without re-picking
  detectedFunctions: string[];
  beforeFn: string | null;
  beforeEachFn: string | null;
}

// New methods on PersistenceService
saveLoginSetup(config: LoginSetupConfig): Promise<void>;
getLoginSetup(): Promise<LoginSetupConfig | null>;
clearLoginSetup(): Promise<void>;

// ConfigurationElement — new state
loginSetupConfig: LoginSetupConfig | null;
isLoginSetupOpen: boolean;
openLoginSetupPanel(): void;
closeLoginSetupPanel(): void;
saveLoginSetupConfig(config: LoginSetupConfig): Promise<void>;
clearLoginSetupConfig(): Promise<void>;

// New utility (pure, unit-testable)
// src/utils/login-setup.utils.ts
export function extractExportedFunctions(fileContent: string): string[];
export function buildLoginScaffold(): string;
export function buildLoginImportPath(fromFile: string, toServiceFile: string): string;
export function buildLoginBlocks(
  importPath: string,
  beforeFn: string | null,
  beforeEachFn: string | null,
): { importLine: string; beforeBlock: string; beforeEachBlock: string };

// AdvancedTestEditorElement — createNewFile() is extended (no signature change)
// It reads loginSetupConfig from ConfigurationElement and injects blocks when configured.
```

New i18n keys (under `CONFIG.LOGIN_SETUP.*`):
```
TITLE, OPEN_BTN, NOT_CONFIGURED, SET_UP_BTN,
CREATE_SCAFFOLD, SELECT_EXISTING, RESCAN,
BEFORE_LABEL, BEFORE_EACH_LABEL, NONE_OPTION,
NO_FUNCTIONS_FOUND, SAVE_BTN, CLEAR_BTN, CANCEL_BTN,
SUMMARY_LABEL
```

---

## Out of scope

- Reading, parsing, or executing the login logic inside the service file —
  the library only reads export names, never the function bodies.
- Storing or displaying credentials of any kind.
- Injecting `before()`/`beforeEach()` into **existing** `.cy.ts` files when
  inserting an `it()` block — only new file creation is in scope.
- Multiple login profiles (e.g., admin vs. standard user) — one active config
  at a time; profiles are future work.
- Validating that the assigned function actually performs authentication —
  the library cannot know this.
- Support for CommonJS (`module.exports`) — only ES module `export` syntax
  is scanned.

---

## Implementation notes

- **File System Access API** — the library already requests a directory handle
  for the `cypress/e2e` folder. The login service file lives in
  `cypress/common-services/`, which is a sibling directory. The user will need
  to grant access to the parent `cypress/` directory (or the
  `common-services/` subfolder directly) for create/read operations. The
  existing `hasPermission` / `requestPermission` flow in
  `AdvancedTestEditorElement` serves as the reference.

- **Function extraction** — a regex like
  `/export\s+(async\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*=/g`
  is sufficient for the typical login service file. A full TS AST is not
  needed and would add unacceptable bundle weight.

- **Relative import path** — both file handles carry `.name` (filename only).
  Full relative paths must be reconstructed from the stored path strings.
  A helper `buildLoginImportPath(from, to)` handles the `../` logic and is
  unit-tested independently.

- **Panel UI** — the Login Setup panel follows the same overlay/modal pattern
  as the export dialog (`export-overlay` / `export-modal` CSS classes).
  It is driven by an `isLoginSetupOpen` boolean on `ConfigurationElement`,
  rendered inline in `configuration.template.ts`.

- **No DB schema version bump** — `LoginSetupConfig` is stored as a single
  JSON blob under a new key in the existing `settings` object store, same as
  `issueTrackerConfig`. No migration needed.

---

## Open questions

- [x] Q1: Should the "Create scaffold" path be free-form (user types the
      filename) or always fixed to `cypress/common-services/login.service.ts`?
      → **Free-form from the start** — user types the filename/path they want.
- [x] Q2: When the user selects an existing file, should its content be
      **cached** in IndexedDB (for re-scan without re-picking) or only the
      file path stored (requiring re-pick after page reload)?
      → **Cache the content** — stored in IndexedDB alongside the config so
      re-scan works after reload without prompting the file picker again.

---

## History

| Date       | Change        |
|------------|---------------|
| 2026-07-09 | Initial draft |
| 2026-07-09 | Q1 resolved: free-form path. Q2 resolved: cache file content in IndexedDB. |
