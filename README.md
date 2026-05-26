# lib-e2e-cypress-for-dummys

> A floating widget that records real browser interactions and generates ready-to-run **Cypress E2E test code** — no setup required, no Cypress knowledge needed.

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
  <lib-e2e-recorder></lib-e2e-recorder>
}
```

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
| Type into a text field | `cy.get('[data-cy="email"]').clear().type('user@example.com')` |
| Select a `<select>` value | `cy.get('[data-cy="country"]').select('ES')` |
| SPA route change (push/replace/popstate) | `cy.url().should('include', '/dashboard')` |
| Page load | `cy.visit('/current-path')` |

Input events are **debounced by 1 second** so only the final value is captured, not every keystroke.

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

**Sidebar toolbar:**

| Button | Action |
|---|---|
| **+ Nuevo archivo** | Creates a new `.cy.ts` file with a basic `describe/it` scaffold in `cypress/e2e/`. Type the name (no extension needed) and press Enter or click **Crear**. |
| **↻ Actualizar** | Rescans the `cypress/e2e/` directory. Useful after a `git pull`, a drag-and-drop into the folder, or any external file change. |

> The File System Access API is supported in Chromium-based browsers (Chrome, Edge, Opera). Firefox and Safari do not support it.

---

### Recording history

The last **5 recordings** are automatically saved to `localStorage` so you never lose work if you accidentally close the dialog without saving. Use `recorder.recoverLastRecording()` to restore the most recent recording programmatically.

---

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + R` | Start / stop recording |
| `Ctrl + P` | Pause / resume recording |
| `Ctrl + 1` | Open saved tests panel |
| `Ctrl + 2` | Open command previewer |
| `Ctrl + 3` | Open settings |

---

### Import / Export

Back up all tests to a JSON file or restore from a previous backup via **⚙️ Config → Datos**:

- **⬆️ Export tests** — downloads `e2e-cypress-export.json`
- **⬇️ Import tests** — uploads a JSON file and merges it into the current database

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

  clearAllData(): Promise<void>;
  requestDirectoryPermissions(): Promise<void>;
}
```

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
