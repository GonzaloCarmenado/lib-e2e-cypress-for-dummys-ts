# 004 — Merge on Import

> **Status:** Done ✅
> **Date:** 2026-06-19
> **Author:** Gonzalo

---

## Context and motivation

`ConfigurationElement.importAllData()` currently does:

```ts
await this.persistence.clearAllData();              // wipes every saved test
await this.persistence.ingestFileData(data.tests, data.interceptors);
```

So importing a backup **destroys all existing tests** before loading the file.
This became a real hazard once export gained selection modes (spec 003): a user
can export a *partial* set (a few tests, or one tag) and, on importing it
elsewhere, silently lose every other test already in that database.

This spec changes import to **merge**: imported tests are appended to whatever is
already stored. Nothing is cleared. Combined with the round-trip fix (commit
`1a3eee7`), each imported test keeps its commands, interceptors, tags and notes.

---

## Use cases

1. **UC-01 — Add a shared subset without losing my work**
   As a QA engineer, I want to import a colleague's exported tests and have them
   added to my existing suite so that I do not lose the tests I already had.

2. **UC-02 — Combine several exports**
   As a QA engineer, I want to import multiple backup files in sequence and end
   up with the union of all of them.

3. **UC-03 — Imported tests are complete**
   As a QA engineer, I want each imported test to arrive with its commands,
   interceptors, tags and notes intact.

---

## Acceptance criteria

- [x] AC-01: `importAllData` no longer calls `clearAllData()`.
- [x] AC-02: Tests already present before an import are still present afterwards.
- [x] AC-03: After import, the store contains the union of the prior tests and
      the imported tests.
- [x] AC-04: Each imported test keeps its commands/interceptors/tags/notes
      (round-trip, already covered by `ingestFileData`).
- [x] AC-05: Invalid JSON and wrong-shape files still throw (unchanged) and
      import nothing.
- [x] AC-06: Importing the same file twice appends it twice (no dedup) — this is
      acceptable and documented (see Q1).
- [x] AC-07: README reflects the merge behaviour (no longer "replaces").

---

## Public API changes

None. `importAllData(file: File): Promise<void>` keeps its signature; only its
internal behaviour changes (drops the `clearAllData()` call).

---

## Out of scope

- **Replace mode.** A "wipe then import" option (or a merge/replace chooser at
  import time) is not part of this spec. `clearAllData()` remains available as an
  API for callers that explicitly want it.
- **Deduplication / conflict resolution.** Imported tests are always appended as
  new records; matching by name/content and skipping or overwriting is future work.
- **Import selection** (choosing which tests from a file to import) — mirror of
  export selection, future.

---

## Implementation notes

- One-line behavioural change in `ConfigurationElement.importAllData`: remove the
  `await this.persistence.clearAllData()` call.
- `ingestFileData` already strips the original `id` and auto-assigns a fresh one,
  so appended tests never collide with existing keys.

---

## Open questions

- [x] Q1: Dedup on re-import? → **No — append always; dedup is out of scope.**
- [x] Q2: Keep a replace option? → **Not in this spec; `clearAllData()` stays as
      an API but the UI import is merge-only.**

---

## History

| Date       | Change                                                        |
|------------|---------------------------------------------------------------|
| 2026-06-19 | Initial draft + implementation (merge: drop clearAllData)     |
| 2026-07-08 | All AC verified against code and tests; status → Done ✅       |
