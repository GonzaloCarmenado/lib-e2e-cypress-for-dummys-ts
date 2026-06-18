# 003 — Export Test Selection

> **Status:** In Progress
> **Date:** 2026-06-18
> **Author:** Gonzalo

---

## Context and motivation

Today the only way to export tests is the **"⬆️ Exportar tests"** button in the
configuration panel (`ConfigurationElement.exportAllData()`). It is all-or-nothing:
it calls `persistence.getAllTests()` and downloads **every** saved test as
`e2e-cypress-export.json` (shape `{ tests, interceptors: [] }`).

This is too coarse. As the number of saved tests grows, users want to export a
focused subset — for example, to share only the login suite with a teammate, or
to move tests tagged `smoke` between machines, without dragging along everything
else.

This spec introduces a **selection step** when exporting: clicking "Exportar
tests" no longer downloads immediately. Instead it offers three selection modes:

1. **Todo** — every saved test (the current behaviour, now an explicit choice).
2. **Selección manual** — pick individual tests via checkboxes; multiple allowed.
3. **Por tags** — pick one or more tags; export the tests carrying them.

The export **output format and filename stay identical** (`e2e-cypress-export.json`,
`{ tests, interceptors: [] }`), so files remain importable by the existing
`importAllData` flow. Only *which* tests are written changes.

---

## Use cases

1. **UC-01 — Export everything**
   As a tester, I want to export all my saved tests in one click so that I can
   take a full backup, exactly as today.

2. **UC-02 — Export a hand-picked set**
   As a tester, I want to tick several specific tests and export only those so
   that I can share a focused subset with a teammate.

3. **UC-03 — Export by tag**
   As a tester, I want to choose one or more tags and export every test that
   carries any of them so that I can move a logical group (e.g. `smoke`,
   `login`) without selecting each test by hand.

4. **UC-04 — Know what will be exported**
   As a tester, I want to see how many tests the current selection will export
   before confirming so that I do not download an empty or unexpected file.

5. **UC-05 — Back out safely**
   As a tester, I want to cancel the selection without downloading anything so
   that opening the dialog has no side effects.

---

## Acceptance criteria

- [x] AC-01: Clicking **"⬆️ Exportar tests"** opens a selection dialog instead of
      downloading immediately.
- [x] AC-02: The dialog presents three mutually exclusive modes: **Todo**,
      **Selección manual**, **Por tags**.
- [x] AC-03: **Todo** mode exports every saved test (unchanged behaviour).
- [x] AC-04: **Selección manual** mode lists all saved tests with checkboxes;
      multiple tests can be checked; only checked tests are exported.
- [x] AC-05: **Por tags** mode lists every distinct tag; one or more can be
      selected; a test is included if it carries **at least one** selected tag
      (OR semantics).
- [x] AC-06: The exported file keeps the existing JSON shape
      `{ tests, interceptors: [] }` and the filename `e2e-cypress-export.json`.
- [x] AC-07: Each exported test record is emitted whole — `name`, `commands`,
      `interceptors`, `tags`, `notes`, `createdAt` — identical to today's export.
- [x] AC-08: The dialog shows a live count of how many tests the current
      selection will export.
- [x] AC-09: The confirm/export action is disabled when the current selection
      resolves to **0** tests.
- [x] AC-10: Cancelling or dismissing the dialog downloads nothing and mutates
      no state.
- [x] AC-11: The test-filtering logic is a **pure, unit-tested function**
      (`selectTestsForExport(tests, mode, { ids, tags })`) returning the subset.
- [x] AC-12: All 5 i18n files (`es`, `en`, `fr`, `it`, `de`) contain every new
      key; no key is missing from any language.
- [x] AC-13: When there are no saved tests, the export dialog shows an empty
      message and disables the export button rather than downloading.

---

## Public API changes

```typescript
// NEW — pure selection helper (location TBD: utils or a small service).
// Mode-driven filtering of the test list for export.
export type ExportMode = 'all' | 'manual' | 'tags';

export function selectTestsForExport(
  tests: TestWithDetails[],
  mode: ExportMode,
  opts?: { ids?: Set<number> | number[]; tags?: string[] },
): TestWithDetails[];

// ConfigurationElement
// exportAllData() is refactored: the button now opens the selection dialog.
// A new method performs the actual download from a resolved subset, e.g.:
exportTests(tests: TestWithDetails[]): void;   // builds blob + triggers download
openExportDialog(): void;                       // wires the selection UI
```

New i18n keys (illustrative — final names decided in implementation), e.g. under
a `CONFIG.EXPORT_*` group:

```
EXPORT_MODE_ALL, EXPORT_MODE_MANUAL, EXPORT_MODE_TAGS,
EXPORT_DIALOG_TITLE, EXPORT_COUNT, EXPORT_CONFIRM, EXPORT_CANCEL,
EXPORT_EMPTY   // "no tests to export"
```

> **Decided:** the "⬆️ Exportar tests" button opens a **modal/dialog** (consistent
> with the other recorder dialogs) presenting the three modes. The observable
> contract above (modes, output format, pure filter) is independent of the exact
> markup.

---

## Out of scope

- The **import** flow is unchanged. `importAllData` still clears all data and
  ingests the file wholesale; merge-on-import is not part of this spec (see Q2).
- Exporting tests as Cypress `.cy.ts` source files. This spec covers only the
  JSON backup export. (`generateDescribe` and the advanced editor remain as-is.)
- Selecting individual commands or interceptors within a test — a test is always
  exported whole.
- Searching/filtering the manual-selection list by name, notes, or date.
- AND semantics across multiple tags (only OR is in scope — see Q1).
- Changing the export filename or adding multiple export formats (CSV, etc.).

---

## Implementation notes

- **No DB/schema change.** Filtering happens in memory over the result of
  `persistence.getAllTests()`; `TestWithDetails` already carries `tags`.
- **Reuse existing patterns.** `test-editor` already implements multi-select
  (`selectMode` + `selectedIds`) and tag derivation (`allTags` getter) plus tag
  filtering (`visibleTests`). The export dialog should mirror these so the UX is
  consistent; the pure `selectTestsForExport` helper can be shared/tested
  independently of the DOM.
- **Keep import compatibility.** Do not change the JSON shape or filename, so any
  exported subset can still be re-imported by `importAllData`.
- **Empty-tag / empty-selection guards.** `manual` with no ids → empty;
  `tags` with no tags → empty; both should hit AC-09/AC-13 paths.

---

## Open questions

- [x] Q1: **Tag semantics** — when several tags are selected, export tests
      matching ANY vs ALL? → **Resolved: OR (any selected tag).**
- [ ] Q2: Should a partial export be importable **without wiping** the existing
      database (merge vs. replace)? Today import replaces everything; flagged
      because partial exports make accidental data loss more likely. _Deferred —
      tracked for a future spec; out of scope here._
- [x] Q3: UI surface — modal vs inline section? → **Resolved: a modal/dialog
      opened from the existing "⬆️ Exportar tests" button, consistent with the
      other recorder dialogs.**
- [x] Q4: Search box for the manual-selection list? → **Resolved: out of scope
      for v1; revisit if libraries grow large.**

---

## History

| Date       | Change                                                        |
|------------|---------------------------------------------------------------|
| 2026-06-18 | Initial draft                                                 |
| 2026-06-18 | Review: confirmed JSON-backup target; resolved Q1 (OR), Q3 (modal), Q4 (out of scope) |
| 2026-06-18 | Implemented: `selectTestsForExport` util + export dialog in `e2e-configuration`; status → In Progress |
