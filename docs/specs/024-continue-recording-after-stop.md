# 024 — Continue Recording After Stop

> **Status:** Implemented
> **Date:** 2026-10-08
> **Author:** Gonzalo

---

## Context and motivation

Today the recorder has two controls that sound similar but behave very
differently:

- **Pause** (`RecordingService.pauseRecording/resumeRecording`,
  `src/services/recording.service.ts:137-154`) only toggles the `isPaused$`
  flag. Captured commands are untouched; resuming is instant and already
  shipped.
- **Stop** (`stopRecording`, `recording.service.ts:116-119`) sets
  `isRecording$` to `false`. Crucially, it does **not** call
  `clearCommands()` — the in-memory buffer survives. `clearCommands()` only
  runs from `startRecording()` (new recording) or after an actual **Save** /
  **Save & Export** (`lib-e2e-recorder.ts:841`, `:893`).

The problem is what happens in the UI right after Stop
(`onRecordingChange(false)` in `lib-e2e-recorder.ts:227-238`):

1. `saveRecordingHistory()` archives the session into the `e2e-recording-history`
   localStorage key (last 5).
2. `clearSessionPersistence()` wipes the spec-006 cross-app `activeSession`
   record — correct per that spec's Q2 ("a stopped buffer is intentionally
   forgotten across navigation").
3. `showSaveTestDialog()` opens a **non-dismissable** SweetAlert
   (`allowOutsideClick:false`, `allowEscapeKey:false`, no close button) that
   only offers **Yes, save** / **No** (`save-test.ts`). Choosing "No" leads to
   a discard confirmation; confirming dispatches `savetest` with
   `description: null`, which makes `onSaveTest` return early
   (`lib-e2e-recorder.ts:827`) — **without clearing the buffer**.

Net effect: many users report hitting Stop by mistake, and the library gives
them no way back. The commands are technically still in memory, but the only
exit from the dialog is "save" or "discard-and-lose-the-UI-state"; starting a
new recording wipes them via `clearCommands()`. There is also a half-built,
unwired escape hatch, `recoverLastRecording()`
(`lib-e2e-recorder.ts:528-536`): it reads the last history entry and
re-appends its commands, but it **drops interceptors** (the loop body is
empty — see the comment on `lib-e2e-recorder.ts:534`), never flips
`isRecording` back to `true`, and is not called from any button today.

This spec closes both gaps: a same-instance "Continue recording" action
available the moment Stop was pressed, and a fixed, wired "Recover last
recording" action for when the dialog/widget is already gone (closed tab,
reload, or a discard that happened minutes ago).

---

## Use cases

1. **UC-01 — Undo an accidental Stop immediately**
   As a QA engineer who hit Stop by mistake, I want a **"Continue recording"**
   button right in the save dialog, so I can resume capturing with every
   command I already recorded still there, without re-doing the flow.

2. **UC-02 — Change my mind after choosing "discard"**
   As a QA engineer who went down the discard confirmation step, I want to be
   able to back out and continue recording instead of being forced to either
   confirm the discard or go back to "save?", so a two-click mistake doesn't
   cost me the recording.

3. **UC-03 — Resumed recording still has no duplicate bootstrap**
   As a QA engineer, when I continue recording I do **not** want a second
   `cy.viewport`/`cy.visit`/hide-widget bootstrap appended, so the generated
   test stays clean (same guarantee spec 006 already gives on cross-app
   resume).

4. **UC-04 — Resumed recording still protected by cross-app continuity**
   As a QA engineer working in a micro-frontend shell, after continuing a
   recording I want it to keep being persisted for spec-006 cross-app /
   reload continuity, exactly like a recording that was never stopped.

5. **UC-05 — Recover a recording after the dialog is gone**
   As a QA engineer who already dismissed the save dialog (discarded, or the
   tab was closed/reloaded) and only realizes afterwards that they needed
   that recording, I want a **"Recover last recording"** action, visible while
   idle, that restores the last archived session (commands **and**
   interceptors) and puts the widget back into recording mode, so I don't
   have to redo the whole flow from scratch.

---

## Acceptance criteria

- [x] AC-01: `RecordingService` exposes `continueRecording()`: re-enables
      `isRecording` (and clears `isPaused`) **without** calling
      `clearCommands()` and **without** re-emitting the `startRecording()`
      bootstrap commands. The existing `sessionId`/`startedAt` are preserved
      (it is the same logical session).
- [x] AC-02: The save-test dialog (`ask` step) gets a third action —
      "Continue recording" — alongside the existing Yes/No. Clicking it calls
      `continueRecording()` and closes the modal; the widget immediately
      reflects the recording state (toolbar, timer/indicator if present).
- [x] AC-03: The discard-confirmation step also offers a way back to
      "Continue recording" (not only "back" to the ask step), reachable in
      one click from wherever the user currently is in the dialog.
- [x] AC-04: Continuing a recording re-arms spec-006 persistence: because
      `continueRecording()` flips `isRecording$`, the existing
      `onSessionChange`/`persistActiveSession` wiring
      (`lib-e2e-recorder.ts:241`, `:362-374`) picks it back up automatically —
      no new persistence code path required, and this is covered by a test.
- [x] AC-05: `recoverLastRecording()` is fixed and wired to a real button
      (visible only while **not recording** and `getRecordingHistory()` is
      non-empty): it restores **both** commands and interceptors from the
      most recent history entry, sets `isRecording = true`, `isPaused =
      false`, and does **not** re-run the start bootstrap. Any commands
      currently in memory before the recovery are cleared first.
- [x] AC-06: The "Recover last recording" entry point shows at least how many
      commands and how long ago (`savedAt`) the archived session is, so the
      user can judge relevance before recovering.
- [x] AC-07: Recovering the same history entry twice is safe (idempotent):
      does not duplicate commands, does not crash on an empty/corrupted
      `e2e-recording-history` value.
- [x] AC-08: New user-visible strings ("Continue recording" button label,
      "Recover last recording" entry + its hint) exist in **all 5** i18n
      files (`es/en/fr/it/de`).
- [x] AC-09: Coverage stays **≥ 80%** on lines, functions, branches,
      statements; `continueRecording()`, the dialog wiring, and the fixed
      `recoverLastRecording()` are unit-tested (including the
      interceptors-are-preserved regression case).
- [x] AC-10: `README.md` documents the two new controls (Continue recording /
      Recover last recording) and how they differ from Pause/Resume.

---

## Public API changes

```typescript
// ── RecordingService ───────────────────────────────────────────────────────
// NEW — resume a just-stopped recording in place: re-enables isRecording
// without clearing commands/interceptors and without re-emitting the
// startRecording() bootstrap. No-op if already recording.
continueRecording(): void;

// ── LibE2eRecorderElement ──────────────────────────────────────────────────
// CHANGED — now restores interceptors too, resumes recording state, and
// clears any leftover in-memory commands first. Previously only appended
// commands and never flipped isRecording.
recoverLastRecording(): void;
```

```typescript
// ── save-test custom element ───────────────────────────────────────────────
// NEW event — dispatched when the user picks "Continue recording" from
// either the ask step or the discard-confirmation step.
dispatchEvent(new CustomEvent('continuerecording', { bubbles: true, composed: true }));
```

New i18n keys (illustrative): `RECORDER.CONTINUE_RECORDING_BTN`,
`RECORDER.RECOVER_LAST_RECORDING_BTN`, `RECORDER.RECOVER_LAST_RECORDING_HINT`
(command count + relative time).

---

## Out of scope

- **Cross-origin / cross-tab recovery.** Recovery reads the same
  `e2e-recording-history` localStorage key already scoped to spec 006's
  same-origin assumption; no new storage boundary is introduced.
- **History beyond the last entry.** The existing cap of 5 archived sessions
  in `e2e-recording-history` is unchanged; this spec only fixes/wires
  recovery of the **most recent** one (`existing[0]`), matching current
  behaviour. Picking an older entry from the list is a future spec if
  requested.
- **Changing Pause/Resume.** That mechanism is untouched; this spec only adds
  a path back from Stop, it does not change what Pause does.
- **Re-opening the save dialog's "ask" step automatically on recovery.** After
  "Recover last recording" or "Continue recording" the widget goes straight
  back into recording mode; the user triggers Stop again when ready, same as
  any other recording.

---

## Implementation notes

- `continueRecording()` can be as small as:
  ```typescript
  continueRecording(): void {
    if (this.isRecording$.getValue()) return;
    this.isPaused$.next(false);
    this.isRecording$.next(true);
  }
  ```
  Commands/interceptors are already correct in `commands$`/`interceptors$` —
  Stop never touched them — so no snapshot/restore is needed for this path.
- For the history-recovery path, reuse the existing `restoreSession(state:
  ActiveSessionState)` primitive (already used for spec-006 rehydration)
  instead of inventing a new restore mechanism: synthesize an
  `ActiveSessionState` from the history entry (`commands`, `interceptors`,
  fresh `sessionId`, `startedAt: savedAt`, current `selectorStrategy`,
  `isRecording: true`, `isPaused: false`) and call `restoreSession()`. This
  automatically avoids re-running the bootstrap (same guarantee as spec 006's
  AC-04) and keeps the two recovery paths consistent.
- `e2e-recording-history` entries currently only store `{ commands,
  interceptors, savedAt }` (`lib-e2e-recorder.ts:518-525`) — enough for this
  fix, no schema change needed there.
- Wiring the new `continuerecording` event follows the exact pattern already
  used for `savetest`/`saveandexport` in `showSaveTestDialog()`
  (`lib-e2e-recorder.ts:653-681`): a new handler entry that calls
  `this.recording.continueRecording()` then `Swal.close()`.
- Where to put the "Recover last recording" entry point: the idle/stopped
  toolbar state in `lib-e2e-recorder.template.ts`, guarded by `!isRecording &&
  getRecordingHistory().length > 0` — mirrors how other conditional toolbar
  affordances already work in that template.

---

## Open questions

- [x] Q1: **Resolved — dialog-only.** "Continue recording" lives only inside
      the save dialog (ask + confirm-discard steps, AC-02/AC-03). No separate
      quick-undo toast on Stop; avoids extra UI surface and any race with
      `showSaveTestDialog()`'s own render.
- [x] Q2: **Resolved — use the widget's current strategy.** Recovering
      history does **not** restore a per-entry `selectorStrategy`; it uses
      whatever `selectorStrategy` the widget is currently configured with. No
      schema change to `e2e-recording-history`.

---

## History

| Date       | Change         |
|------------|----------------|
| 2026-10-08 | Initial draft. |
| 2026-10-08 | Review: Q1 resolved (dialog-only, no toast); Q2 resolved (use widget's current selectorStrategy, no `e2e-recording-history` schema change). All open questions resolved. |
| 2026-10-08 | Implemented: `RecordingService.continueRecording()`; `continuerecording` event on `<lib-e2e-save-test>` wired in both the ask and confirm-discard steps; `recoverLastRecording()` fixed (restores interceptors, resumes recording, clears stale commands first, idempotent) and wired to a new "↺ Recover" action-menu item (count + elapsed time in its tooltip) shown only while idle with history available; i18n ×5; README updated. Gates green (lint 0, 1119+ tests, coverage 94.8%, build 0). Status → Implemented. |
