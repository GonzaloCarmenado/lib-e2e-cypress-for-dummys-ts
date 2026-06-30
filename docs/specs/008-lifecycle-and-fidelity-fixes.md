# 008 — Lifecycle & recording-fidelity fixes

> **Status:** Implemented
> **Date:** 2026-06-30
> **Author:** Gonzalo

---

## Context and motivation

A general code review (after shipping specs 006/007) surfaced four real defects.
This spec batches the fixes + the missing regression tests. No new features.

1. **Reconnect reuses a destroyed `RecordingService`.** `disconnectedCallback`
   calls `recording.destroy()` (aborts the `AbortController` and restores the
   patched `history` methods) but does not release the reference, and
   `connectedCallback` only creates a service `if (!this.recording)`. If the
   **same element instance** is disconnected and re-connected (a framework
   `@if`/`*ngIf` toggle, a DOM move, route reuse), the DOM listeners
   (click/input/select/route) are re-registered against an **already-aborted
   signal** and never fire again — the recorder silently stops capturing DOM
   interactions. This defeats the per-sub-project remount path that spec 006 is
   meant to support.

2. **`registerInterceptor` ignores `isRecording`.** It guards only on `isPaused`.
   Because `HttpMonitor` is installed on mount (regardless of recording state),
   any GET/POST/PUT the host app fires **before recording starts** (or after
   stop) appends a `cy.intercept(...)` to the buffer; `startRecording` never
   clears interceptors, so this pre-recording noise leaks into the saved test's
   `beforeEach` (orphan intercepts with no matching `cy.wait`).

3. **`suppressNextToggleClick` can get stuck.** Pointer move/up are tracked at
   `window` level, so a drag can end with the cursor off the toggle, where the
   browser fires no `click`. The suppression flag stays `true` and silently
   swallows the user's **next genuine** record/stop click.

4. **Assertion builder does not escape single quotes.** The manual assertion
   builder interpolates the typed selector/value straight into
   `cy.get('${sel}').should('${type}', '${val}')` with no escaping (everywhere
   else the codebase uses `escapeSingleQuotes`), so a value containing `'`
   produces broken generated test code.

---

## Use cases

1. **UC-01** — As a QA engineer using the widget in an app that mounts/unmounts it
   (e.g. behind `@if`), I want it to keep recording after a remount.
2. **UC-02** — As a QA engineer, I want only the HTTP calls made **while
   recording** to become interceptors, so my test has no orphan `cy.intercept`s.
3. **UC-03** — As a QA engineer, after dragging the widget I want my next click on
   the record button to work.
4. **UC-04** — As a QA engineer, I want a manual assertion with a quote in the
   selector/value to generate valid Cypress code.

---

## Acceptance criteria

- [x] AC-01: After `disconnectedCallback` → `connectedCallback` on the **same
      element**, the recorder captures DOM interactions again (fresh
      `RecordingService` + re-installed `HttpMonitor`), and any active session is
      rehydrated from IndexedDB. Implemented via a `_needsRecordingRebuild` flag
      (the reference is **not** nulled, so in-flight async stays safe).
- [x] AC-02: The final session flush on disconnect still runs **before** the
      service is torn down (no regression to spec 006 AC-05).
- [x] AC-03: `registerInterceptor` is a **no-op when not recording or paused**;
      an HTTP call before `startRecording` (or after `stopRecording`) adds no
      interceptor. While recording, behaviour is unchanged.
- [x] AC-04: After a drag whose pointer-up lands **off** the toggle, the next
      genuine click on the toggle **toggles recording** (the suppression flag is
      cleared on the next `pointerdown`).
- [x] AC-05: The assertion builder routes the selector and value through
      `escapeSingleQuotes`; a `'` in either yields `\'` in the generated command.
- [x] AC-06: New regression tests cover: same-element reconnect (capture resumes)
      + flush-on-disconnect, interceptor-only-while-recording, drag-off-button
      suppression reset, and assertion-builder escaping.
- [x] AC-07: Gates green — `npm run lint` (0 errors), `npm test` (806 pass),
      coverage **95.9%**, `npm run build` clean.

---

## Public API changes

None. Internal behaviour/lifecycle only.

---

## Out of scope

- The Medium maintainability items from the review (runner CORS/auth, the
  `extendedHttpCommands` dual source of truth, `alert()` → `showToast`, the big
  `lib-e2e-recorder.ts` dialog-scaffold refactor) — separate specs.
- Privacy/redaction of typed values & HTTP bodies (by design; future opt-in).
- The `history.pushState` "wrong original" hazard under **multiple simultaneous
  instances** — already a documented caveat (spec 007 Q4); not addressed here
  beyond what the reconnect fix incidentally helps.
- `recoverLastRecording` dropping interceptors (pre-existing, low; tracked
  separately).

---

## Implementation notes

- **Fix 1:** in `disconnectedCallback`, after `recording.destroy()`, set
  `this.recording = undefined` and `this.httpMonitor = undefined`;
  `connectedCallback` already recreates both (`if (!this.recording)` + always-new
  monitor) and `initSessionContinuity` rehydrates from IndexedDB. Keep the flush
  call ahead of teardown.
- **Fix 2:** add `if (!this.isRecording$.getValue() || this.isPaused$.getValue()) return;`
  at the top of `registerInterceptor` (mirrors `addCommand`). `restoreSession`
  sets `interceptors$` directly, so resume is unaffected.
- **Fix 3:** reset `this.suppressNextToggleClick = false` at the start of
  `beginWidgetDrag` (the pointerdown that always precedes the next click).
- **Fix 4:** `escapeSingleQuotes(sel)` / `escapeSingleQuotes(val)` before building
  the command (import from `utils/code-format.utils`). The assertion `type` comes
  from a fixed `<select>` and needs no escaping.

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-06-30 | Initial draft from the post-006/007 review: 4 fixes (reconnect lifecycle, interceptor recording-gate, sticky drag-click suppression, assertion-builder escaping) + regression tests. |
| 2026-06-30 | Implemented. Fix 1 done via `_needsRecordingRebuild` flag (not nulling the reference — avoids a race where a deferred save hit `undefined.clearCommands`). Gates green (lint 0, 806 tests, coverage 95.9%, build 0). Status → Implemented. |
