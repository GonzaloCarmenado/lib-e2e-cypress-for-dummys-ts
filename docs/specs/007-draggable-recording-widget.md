# 007 — Draggable Recording Widget

> **Status:** Implemented
> **Date:** 2026-06-30
> **Author:** Gonzalo

---

## Context and motivation

The floating recorder widget is **anchored to a fixed position** at the
bottom-right of the viewport:

```ts
// src/components/lib-e2e-recorder/lib-e2e-recorder.styles.ts
.widget { position: fixed; bottom: 0; right: 0; width: 190px; height: 190px; … }
```

On some pages this overlaps real application controls (buttons, FABs, toasts)
located in that corner, **blocking interaction with them while recording**.

Today the only mitigation is to **hide** the widget entirely (`Ctrl+Shift+E` /
`start-hidden`). But hiding is a poor workaround: the `Ctrl+R` / `Ctrl+P`
shortcuts **only fire while the widget is visible** (`handleKeyboardEvent`), so a
hidden widget means losing live access to stop/pause. The user needs to **move**
the widget out of the way, not remove it.

The radial action menu expands in a **quarter-circle up-and-to-the-left** from the
bottom-right anchor:

```ts
// arc positions, radius ~90px, plus labels that overhang another ~9px
.widget:hover .btn-action[data-n="1"] { transform: translateY(-90px); }        // up
.widget:hover .btn-action[data-n="2"] { transform: translate(-45px,-78px); }   // up-left
.widget:hover .btn-action[data-n="3"] { transform: translate(-78px,-45px); }   // left-up
.widget:hover .btn-action[data-n="4"] { transform: translateX(-90px); }        // left
```

So naïvely allowing free movement would push these buttons (and their labels)
**off-screen** when the widget is dragged near the top or left edge. That is the
core constraint this spec must solve.

### Resolved design decisions (product owner)

- **Free positioning** — the widget can be dragged anywhere, not just snapped to
  corners.
- **Adaptive expansion** — the radial menu detects which quadrant the widget is in
  and expands toward the **interior** of the screen (near the top → expand
  downward; near the left → expand rightward), with a **safety clamp** so nothing
  leaves the viewport. This is what keeps the buttons visible everywhere.
- **Drag via movement threshold** — press-and-move beyond ~5 px = drag; press and
  release without moving = a normal click (record/stop). No extra drag handle.
- The dragged position is **persisted** (it survives reloads / app crossings),
  reusing the `configuration` store.

---

## Use cases

1. **UC-01 — Move the widget out of the way**
   As a QA engineer, when the widget covers an app control I need to click, I want
   to drag it to another spot so I can interact with the page while still
   recording.

2. **UC-02 — Buttons always reachable**
   As a QA engineer, wherever I drop the widget I want its action buttons (⚙️/📁/⌨️/📋)
   and pause/stop to stay **fully on-screen**, expanding toward the centre of the
   viewport.

3. **UC-03 — Dragging never triggers record/stop**
   As a QA engineer, I want to move the widget by dragging the main button without
   accidentally starting or stopping the recording; a plain click must still
   toggle recording.

4. **UC-04 — Position is remembered**
   As a QA engineer, once I place the widget where I like it, I want it to **stay
   there** on reload and across app crossings, so I don't reposition it every time.

5. **UC-05 — Recover the default position**
   As a QA engineer, I want a one-click way to **reset** the widget to its default
   corner in case I lose it or the layout changes.

6. **UC-06 — Survive viewport changes**
   As a QA engineer, when I resize the window (or it changes on rotate/zoom), I
   want the widget to stay **within the visible area**, not stranded off-screen.

---

## Acceptance criteria

- [x] AC-01: The widget can be **dragged to any position** in the viewport using
      pointer events (mouse + touch).
- [x] AC-02: Drag uses a **movement threshold** (~5 px): moving past it starts a
      drag; releasing under it is treated as a **click** (record/stop). A drag
      **must not** toggle recording, and a plain click **must** still toggle.
- [x] AC-03: The radial menu **expansion direction adapts** to the widget's
      position — one of `up-left` / `up-right` / `down-left` / `down-right` — chosen
      so the buttons and their labels expand toward the viewport interior.
- [x] AC-04: A **safety clamp** keeps the widget (collapsed footprint and, given
      the adaptive direction, its expanded arc) inside the viewport; it can never
      be dropped where the toggle or the action buttons would be off-screen.
- [x] AC-05: The hover **hit-area** that keeps the radial menu open while the
      cursor travels to a button **follows the widget and its expansion direction**
      (the 190×190 box is re-anchored per direction so it always covers the arc).
- [x] AC-06: The position is **persisted** in the `configuration` store
      (`widgetPosition`) on drag end and **restored** on mount (clamped to the
      current viewport). Default when unset = current bottom-right corner.
- [x] AC-07: On `window` **resize**, the widget is **re-clamped** so it stays fully
      visible.
- [x] AC-08: A **reset** affordance returns the widget to the default corner
      (settings button **and** `resetWidgetPosition()` API); the persisted position
      is cleared.
- [x] AC-09: Dragging the widget (own element) **emits no Cypress commands** — it
      is ignored by the recorder like every other interaction with
      `[data-cy="lib-e2e-cypress-for-dummys"]`.
- [x] AC-10: Dragging works **while recording** (the common case — get it out of
      the way mid-flow) and while paused.
- [x] AC-11: The `window.Cypress` guard and `start-hidden` behaviour are
      unaffected; a hidden/disabled widget has no drag listeners.
- [x] AC-12: Any new user-visible strings (reset label/hint/section/toast) exist in
      **all 5** i18n files.
- [x] AC-13: Coverage stays **≥ 80%** on lines, functions, branches, statements;
      drag/threshold/clamp/expansion-direction/persistence logic is unit-tested
      (jsdom-friendly: driven by `window.innerWidth/Height` and stored coords, not
      real layout).
- [x] AC-14: `README.md` documents that the widget is draggable, how to reset it,
      and that the position is remembered.

---

## Public API changes

```typescript
// ── LibE2eRecorderElement ──────────────────────────────────────────────────
// NEW — reset the widget to its default corner and clear the saved position.
resetWidgetPosition(): void;

// (internal) drag state is not part of the public surface.
```

New `configuration` key: `widgetPosition` → `{ x: number; y: number }` (px of the
widget box top-left, clamped to the viewport on load).

Possible new i18n keys (illustrative): `CONFIG.WIDGET_POSITION_SECTION`,
`CONFIG.WIDGET_POSITION_RESET_BTN`.

No changes to `RecordingService` / `PersistenceService` public API beyond using
the existing `setConfig`/`getGeneralConfig`.

---

## Out of scope

- **Snap-to-corner** mode (an alternative that was considered and not chosen) —
  free positioning + adaptive expansion is the selected approach.
- Redesigning the radial menu into a different layout (linear bar, dock, etc.).
- Multi-monitor / off-window positioning, and remembering a different position per
  route or per origin.
- Advanced touch gestures beyond a basic press-move-release drag.
- Moving the **REC/PAUSED badge** (it stays fixed top-centre; it does not overlap
  app controls in the corner and is not part of the draggable widget).

---

## Implementation notes

- **Coordinate model.** Move the `.widget` box via `left`/`top` (unsetting
  `bottom`/`right`). Persist the box top-left `{x, y}`. On mount and on resize,
  clamp `x`/`y` so the box stays within `window.innerWidth/innerHeight` (minus a
  small margin). Driving the logic off `window.innerWidth/Height` + stored coords
  (rather than `getBoundingClientRect`, which is unreliable in jsdom) keeps it unit-testable.
- **Adaptive expansion.** Compute a quadrant from the widget centre vs the viewport
  centre and set a `data-expand="up-left|up-right|down-left|down-right"` attribute
  on `.widget`; provide the four CSS arc variants (and matching label sides). Recompute
  on drag move and on resize. The existing arc (up-left) becomes the `bottom-right`
  case.
- **Drag vs click (threshold).** Use `pointerdown` on the toggle (and/or the whole
  widget): record the start point, listen to `pointermove`; once movement exceeds
  the threshold, enter drag mode and suppress the subsequent `click` so it doesn't
  toggle recording. Release under threshold → let the click through. Pointer events
  cover mouse and touch.
- **Reuse.** `modal.utils.ts:applyDraggable` is modal-specific (header drag, no
  threshold/clamp/adaptive) — this widget needs bespoke logic; consider a small
  `makeWidgetDraggable` util. Position persistence reuses the `configuration` store
  introduced/used in spec 006.
- **Recorder safety.** Drag interactions happen on the lib's own element, already
  ignored by `RecordingService` (`isOwnElement`), so no spurious commands. Verify
  the suppressed-click path also can't reach `addCommand`.
- **Hover hit-area.** The invisible 190×190 hit-area must reposition with the
  widget and extend in the expansion direction so the radial stays open while the
  cursor travels to a button (AC-05).

---

## Open questions

- [x] Q1: **Reset affordance** → **Resolved: button in ⚙️ Config + `resetWidgetPosition()` API.**
- [x] Q2: **Storage model** → **Resolved: absolute px (toggle-centre) + clamp on load/resize** for v1.
- [x] Q3: **Touch** → **Resolved: pointer events, touch best-effort** (works, not a first-class test target).
- [x] Q4: **Drag start surface** → **Resolved: the toggle button only** (single clear grab point).

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-06-30 | Initial draft. Decisions locked: free positioning + adaptive radial expansion (with safety clamp); drag via ~5px movement threshold (no extra handle); position persisted in the configuration store. Proposal "file-explorer handling" tracked separately and **descartada** for now. |
| 2026-06-30 | Open questions resolved: Q1 settings button + reset API; Q2 absolute px + clamp; Q3 pointer events (touch best-effort); Q4 drag from the toggle only. Status → In Progress. |
| 2026-06-30 | Implemented: `widget-position.utils` (clamp + adaptive direction); data-expand-driven styles (4 arc directions via --sx/--sy); recorder drag (threshold, persist, restore, resize re-clamp, reset) + `resetWidgetPosition()`; settings reset button; i18n ×5. Gates green (lint 0, 801 tests, coverage 95.9%, build 0). Status → Implemented. |
