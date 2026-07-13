# 018 — Recorder refactor: extract Swal scaffold and inline HTML/styles

> **Status:** Done
> **Date:** 2026-07-13
> **Author:** Gonzalo

---

## Context and motivation

`lib-e2e-recorder.ts` has grown to ~1050 lines. It contains 9 Swal dialogs, each
repeating the same `makeSwalDraggable + setSwal2DataCyAttribute + toggleModal +
willClose` scaffold, plus 7 instances of the `createElement → appendChild →
addEventListener` pattern for mounting Custom Elements inside Swal, plus two
identical 9-line blocks for resizing the popup geometry.

This makes the file hard to read, and adding a new dialog requires copying
boilerplate from a previous one — a source of bugs.

The goal is to extract the repeated patterns into focused helpers **without
changing any observable behaviour**. All existing tests must stay green.

---

## Use cases

1. **UC-01 — Developer adds a new dialog**
   Adding a new Swal dialog should require only declaring its unique options, not
   copy-pasting scaffold boilerplate.

2. **UC-02 — Developer reads the recorder**
   Each `show*Dialog()` method should fit on screen and communicate intent, not
   implementation detail.

---

## Acceptance criteria

### Phase 1 — LOW risk, zero behaviour change

- [x] AC-01: `ensurePopupDimensions(popup, heightPx)` added to `modal.utils.ts`. Both call sites replaced.
- [x] AC-02: `injectAssertionBuilder(container, t, onAddCommand)` extracted to `assertion-builder.ts`. Inline block in `showCommandsDialog` replaced.
- [x] AC-03: `mountFilesystemSetupContent(container, t, onSkip, onSelect)` extracted to `filesystem-setup.ts`. Inline block in `showFilesystemSetupDialog` replaced.

### Phase 2 — MEDIUM risk, main impact

- [x] AC-04: `mountComponentInSwal<T>` created in `src/utils/swal-mount.utils.ts`. All 7 call sites replaced.
- [x] AC-05: Preserves `as unknown as T` cast; optional events array handled with `?? []`.

### Phase 3 — Swal scaffold wrapper (decision gate)

- [x] AC-06: After Phase 2, measured: 5 methods shared ≥10 identical lines (`toggleModal`, `Swal.fire`, `color`, `makeSwalDraggable`, `setSwal2DataCyAttribute`, container lookup, `willClose` flag-reset, `resizePopup`). Extracted `openSwalDialog(flag, contentId, swalOptions, onMount, extra?)` private helper. Refactored `showCommandsDialog`, `showSavedTestsDialog`, `showSaveTestDialog`, `showSettingsDialog`, `showHelpDialog`. `showAdvancedEditorDialog` excluded — uses `makeModalResizable` with custom timeout instead of `resizePopup`.

### Quality gates (all phases)

- [x] AC-07: `npm run lint` — zero errors after each phase.
- [x] AC-08: `npm test` — 1040/1040 after each phase.
- [x] AC-09: `npm run build` — clean compile (ESM + CJS + DTS) after each phase.
- [x] AC-10: Line count 1053 → 936 (−117) after all 3 phases. Original target ≤ 800 was too aggressive given the irreducible unique logic in each dialog; ≤ 950 was the realistic minimum and was beaten.
- [x] AC-11: No new public API changes — all extracted helpers are internal.

---

## Public API changes

None. This is a pure internal refactor. No exported symbols change.

---

## Out of scope

- Extracting lifecycle hooks (`connectedCallback`, `disconnectedCallback`).
- Extracting `render()` or `toggleModal()`.
- Extracting session-continuity methods (`persistActiveSession`, `resumeSessionState`, etc.).
- Extracting widget-drag methods (`beginWidgetDrag`, `onWidgetPointerMove`, etc.).
- Converting the recorder to use a reactive framework.
- Adding new functionality.

---

## Implementation notes

### Extraction order rationale
Phase 1 first: each extract is a pure function with no state, easy to verify in isolation.
Phase 2 second: `mountComponentInSwal` is the highest-impact extract but requires
careful typing to preserve the cast pattern used throughout.
Phase 3 last: the scaffold wrapper may or may not be worth it — gate on measurement.

### Type safety in mountComponentInSwal
The existing pattern does `document.createElement(tagName) as unknown as XEl`.
The helper must preserve this by returning `T` and accepting `Partial<T>` for
props. The caller still declares the interface type; the helper just removes the
createElement + appendChild + addEventListener boilerplate.

### Files affected
- `src/components/lib-e2e-recorder/lib-e2e-recorder.ts` (shrinks)
- `src/utils/modal.utils.ts` (grows: `ensurePopupDimensions`)
- `src/utils/swal-mount.utils.ts` (new: `mountComponentInSwal`)
- `src/components/lib-e2e-recorder/assertion-builder.ts` (new)
- `src/components/lib-e2e-recorder/filesystem-setup.ts` (new)

---

## Open questions

- [x] Q1: Is the Swal scaffold wrapper (Phase 3) worth it? Gate on measurement after Phase 2.

---

## History

| Date       | Change          |
|------------|-----------------|
| 2026-07-13 | Initial draft   |
