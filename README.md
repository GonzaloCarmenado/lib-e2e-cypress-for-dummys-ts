# lib-e2e-cypress-for-dummys

> A floating widget that records real browser interactions and generates ready-to-run **Cypress E2E test code** — no setup required, no Cypress knowledge needed.

> **Development and QA environments only.** This is a developer tool for generating test code — it has no place in a production build. Not because of security vulnerabilities or performance problems, but simply because end users have no reason to see a test recorder widget. Load it conditionally (e.g. `if (process.env.NODE_ENV !== 'production')`) or gate it behind a build flag.

---

## What it does

Drop the widget into any web app. Press record. Click around. The widget watches every click, input, select, route change, HTTP call, and navigation event, and translates each one into the matching Cypress command in real time. Stop recording, give the test a name, and the code is saved to IndexedDB — ready to copy into your test suite.

**Zero framework coupling.** It is a plain Custom Element (`<lib-e2e-recorder>`). Angular, React, Vue, plain HTML — anything works.

---

## Why use it

| Without this library | With this library |
|---|---|
| Write `cy.get('[data-cy="..."]').click()` by hand | Click in the browser, get the command automatically |
| Manually craft `cy.intercept()` for every API call | Every fetch/XHR is captured and the interceptor is generated |
| Guess which selector attribute to use | Choose the strategy once in settings; the recorder handles the rest |
| Copy-paste commands into `.cy.ts` files | The advanced editor inserts the `it()` block directly into the file |
| Maintain tests in one language | Interface in ES / EN / FR / IT / DE, auto-detected from the browser |

---

## Installation

```bash
npm install lib-e2e-cypress-for-dummys-ts idb sweetalert2
```

The package ships three formats:

| File | Format | Use |
|---|---|---|
| `dist/index.js` | ESM | Modern bundlers (Vite, Angular, etc.) |
| `dist/index.cjs` | CJS | CommonJS environments |
| `dist/index.d.ts` | TypeScript declarations | Type-safe imports |

`idb` and `sweetalert2` are peer dependencies and must be installed alongside the library.

---

## Quick start — plain HTML

```html
<!DOCTYPE html>
<html>
<head>
  <!-- SweetAlert2 CSS (required for modals) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2/dist/sweetalert2.min.css" />
</head>
<body>
  <!-- Your app content here -->

  <lib-e2e-recorder></lib-e2e-recorder>

  <script type="module">
    import 'path/to/dist/index.js';
  </script>
</body>
</html>
```

The widget appears as a small floating panel. Press **⏺** to start recording.

---

## Quick start — Angular

**1. Register the custom element schema** (in `app.config.ts` or the module):

```typescript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// In a standalone component or NgModule:
schemas: [CUSTOM_ELEMENTS_SCHEMA]
```

**2. Import the library** in `main.ts` (or any file that is loaded before the widget is used):

```typescript
import 'lib-e2e-cypress-for-dummys-ts/dist/index.js';
```

**3. Add the element** to any template (typically `AppComponent`):

```html
<!-- Only render in non-production environments -->
@if (!isProduction) {
  <!-- start-hidden: widget is invisible on load; press Ctrl+Shift+E to reveal it -->
  <lib-e2e-recorder start-hidden></lib-e2e-recorder>
}
```

> The included **example project** (`ejemplo/`) uses `start-hidden` so the floating button does not interfere with the app UI during development. Remove the attribute if you prefer the widget to be visible immediately.
>
> The `start-hidden` attribute **overrides** the value stored in the settings panel. See [Start hidden](#start-hidden-invisible-mode) for the full precedence rules.

**4. Control it programmatically** (optional):

```typescript
import type { LibE2eRecorderElement } from 'lib-e2e-cypress-for-dummys-ts';

const recorder = document.querySelector('lib-e2e-recorder') as LibE2eRecorderElement;

// Start / stop recording
recorder.toggle();

// Set the language explicitly
recorder.setLanguage('en');
```

---

## Features

### Recording interactions

The recorder automatically captures:

| Interaction | Generated Cypress command |
|---|---|
| Click on a button or element | `cy.get('[data-cy="submit"]').click()` |
| Double-click | `cy.get('[data-cy="row"]').dblclick()` |
| Right-click | `cy.get('[data-cy="ctx"]').rightclick()` |
| Check / uncheck a checkbox | `cy.get('[data-cy="agree"]').check()` / `.uncheck()` |
| Pick a radio | `cy.get('[data-cy="plan"]').check()` |
| Type into a text field | `cy.get('[data-cy="email"]').clear().type('user@example.com')` |
| Press Enter / Escape in a field | `cy.get('[data-cy="q"]').type('{enter}')` / `type('{esc}')` |
| Select a `<select>` value | `cy.get('[data-cy="country"]').select('ES')` |
| SPA route change (push/replace/popstate) | `cy.url().should('include', '/dashboard')` |
| Page load | `cy.visit('/current-path')` |

Input events are **debounced by 1 second** so only the final value is captured, not every keystroke.

#### Capturing assertions while recording — Alt+click

A test that only clicks around but never checks anything is weak. While recording,
hold **Alt** and click any element to record a **Cypress assertion** for it instead
of a click — and the element's real action is **suppressed** (no navigation, no form
submit), so asserting never changes your flow.

The assertion is chosen automatically from the element:

| Element | Generated assertion |
|---|---|
| Checkbox / radio | `.should('be.checked')` / `.should('not.be.checked')` |
| Input / textarea / select with a value | `.should('have.value', '<value>')` |
| Element with visible text | `.should('contain.text', '<text>')` |
| Anything else | `.should('be.visible')` |

The captured assertion appears in the **⌨️ Commands** previewer like any other
command, so you can reorder or delete it. (You can still build assertions manually
with the assertion builder — see below.)

---

### HTTP monitoring

Every `fetch` and `XMLHttpRequest` call made while recording is captured automatically.

For **GET, POST and PUT** requests the recorder generates a pair of commands:

```javascript
// Interceptor (placed at the top of the test, in beforeEach)
cy.intercept('GET', '**/api/users').as('get-api-users')

// Wait command (placed inline with the test actions)
cy.wait('@get-api-users').then((interception) => { })
```

**DELETE** requests are intentionally ignored (read-only guard).

#### Advanced HTTP mode

Enable **Validaciones de body** in the settings panel to get auto-generated body assertions:

```javascript
// GET — validates response body fields
cy.wait('@get-api-users').then((interception) => {
  if (interception.response) {
    expect(interception.response.body.name).to.equal("Alice");
    expect(interception.response.body.role).to.equal("admin");
  }
})

// POST / PUT — validates request body fields
cy.wait('@post-api-users').then((interception) => {
  expect(interception.request.body.name).to.equal("Alice");
})
```

Fields named `id` or `uid` are always skipped (they change between environments). Array responses fall back to the default empty `.then()` block.

#### Fixture mode (deterministic stubs)

Enable **🧪 Fixtures HTTP** in the settings panel to turn GET responses into
**Cypress fixtures + stubs** instead of spies. While recording, each GET with a
JSON body is saved as `cypress/fixtures/<alias>.json` and its interceptor becomes:

```javascript
cy.intercept('GET', '**/api/users', { fixture: 'get-api-users.json' }).as('get-api-users')
cy.wait('@get-api-users').then((interception) => { })
```

so the test replays deterministic data with **no backend**. When you save the
test, the fixture files are written into your `cypress/fixtures/` folder
automatically (requires the Cypress folder configured — see the advanced editor
setup). POST/PUT keep the spy + body-validation behaviour; non-JSON GETs fall back
to a spy.

---

### Selector strategy

The recorder needs to choose an attribute to generate `cy.get()` selectors. Four strategies are available:

| Strategy | Generated selector |
|---|---|
| `data-cy` (default) | `[data-cy="login-btn"]` |
| `data-testid` | `[data-testid="login-btn"]` |
| `aria-label` | `[aria-label="Login"]` |
| `id` | `#login-btn` |

Change the strategy at any time in **⚙️ Config → Estrategia de selector**. The recorder always falls back through the chain (`data-cy` → `id`, etc.) if the preferred attribute is missing on the target element.

Forbidden id prefixes (`cdk-`, `mat-`, `ng-`, `mdc-`, `p-`, and others) are automatically excluded to avoid Angular Material / PrimeNG generated ids.

---

### Smart selector picker

When the recorder cannot generate a reliable selector for a clicked element (no `data-cy`, `data-testid`, `aria-label`, or clean `id`), the **Smart Selector Picker** appears as an overlay.

The picker walks the DOM ancestor chain of the clicked element (up to 10 levels) and colour-codes each ancestor by selector quality:

| Badge | Quality | Criteria |
|---|---|---|
| 🟢 Excellent | Best | Has `data-cy`, `data-testid`, or `aria-label` |
| 🔵 Good | Reliable | Has a valid `id` (no framework-generated prefix) |
| 🟡 Acceptable | Fragile | Has CSS classes — no testing attribute |
| 🔴 Not recommended | Avoid | Only tag name or inline `style` |

**How to use:**
1. The picker auto-selects the best available ancestor
2. Use **↑ / ↓** to navigate the ancestor list
3. Press **Enter** (or click a row) to record `cy.get('<selector>').click()`
4. Press **Escape** or click outside to dismiss without recording

The picker also closes automatically when recording is stopped or paused.

**Toggle in settings:** ⚙️ Config → Smart selector. When disabled, unresolvable clicks are silently dropped (the previous behaviour).

---

### Saving and managing tests

When recording stops, a dialog prompts you to:

- Give the test a **description** (becomes the `it('…')` label)
- Optionally add **tags** for filtering later (e.g. `smoke`, `login`, `regression`)
- Choose **Save** (keeps it in IndexedDB) or **Save and edit** (opens the advanced editor immediately)

The **📋 Tests** panel lets you:

- Browse all saved tests filtered by tag
- Expand a test to see its commands and interceptors
- Copy the full `describe()` block to the clipboard with a custom suite name
- Copy just the commands or just the interceptors separately
- Multi-select tests and generate a combined `describe()` block
- Delete individual tests

---

### Command previewer

The **⌨️ Commands** panel shows the commands captured in the current (unsaved) recording in real time. While the panel is open you can:

- Reorder commands with the up/down arrows
- Delete individual commands
- Add a custom assertion with the **assertion builder**

#### Assertion builder

The assertion builder at the bottom of the command panel lets you add `cy.get().should()` commands without typing:

1. Enter the CSS selector (e.g. `[data-cy="error-msg"]`)
2. Choose the assertion type from the dropdown:
   - `be.visible`, `not.exist`, `be.disabled`, `be.checked` — no value required
   - `contain.text`, `have.value`, `have.length`, `have.class`, `have.attr` — enter the expected value
3. Click **➕ Añadir**

---

### Advanced editor (direct file insertion)

The **📁 Files** panel uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) to browse your local Cypress folder and insert tests directly into `.cy.ts` files — no copy-paste needed.

**Setup (one time):**

1. Open **⚙️ Config → Carpeta Cypress**
2. Click **📁 Seleccionar carpeta** and pick the folder that contains the `cypress/` directory
3. The browser stores the permission — you won't be asked again

**Expected folder structure:**

```
cypress/          ← select this folder
└── e2e/          ← the recorder reads .cy.ts files from here
    └── login.cy.ts
```

**Using the editor:**

1. Open **📁 Files** → select a `.cy.ts` file from the tree
2. The `it()` block for the selected test appears in the panel
3. Click **💾 Insertar en archivo** — the block is appended inside the last `})` of the describe
4. Interceptors are automatically wrapped in a `beforeEach()`
5. Alternatively, click **✏️ Editar manualmente** to open a full diff editor with save support
   - Inside the manual editor, click **🪄 Insertar bloques** to auto-merge the `it()` and `beforeEach()` blocks into the editor content (same placement as the automatic insert), then review the diff before saving — no copy/paste needed. The 📋 copy buttons remain available if you prefer to paste manually.

**Sidebar toolbar:**

| Button | Action |
|---|---|
| **+ Nuevo archivo** | Creates a new `.cy.ts` file with a basic `describe/it` scaffold in `cypress/e2e/`. Type the name (no extension needed) and press Enter or click **Crear**. |
| **+ Nueva carpeta** | Creates a new folder in `cypress/e2e/`. Type the name and press Enter or click **Crear**. Path separators are stripped from the name. |
| **↻ Actualizar** | Rescans the `cypress/e2e/` directory. Useful after a `git pull`, a drag-and-drop into the folder, or any external file change. |

> The File System Access API is supported in Chromium-based browsers (Chrome, Edge, Opera). Firefox and Safari do not support it.

---

### Running a spec from the editor (local runner)

Inside the manual editor (**✏️ Editar manualmente**) the **▶ Lanzar test** button runs
**only the spec you are editing**, headless (no Cypress GUI), and shows the result
(pass/fail + output) right in the editor — for a fast record → tweak → run loop.

The browser can't spawn Cypress, so it talks to a tiny **local runner** over HTTP.
Start it once in your Cypress project:

```bash
npx lib-e2e-cypress-runner            # listens on http://127.0.0.1:8123
```

Options:

| Flag | Default | Description |
|---|---|---|
| `--port` | `8123` | Port to listen on. |
| `--command` | `npx cypress run --spec {spec}` | Command to run. `{spec}` is replaced by the spec (passed as a single argv, never through a shell). |
| `--cwd` | current dir | Working directory the command runs in. |
| `--host` | `127.0.0.1` | Bind address (local only). |
| `--allow-origin` | `http://localhost` | Allowed CORS origin. Any `http://localhost:*` / `http://127.0.0.1:*` origin is always allowed regardless of this flag. Use this only when your app runs on a custom domain or a non-localhost IP. |

The allowed origin can also be set via the `RUNNER_ALLOW_ORIGIN` environment variable (CLI flag takes precedence):

```bash
# Default — app on localhost (any port)
npx lib-e2e-cypress-runner

# App on a custom domain or shared dev IP
npx lib-e2e-cypress-runner --allow-origin=http://myapp.test
npx lib-e2e-cypress-runner --allow-origin=http://192.168.1.10:3000

# Via env-var (useful for Docker / CI scripts)
RUNNER_ALLOW_ORIGIN=http://myapp.test npx lib-e2e-cypress-runner
```

The widget POSTs `{ specPath }` to `http://localhost:8123/run-test`; configure a
different endpoint via the `runnerUrl` property of `<file-preview>` if needed.

Notes:
- The button is **enabled only when the app is served from localhost**. On a deployed
  environment it is disabled with a *"muévelo a local para poder probar"* hint —
  running a local Cypress against a remote build makes no sense.
- If no runner is reachable you get a clear "no runner detected" message (no silent
  failure).
- The runner is a **dev-only** tool: it binds to `127.0.0.1` and passes the spec as an
  argument (no shell interpolation). Don't expose it beyond your machine.

---

### Recording history

The last **5 recordings** are automatically saved to `localStorage` so you never lose work if you accidentally close the dialog without saving. Use `recorder.recoverLastRecording()` to restore the most recent recording programmatically.

---

### Cross-app recording (single-spa / Module Federation)

Recording a flow that spans **several micro-frontends** under one domain (login app → dashboard app → admin app) used to be impossible: navigating from one project to another tore the widget down and wiped the in-progress recording. Now the **live recording session is persisted** (in IndexedDB, same origin), so it **survives the crossing** and recording continues seamlessly — the captured commands and interceptors are all still there.

It also survives an accidental **page reload** of the same origin: the recording is recovered automatically.

> **Scope:** this covers micro-frontends served from the **same origin** (same scheme + host + port, the typical single-spa setup) with **client-side** navigation. Different origins/subdomains and cross-origin `cy.origin` test generation are out of scope (see `docs/specs/006-cross-app-recording-continuity.md`).

#### Where to mount the widget

Pick **exactly one** placement — never both, or the HTTP monitor installs twice and commands get double-recorded:

- **Option A — a single instance in the shell (recommended).** Mount one `<lib-e2e-recorder>` in the shell/root application. The shell is not unmounted on app swaps, so a recording naturally spans every micro-frontend. Simplest and most robust.
- **Option B — one instance per sub-project, never in the shell.** Each micro-frontend mounts its own widget; continuity across crossings is provided by the persisted session. Do **not** also put one in the shell. *Caveat:* during a single-spa transition two apps can be briefly mounted at once, so an API call fired in that window may produce a duplicate `cy.wait` — just delete the stray line, or prefer Option A.

#### Resuming

When the recorder loads and finds an active recording session:

- **Recent** (within the resume window) → it **continues silently**.
- **Stale** (older than the window) → it asks **continue or discard**, so a forgotten session never resumes silently (important when deployed with `start-hidden`).

The resume window defaults to **30 minutes** and is editable in **⚙️ Config → ⏱ Recording continuity**. Crossing apps is instant, so it is always "recent"; the window only gates the come-back-later case.

Stopping a recording (save **or** discard) ends the session, so a finished recording never resurrects on the next navigation.

---

### Moving the widget (draggable)

If the floating widget covers a control you need, **drag the record button (⏺/⏹)**
to move the whole widget anywhere on screen. Press-and-move to drag; a plain click
still starts/stops recording (a ~5 px threshold tells the two apart).

The radial menu **expands toward the centre of the screen**, so the action buttons
stay fully visible wherever you drop it, and the position is **remembered** across
reloads (and app crossings). Reset it to the default corner from **⚙️ Config →
🧲 Widget position → Reset position**, or programmatically:

```typescript
recorder.resetWidgetPosition();
```

---

### In-app help panel

Not sure what the widget can do? Click the **?** button in the widget (or press
**Ctrl+Shift+H**) to open a categorised cheat-sheet — shortcuts, what gets
recorded, assertions, the panels, selectors, HTTP, data, and the advanced
features — in your language (es/en/fr/it/de).

---

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Shift + E` | **Show / hide the widget** (works even when it is invisible) |
| `Ctrl + R` | Start / stop recording |
| `Ctrl + P` | Pause / resume recording |
| `Ctrl + 1` | Open saved tests panel |
| `Ctrl + 2` | Open command previewer |
| `Ctrl + 3` | Open settings |
| `Ctrl + Shift + H` | Open the in-app **help panel** |
| `Alt + click` | Capture an assertion for the clicked element |

> `Ctrl + R` / `Ctrl + P` and the panel shortcuts only fire when the widget is **visible**. `Ctrl + Shift + E` always works regardless of visibility state.

---

### Invisible mode — record in production, stay hidden from users

Most test recorders force you to choose: use them in a safe dev environment, or ship to real users and lose the tool. **Not this one.**

With `start-hidden`, you can deploy the recorder to **any environment — including production** — and it stays completely invisible to your users. No floating button, no visual clutter, no accidental clicks. When *you* need to record a test against the real app, with real data, real API responses, and real edge cases that are impossible to reproduce locally, just press the secret shortcut and the widget appears. Record, save, hide. Nobody saw a thing.

```
Ctrl + Shift + E   →   show / hide the widget (works even when invisible)
```

This means you can:
- **Record against production data** — capture flows that only happen with real users and real back-ends.
- **Debug flaky tests in the wild** — reproduce the exact sequence of events that broke your CI pipeline.
- **Onboard QA teams without a local setup** — testers open the live app, hit the shortcut, and record directly.
- **Keep staging clean** — no visible dev tooling leaked to clients or stakeholders reviewing the environment.

#### Option A — HTML attribute (deploy-time, recommended)

Add `start-hidden` to the element. This takes **precedence over the settings panel** and is the right choice for environment-level control:

```html
<!-- Production / staging: invisible by default -->
<lib-e2e-recorder start-hidden></lib-e2e-recorder>

<!-- Dev: always visible (or omit the attribute entirely) -->
<lib-e2e-recorder start-hidden="false"></lib-e2e-recorder>
```

Works in every framework:

```html
<!-- Angular -->
<lib-e2e-recorder start-hidden></lib-e2e-recorder>

<!-- React (JSX) -->
<lib-e2e-recorder start-hidden="true" />

<!-- Vue -->
<lib-e2e-recorder start-hidden />
```

A typical Angular setup driven by an environment variable:

```typescript
// app.component.ts
get startHidden(): boolean {
  return environment.production; // invisible in prod, visible in dev
}
```

```html
<!-- app.component.html -->
<lib-e2e-recorder [attr.start-hidden]="startHidden ? '' : null"></lib-e2e-recorder>
```

#### Option B — Settings panel (runtime, per user)

Enable **⚙️ Config → 👁 Widget visibility → Start hidden**. The preference is stored in IndexedDB and persists across sessions. Useful when individual team members want to tailor the behaviour without a redeployment.

---

**Either way, when the widget is hidden:**
- Zero DOM rendered, zero event listeners added beyond the keyboard shortcut — it is truly invisible and inert.
- Your Cypress selectors are never blocked by a floating element.
- Press **`Ctrl + Shift + E`** to reveal it instantly, no page reload needed.
- Hide it again with the same shortcut when you are done.

> **Running under Cypress?** The widget auto-disables itself when `window.Cypress` is detected — it does not render at all, regardless of the `start-hidden` attribute or the settings panel value. No extra setup, no `beforeEach` cleanup, no risk of the widget covering a selector mid-test.

---

### Import / Export

Back up tests to a JSON file or restore from a previous backup via **⚙️ Config → Datos**:

- **⬆️ Export tests** — opens a dialog to choose **what** to export, then downloads `e2e-cypress-export.json`:
  - **Todo** — every saved test.
  - **Selección manual** — tick individual tests (multiple allowed); only the checked ones are exported.
  - **Por tags** — pick one or more tags; exports every test carrying **at least one** of them (OR). The dialog lists the matching tests so you can see exactly what will be exported before confirming.

  A live count shows how many tests the current selection will export, and the export button is disabled when that count is `0`.
- **⬇️ Import tests** — uploads a JSON file and **merges** its tests into the current database (existing tests are kept, never wiped).

The output format and filename are identical in every mode, so any exported file (full or partial) can be re-imported.

JSON format:

```json
{
  "tests": [ { "name": "Login correcto", "createdAt": 1234567890 } ],
  "interceptors": []
}
```

---

### Internationalisation

The interface auto-detects the browser language. Supported languages:

| Code | Language |
|---|---|
| `es` | Spanish (default fallback) |
| `en` | English |
| `fr` | French |
| `it` | Italian |
| `de` | German |

Override the language programmatically:

```typescript
recorder.setLanguage('en'); // accepts: 'es' | 'en' | 'fr' | 'it' | 'de'
```

---

## Public API

### `<lib-e2e-recorder>` element

```typescript
class LibE2eRecorderElement extends HTMLElement {
  // Injected services (auto-created if not set)
  recording: RecordingService;
  persistence: PersistenceService;
  translation: TranslationService;

  // State (read-only in normal use)
  isRecording: boolean;
  isPaused: boolean;
  cypressCommands: string[];
  interceptors: string[];

  // Dialog flags
  isCommandsDialogOpen: boolean;
  isSavedTestsDialogOpen: boolean;
  isSaveTestDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isAdvancedEditorDialogOpen: boolean;

  // Methods
  toggle(): void;                         // start / stop recording
  togglePause(): void;                    // pause / resume
  setLanguage(lang?: string): void;       // set UI language

  showCommandsDialog(): void;
  showSavedTestsDialog(): void;
  showSaveTestDialog(): void;
  showSettingsDialog(): void;
  showAdvancedEditorDialog(testId?: number): void;

  getRecordingHistory(): Array<{ commands: string[]; interceptors: string[]; savedAt: number }>;
  recoverLastRecording(): void;
  clearRecordingHistory(): void;

  // Cross-app session (micro-frontends)
  hasActiveSession(): boolean;            // is a recording session persisted/active?
  resumeSession(): void;                  // rehydrate the persisted session
  discardSession(): void;                 // drop the persisted session

  // Draggable widget
  resetWidgetPosition(): void;            // move the widget back to its default corner
}
```

### `RecordingService`

```typescript
class RecordingService {
  selectorStrategy: 'data-cy' | 'data-testid' | 'aria-label' | 'id';

  startRecording(): void;
  stopRecording(): void;
  pauseRecording(): void;
  resumeRecording(): void;
  toggleRecording(): void;
  togglePause(): void;

  addCommand(cmd: string): void;          // respects recording/paused state
  appendCommand(cmd: string): void;       // always appends (for manual assertions)
  removeCommand(index: number): void;
  moveCommand(from: number, to: number): void;

  registerInterceptor(method: string, url: string, alias: string): void;
  removeInterceptor(index: number): void;

  clearCommands(): void;

  // Cross-app session (micro-frontends) — see spec 006
  sessionId: string | null;
  restoreSession(state: ActiveSessionState): void;   // rehydrate WITHOUT re-running the bootstrap
  getSessionSnapshot(): ActiveSessionState;
  onSessionChange(fn: (state: ActiveSessionState) => void): () => void;

  getCommandsSnapshot(): string[];
  getInterceptorsSnapshot(): string[];

  onCommandsChange(fn: (cmds: string[]) => void): () => void;
  onInterceptorsChange(fn: (ints: string[]) => void): () => void;
  onRecordingChange(fn: (isRecording: boolean) => void): () => void;
  onPauseChange(fn: (isPaused: boolean) => void): () => void;

  destroy(): void;
}
```

### `PersistenceService`

```typescript
class PersistenceService {
  insertTest(name: string, commands?: string[], interceptors?: string[], tags?: string[]): Promise<number>;
  getAllTests(): Promise<TestWithDetails[]>;
  getTestById(testId: number): Promise<TestDetail | null>;
  deleteTest(id: number): Promise<void>;

  setConfig(config: Record<string, unknown>): Promise<void>;
  setConfigKey(key: string, value: unknown): Promise<void>;
  getConfig(key: string): Promise<Record<string, unknown> | null>;
  getGeneralConfig(): Promise<ConfigRecord | null>;

  // Live recording session (cross-app continuity — see spec 006)
  saveActiveSession(state: ActiveSessionState): Promise<void>;
  getActiveSession(): Promise<ActiveSessionState | null>;
  clearActiveSession(): Promise<void>;

  clearAllData(): Promise<void>;
  requestDirectoryPermissions(): Promise<void>;
}
```

---

## Breaking changes

### v0.9.0

- **`Subject` removed from public exports.** `Subject<T>` (`src/utils/subject.ts`) is an internal reactive primitive used by the library's services. It was accidentally re-exported from the package root. If your code imports it as `import { Subject } from 'lib-e2e-cypress-for-dummys-ts'`, copy the class into your own codebase or use a reactive library (RxJS, signals, etc.) instead.

---

## Technical notes

- **Storage:** IndexedDB via [`idb`](https://github.com/jakearchibald/idb). Data survives page reloads and browser restarts.
- **Modals:** [`SweetAlert2`](https://sweetalert2.github.io/) with a custom dark theme injected as a `<style>` tag.
- **Shadow DOM:** All components use `mode: 'open'` shadow roots, so widget styles never bleed into the host application.
- **Bundle:** ESM + CJS, compiled to ES2022. No framework runtime included.
- **Browser support:** Chromium 105+ for full feature set (File System Access API). Recording and saving work in all modern browsers.

---

## Development

```bash
npm install
npm run build          # compile with tsup
npm test               # run vitest unit tests
npm run test:coverage  # coverage report (≥80% gate)
npm run lint           # ESLint
```

See [`CLAUDE.md`](./CLAUDE.md) for the full development workflow (Spec-Driven Development, TDD, commit conventions).

---

## Licence

MIT
