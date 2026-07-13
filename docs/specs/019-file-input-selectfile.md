# 019 — Record file uploads as `.selectFile()`

> **Status:** In Progress
> **Date:** 2026-07-13
> **Author:** Gonzalo

---

## Context and motivation

When QA records a test that uploads a file via `<input type="file">`, the
recorder currently ignores the interaction — no command is generated.

The Cypress command for file uploads is `.selectFile(path)`. The path must
point to a real file inside the project (typically `cypress/fixtures/`) so
the test works in CI (Azure Pipelines, GitHub Actions, etc.).

This spec covers:
1. Detecting the `change` event on file inputs and generating `.selectFile()`.
2. Capturing the file contents in memory during recording (don't write to disk
   until the user explicitly saves).
3. At save time, either auto-copying the file(s) to `cypress/fixtures/` (when
   FSAA is configured and the user chose Save-and-Edit) or showing a toast
   reminding the user to add the file manually (IndexedDB save, or no FSAA).

---

## Use cases

1. **UC-01 — Single file upload**
   QA clicks an `<input type="file">`, selects `invoice.pdf`. The recorder
   generates `cy.get('SELECTOR').selectFile('cypress/fixtures/invoice.pdf')`.

2. **UC-02 — Multiple files upload**
   QA selects two files via a `<input type="file" multiple>`. The recorder
   generates `cy.get('SELECTOR').selectFile(['cypress/fixtures/f1.pdf', 'cypress/fixtures/f2.csv'])`.

3. **UC-03 — Save to IndexedDB**
   QA saves the recording to IndexedDB (plain save or save-and-edit without
   FSAA). A toast warns: *"Añade [invoice.pdf] a cypress/fixtures/ del
   proyecto antes de ejecutar el test"*. The command is saved as-is.

4. **UC-04 — Save-and-Edit with FSAA configured**
   QA saves via Save-and-Edit and the FSAA cypress folder is available. The
   recorder auto-copies the file(s) to `cypress/fixtures/` and shows a toast:
   *"invoice.pdf copiado a cypress/fixtures/"*. No manual action needed.

5. **UC-05 — Save-and-Edit without FSAA**
   FSAA is not configured. Fallback to UC-03 behaviour: toast warning, no
   auto-copy.

---

## Acceptance criteria

### Command generation

- [ ] AC-01: A `change` event on `input[type="file"]` with one file generates:
  `cy.get('SELECTOR').selectFile('cypress/fixtures/FILENAME')` using the
  existing smart-selector logic for `SELECTOR`.
- [ ] AC-02: A `change` event on `input[type="file"][multiple]` with N files
  generates: `cy.get('SELECTOR').selectFile(['cypress/fixtures/F1', ..., 'cypress/fixtures/FN'])`.
- [ ] AC-03: File inputs do NOT also generate a `cy.get('SELECTOR').click()`
  command — the `click` that opens the OS picker must be suppressed.
- [ ] AC-04: The file content (as `ArrayBuffer`) is stored in memory in
  `RecordingService` alongside the command, keyed by filename, so it is
  available at save time without re-reading the DOM.

### Save to IndexedDB (UC-03)

- [ ] AC-05: When `onSaveTest()` is called and the recording contains at least
  one `.selectFile()` command, `showToast` is called with a message listing
  the filenames and instructing the user to add them to `cypress/fixtures/`.
- [ ] AC-06: The toast fires for BOTH plain save and save-and-export when the
  destination is IndexedDB (i.e., no auto-copy attempted).

### Save-and-Edit with FSAA (UC-04)

- [ ] AC-07: When `onSaveAndExportTest()` is called, FSAA is available
  (`PersistenceService.hasDirectoryAccess()` returns true), and the recording
  contains `.selectFile()` commands, the file bytes are written to
  `cypress/fixtures/FILENAME` via `PersistenceService.writeUploadedFile()`.
- [ ] AC-08: On success, `showToast` confirms which files were written.
- [ ] AC-09: On failure (write error), `showToast` shows an error and falls
  back to the UC-03 warning toast.

### Save-and-Edit without FSAA (UC-05)

- [ ] AC-10: When FSAA is not configured, `onSaveAndExportTest()` falls back
  to the UC-03 warning toast — no auto-copy attempted.

### Quality gates

- [ ] AC-11: `npm run lint` — zero errors.
- [ ] AC-12: `npm test` — all tests pass (≥ 1040).
- [ ] AC-13: `npm run build` — clean compile (ESM + CJS + DTS).
- [ ] AC-14: Coverage ≥ 80% on all metrics after new tests are added.

---

## Public API changes

### `RecordingService`

```ts
// New method — stores file bytes captured at record time
addUploadedFile(filename: string, bytes: ArrayBuffer): void

// New method — returns files captured during this recording session
getUploadedFilesSnapshot(): Array<{ filename: string; bytes: ArrayBuffer }>

// New method — clears the uploaded files map (called alongside clearCommands)
clearUploadedFiles(): void
```

### `PersistenceService`

```ts
// New method — writes a binary file to cypress/fixtures/
// Returns false if FSAA is not configured
writeUploadedFile(filename: string, bytes: ArrayBuffer): Promise<void>

// New method (or reuse existing) — check if directory handle is available
hasDirectoryAccess(): boolean
```

---

## Out of scope

- Drag-and-drop file uploads (separate item in backlog).
- Recording `<input type="file">` inside Shadow DOM components (future).
- Showing a file picker inside the recorder for the user to pick a substitute
  file at record time.
- Validating that the file type matches the `accept` attribute.

---

## Implementation notes

### Why capture at `change`, not `click`

The `click` on a file input opens the OS picker — we have no access to the
selected file until the user confirms and the `change` event fires. Suppressing
the `click` command for file inputs is also done here to avoid a spurious
`cy.get('input').click()` before `.selectFile()`.

### In-memory capture pattern

`RecordingService` already holds `_uploadedFixtures` for HTTP fixtures.
Uploaded files follow the same pattern: `Map<filename, ArrayBuffer>` populated
at record time, flushed at save time, cleared by `clearCommands`.

### Path prefix

All generated paths use `cypress/fixtures/` as the prefix. If the user's
project has a non-standard fixtures folder, they can edit the generated code
manually — out of scope for v1.

### Toast copy (Spanish, i18n-ready)

- Warning (IndexedDB / no FSAA):
  `RECORDER.FILE_UPLOAD_MANUAL_TOAST` →
  *"Añade [FILENAMES] a cypress/fixtures/ antes de ejecutar el test."*
- Success (FSAA auto-copy):
  `RECORDER.FILE_UPLOAD_COPIED_TOAST` →
  *"[FILENAMES] copiado/s a cypress/fixtures/."*
- Error (write failed):
  `RECORDER.FILE_UPLOAD_COPY_ERROR_TOAST` →
  *"No se pudo copiar [FILENAMES] a cypress/fixtures/. Añádelo manualmente."*

### Files affected

- `src/services/recording.service.ts` — `addUploadedFile`, `getUploadedFilesSnapshot`, `clearUploadedFiles`
- `src/services/persistence.service.ts` — `writeUploadedFile`, `hasDirectoryAccess`
- `src/components/lib-e2e-recorder/lib-e2e-recorder.ts` — file-input `change` listener, save handlers updated
- `src/i18n/*.ts` — 3 new keys × 5 languages
- `specs/recording.service.spec.ts` — new tests for upload methods
- `specs/persistence.service.spec.ts` — new tests for `writeUploadedFile`
- `specs/components/lib-e2e-recorder.spec.ts` — new tests for file-input flow

---

## Open questions

- [x] Q1: Should we suppress the `click` command for file inputs entirely, or keep it?
  **Decision:** Suppress — `.selectFile()` replaces both the click and the
  change interaction. Keeping the click would produce `cy.get('input').click()`
  followed by `.selectFile(...)` which is wrong.

- [x] Q2: What if the same filename is uploaded twice in the same recording?
  **Decision:** Overwrite in the map (last write wins). The generated command
  uses the filename so both `.selectFile()` calls point to the same fixture.

- [x] Q3: IndexedDB save with FSAA configured — auto-copy or warning?
  **Decision:** Warning only. IndexedDB users export the test as a file later;
  they need the fixture file in the project at that point. Auto-copying on
  plain-save would be surprising since they haven't committed yet.

---

## History

| Date       | Change        |
|------------|---------------|
| 2026-07-13 | Initial draft |
