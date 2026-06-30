# 006 — Cross-App Recording Continuity (single-spa / module federation)

> **Status:** Implemented
> **Date:** 2026-06-30
> **Author:** Gonzalo

---

## Context and motivation

The recorder is a Custom Element (`<lib-e2e-recorder>`) that lives **inside the
host application's DOM** and keeps the in-progress recording **entirely in
memory** (`RecordingService` holds `commands$`, `interceptors$`, `isRecording$`,
`isPaused$` as `Subject<T>` — nothing is persisted until you stop).

This breaks in **micro-frontend architectures** (single-spa, Module Federation,
or any shell that mounts several projects under one domain). When the user
navigates from project A to project B, single-spa **unmounts** the micro-frontend
that hosts the widget; its DOM node is removed, so `disconnectedCallback` fires →
`recording.destroy()` + `httpMonitor.uninstall()` → **the buffer is wiped**.
Project B then mounts a **fresh, empty** widget.

Net effect: even though the widget is present in both projects, **crossing the
boundary loses the recording and all captured commands**. Many real E2E flows
span two or more projects (login app → dashboard app → admin app). Today the only
workaround is to stop recording in A, save, start again in B, and stitch the two
tests by hand — error-prone and tedious.

Confirmed constraints for this spec (product owner):

- **Same origin.** All projects are served from the exact same
  scheme+host+port (typical single-spa). `localStorage` and `IndexedDB` are
  therefore **already shared** across projects — no cookies, no backend, no
  iframe broker needed. The solution is 100% client-side.
- **Client-side navigation, no full reload.** Crossing projects is a single-spa
  app swap / `pushState`, so the **JS realm survives**.
- **Goal: don't lose the buffer.** Success = the captured commands/interceptors
  survive the crossing and recording continues seamlessly. Making the generated
  test *runnable across different origins* (`cy.origin` wrapping) is **not** a
  goal here (everything is same-origin anyway).
- **Resume policy:** auto-continue silently when the session is **recent**; show a
  *continue / discard* prompt when it is **stale** (avoids a forgotten
  "recording" session silently resuming days later, especially in production with
  `start-hidden`).

### Design approach — persistence, not a singleton

Continuity is achieved with a **persisted live session**, not with a global
in-memory singleton. The same mechanism covers both ways an integrator may place
the widget, and the choice between them is a **documentation matter** (see the
integration guidance) — the library does not try to deduplicate instances:

- **One instance in the shell** — the shell host is not unmounted on app swaps, so
  the widget stays mounted and the in-memory buffer survives natively. Persistence
  is then a safety net + hard-reload recovery.
- **One instance per sub-project (never in the shell)** — the widget is
  unmounted/remounted on every crossing; persistence is what **carries the buffer
  from A to B**: A flushes its state on `disconnectedCallback`, B rehydrates from
  `IndexedDB` on `connectedCallback`.

> The README must state this clearly so integrators pick exactly one placement and
> never mount the widget twice at once (which would double-install the HTTP
> monitor and double-record). This is handled by guidance, not by runtime
> deduplication.

A secondary, nearly-free benefit of persisting the live session: recording also
survives an accidental **hard reload** of the same origin, recovered from
`IndexedDB`.

---

## Use cases

1. **UC-01 — Keep recording across a project crossing**
   As a QA engineer recording a flow that starts in project A, I want to navigate
   into project B (same domain, single-spa) and have the recorder **stay in
   recording mode with every command I already captured still there**, so I can
   record one continuous multi-app test.

2. **UC-02 — Capture commands in the second project**
   As a QA engineer, after crossing into project B I want my clicks, inputs,
   selects, route changes and HTTP calls to keep being appended to the **same**
   command list, so the resulting test covers both projects.

3. **UC-03 — No bootstrap garbage on crossing**
   As a QA engineer, when I cross into project B I do **not** want a spurious
   `cy.viewport` / `cy.visit` / "hide widget" bootstrap re-injected, so the test
   stays clean and runnable.

4. **UC-04 — Survive an accidental reload**
   As a QA engineer who accidentally refreshes the page (same origin) mid-record,
   I want the recording to be **recovered automatically** so I don't lose work.

5. **UC-05 — Resume the right way**
   As a QA engineer, when an active recording is detected on load I want it to
   **continue silently if it's recent**, but be **asked to continue or discard**
   if it's old, so a forgotten session never resumes silently (important in
   `start-hidden` / production).

6. **UC-06 — Clean end of session**
   As a QA engineer, when I **stop and save** (or explicitly **discard**) the
   recording, I want the live cross-app session to be **cleared** so navigating
   afterwards does not resurrect a finished recording.

7. **UC-07 — Know where to mount the widget**
   As a developer integrating the widget into a micro-frontend, I want clear
   guidance (in the README) on placing **exactly one** instance — in the shell, or
   per sub-project but never in the shell — so I never end up double-recording.

---

## Acceptance criteria

- [x] AC-01: While `isRecording` is `true`, the live session (commands,
      interceptors, `isRecording`, `isPaused`, `selectorStrategy`, `sessionId`,
      `startedAt`, `updatedAt`) is **persisted incrementally** (debounced) to a
      dedicated `IndexedDB` store — not only on stop.
- [x] AC-02: A synchronous `localStorage` breadcrumb
      (`e2e-active-session` → `{ sessionId, isRecording, updatedAt }`) is written
      alongside, so an active session can be detected **synchronously** on mount
      without waiting for the async DB read (no UI flicker). The breadcrumb carries
      **no command payload** — the full session lives **only in `IndexedDB`**.
- [x] AC-03: On `connectedCallback`, if an active **recording** session exists, the
      widget **rehydrates** it (commands, interceptors, flags, strategy) and shows
      recording mode, staying visible if it was visible.
- [x] AC-04: Rehydration **must not** re-run the `startRecording()` bootstrap
      (`cy.viewport`, `cy.visit`, hide-widget). Those commands appear **once** per
      session, at the original start.
- [x] AC-05: On `disconnectedCallback`, while a recording is active the widget
      performs a **final flush** of the session to `IndexedDB` before its services
      are torn down, so the last commands captured in project A are not lost when
      it unmounts (per-sub-project placement).
- [x] AC-06: After crossing into project B, normal capture (click/input/select/
      route/HTTP) **appends** to the same command list; route changes still emit
      `cy.url().should('include', …)` for the new path.
- [x] AC-07: Resume gating by recency: if `now - updatedAt` is within the TTL →
      **resume silently**; if older → show a **continue / discard** prompt. The TTL
      **defaults to 30 minutes**, read from configuration at mount time.
- [x] AC-08: The recency TTL is **editable in the settings panel** (a numeric
      "minutes" field), persisted in the `configuration` store
      (`resumeRecencyTtlMinutes`); its label/hint exist in **all 5** i18n files.
- [x] AC-09: When stale, choosing **discard** clears the live session (DB record +
      breadcrumb) and starts clean; choosing **continue** rehydrates it.
- [x] AC-10: **Stopping the recording** (whether the user then saves, discards, or
      just dismisses the save dialog) **clears the live session** (DB record +
      `localStorage` breadcrumb). A **non-recording** buffer is **never resumed**
      across navigation — only an actively-recording session is persisted/resumed.
- [x] AC-11: The `window.Cypress` guard still wins: under Cypress nothing is
      created and no session persistence happens.
- [x] AC-12: New user-visible strings (resume prompt, "recording in progress",
      command count, continue, discard) exist in **all 5** i18n files.
- [x] AC-13: `IndexedDB` schema version is bumped and **upgrades cleanly** from the
      previous version without losing saved tests/config.
- [x] AC-14: The **README documents micro-frontend integration**: place exactly one
      widget (shell-single vs per-sub-project, never both), why, and how
      continuity works. This is the chosen mitigation for the double-instance /
      double-`HttpMonitor` concern (guidance, not runtime dedup).
- [x] AC-15: Coverage stays **≥ 80%** on lines, functions, branches, statements;
      the session logic is unit-tested (persist/restore, recency gating,
      no-bootstrap-on-resume, flush-on-disconnect, clear-on-stop, TTL config).

---

## Public API changes

```typescript
// ── RecordingService ───────────────────────────────────────────────────────
// NEW — a stable id for the current live session (null when none).
sessionId: string | null;

// NEW — rehydrate a session WITHOUT emitting the startRecording bootstrap.
restoreSession(state: ActiveSessionState): void;

// NEW — full snapshot for persistence.
getSessionSnapshot(): ActiveSessionState;

// NEW — emitted whenever any persisted field changes (drives debounced save).
onSessionChange(fn: (state: ActiveSessionState) => void): () => void;

// ── PersistenceService ─────────────────────────────────────────────────────
// NEW — live (in-progress) recording session, single record in a new store.
saveActiveSession(state: ActiveSessionState): Promise<void>;
getActiveSession(): Promise<ActiveSessionState | null>;
clearActiveSession(): Promise<void>;

// ── Model ──────────────────────────────────────────────────────────────────
export interface ActiveSessionState {
  sessionId: string;
  isRecording: boolean;
  isPaused: boolean;
  commands: string[];
  interceptors: string[];
  selectorStrategy: SelectorStrategy;
  startedAt: number;
  updatedAt: number;
}

// ── LibE2eRecorderElement ──────────────────────────────────────────────────
// NEW — programmatic control of the live session.
hasActiveSession(): boolean;
resumeSession(): void;
discardSession(): void;
```

New `IndexedDB` store (schema `version: 10 → 11`):

```typescript
{ name: 'activeSession', keyPath: 'id', autoIncrement: false, indexes: [] }
// single record, fixed key (id = 1)
```

New `localStorage` key: `e2e-active-session` → `{ sessionId, isRecording, updatedAt }`
(breadcrumb only — **no command payload**; the payload lives only in `IndexedDB`).

New `configuration` key: `resumeRecencyTtlMinutes` (number, default `30`), editable
in the settings panel.

New i18n keys (illustrative): `RECORDER.RESUME_TITLE`,
`RECORDER.RESUME_IN_PROGRESS`, `RECORDER.RESUME_COMMAND_COUNT`,
`RECORDER.RESUME_CONTINUE_BTN`, `RECORDER.RESUME_DISCARD_BTN`,
`CONFIG.RESUME_TTL_LABEL`, `CONFIG.RESUME_TTL_HINT`.

---

## Out of scope

- **Cross-origin / cross-subdomain** continuity (different scheme/host/port or
  `app1.x.com` vs `app2.x.com`). Would require cookies for the indicator + an
  iframe storage broker on a common origin or a backend — a separate future spec.
- **`cy.origin` generation** / making the test runnable across different origins.
  The goal here is buffer continuity within a single origin.
- **Runtime deduplication of multiple widget instances.** Avoiding two mounted
  widgets is handled by **README guidance**, not by a window-level singleton or
  instance guard.
- **Cross-tab** continuity. A recording is a single linear session owned by one
  tab; two tabs recording at once is not supported (single active session record,
  last-writer-wins). May be revisited later.
- **Merging two independent saved tests** — that is import/merge territory
  (see spec 004), not live continuity.
- Changing how commands are generated for the second app (selectors, HTTP, etc.)
  — capture behaviour is unchanged; only its persistence/lifecycle changes.

---

## Implementation notes

- **Persist + restore is the whole mechanism.** No window singleton, no instance
  guard. Subscribe to `commands$/interceptors$/isRecording$/isPaused$`, debounce
  (~300 ms), write the `ActiveSessionState` to the `activeSession` store and
  refresh the `localStorage` breadcrumb (`updatedAt` acts as the heartbeat). On
  `connectedCallback`, read the session and rehydrate if recording.
- **No bootstrap on resume.** `startRecording()` keeps emitting
  viewport/visit/hide for a *fresh* start. Resume uses `restoreSession()` which
  sets the subjects directly (commands, interceptors, flags, strategy, sessionId)
  and emits nothing. The route listener then emits the new app's
  `cy.url().should('include', …)` on the next `pushState`, which is exactly the
  desired crossing marker.
- **Flush on disconnect.** Because saves are debounced, `disconnectedCallback`
  must trigger a **final immediate save** while a recording is active (the realm
  survives client-side nav, so an async write started here completes even after
  the element is gone). This protects the per-sub-project placement where A's
  widget unmounts right after the last command.
- **Mount resolution order:** (1) shell placement → widget never unmounts, buffer
  is already in memory, persistence is just backup; (2) per-sub-project / hard
  reload → `IndexedDB.activeSession.isRecording === true` → if `now - updatedAt <
  TTL` resume silently, else show continue/discard.
- **Recency TTL.** Default **30 min**, stored in the `configuration` store
  (`resumeRecencyTtlMinutes`) and editable in the settings panel (rarely touched,
  but exposed). Crossing apps is instant so it is always "recent"; the TTL only
  gates the returning-later case.
- **Clear on stop (Q2).** Only an **actively recording** session is persisted and
  resumed. The moment recording stops (`isRecording → false`), clear the live
  session — call `clearActiveSession()` and remove the breadcrumb in the
  `onRecordingChange` stop branch (next to `saveRecordingHistory()`), and also in
  `onSaveTest` / `onSaveAndExportTest` / the discard path. A stopped, unsaved
  buffer is intentionally **forgotten** across navigation; the in-memory save
  dialog still uses the current instance's buffer.
- **Relationship to recording-history.** The existing `e2e-recording-history`
  (last-5 post-stop backup) is unchanged and orthogonal. The new `activeSession`
  is the single *live, mutable* session.

### Integration guidance (to document in the README)

Pick **exactly one** placement — never both, or the HTTP monitor installs twice
and commands are double-recorded:

- **Option A — single instance in the shell (recommended).** Mount one
  `<lib-e2e-recorder>` in the shell/root application. It is never unmounted on app
  swaps, so a recording naturally spans every micro-frontend. Simplest and most
  robust.
- **Option B — one instance per sub-project, never in the shell.** Each
  micro-frontend mounts its own widget. Continuity across crossings is provided by
  the persisted session (flush on unmount → rehydrate on mount). Do **not** also
  put one in the shell. **Caveat (Q4):** during a single-spa transition two apps
  can be briefly mounted at once, so two widgets (two HTTP monitors) run for a few
  hundred ms — calls fired in that window may produce a **duplicate `cy.wait`**
  command (interceptors dedupe by string, wait commands do not). Just delete the
  stray line if it appears, or prefer Option A to avoid it entirely.

---

## Open questions

- [x] Q1: **Recency TTL** → **Resolved: default 30 min, editable in settings**
      (`resumeRecencyTtlMinutes`). Rarely used but exposed.
- [x] Q2: **Stopped-but-unsaved buffer across navigation** → **Resolved: forget
      it.** Only an actively-recording session is persisted/resumed; stopping
      clears the live session. A non-recording buffer never crosses.
- [x] Q3: **Payload storage** → **Resolved: `IndexedDB` only** for the command
      payload; `localStorage` holds only the breadcrumb.
- [x] Q4: **Option B transient overlap** → **Resolved: documented caveat only.**
      Recommend Option A (shell), which has no overlap; document the brief
      two-widget window (and possible duplicate `cy.wait`) for Option B. A
      lightweight leader/handoff guard is a **fast-follow** only if a real Option B
      user reports duplicates — no runtime dedup ships in this spec.

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-06-30 | Initial draft. Topology confirmed same-origin + client-side nav; goal = preserve buffer; resume = auto-if-recent / ask-if-stale. Multi-instance handled by README integration guidance (shell-single vs per-sub-project), not a runtime singleton. |
| 2026-06-30 | Review: Q1 TTL 30 min + editable in settings; Q2 stop = forget (only recording sessions persist/resume); Q3 payload in IndexedDB only; Q4 Option B overlap = documented caveat (no runtime dedup). All open questions resolved. |
| 2026-06-30 | Implemented: `activeSession` store (DB v11) + persistence API; `RecordingService.restoreSession/getSessionSnapshot/onSessionChange/sessionId`; recorder incremental persist + breadcrumb, resume-or-prompt on connect, flush on disconnect, clear on stop, `hasActiveSession/resumeSession/discardSession`; settings TTL field; i18n ×5; README micro-frontend guide. Gates green (lint 0, 778 tests, coverage 95.8%, build 0). Status → Implemented. |
