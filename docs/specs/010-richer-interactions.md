# 010 — Richer interaction capture

> **Status:** Implemented
> **Date:** 2026-07-01
> **Author:** Gonzalo

---

## Context and motivation

The recorder captures single clicks, text input, `<select>` changes, route
changes and HTTP. Real flows also use **double-click**, **right-click**,
**checkboxes/radios**, and **key presses** (Enter/Escape). Today:

- clicking a **checkbox/radio** records **nothing** (`handleClickEvent` returns
  early for `input` tags),
- **double-click** and **right-click** are not captured,
- **Enter/Escape** in a field are not captured.

This spec adds those, extending the existing DOM-listener pattern in
`RecordingService`.

### Decisions (proceeding autonomously per the go-ahead)

- **Checkbox/radio** → `cy.get(sel).check()` / `.uncheck()` (radio always
  `.check()`; checkbox reflects the resulting state). Text-input clicks stay a
  no-op (the value is captured on `input`, as today).
- **Double-click** → `cy.get(sel).dblclick()`, **collapsing** the up-to-2
  single-`.click()` commands the browser fires first, so the test has one clean
  `dblclick()`.
- **Right-click** → `cy.get(sel).rightclick()` (the native context menu is not
  suppressed).
- **Keys**: **Enter** → `.type('{enter}')`, **Escape** → `.type('{esc}')`, only
  when focus is in an `input`/`textarea`/`select`. A pending debounced input value
  is **flushed first** so it is recorded before the key. **Tab is excluded**
  (Cypress `.type('{tab}')` is unsupported).
- **File upload (`selectFile`) is out of scope** here (needs a fixture path /
  filename handling) — a later spec.

---

## Use cases

1. **UC-01** — As a QA engineer, checking/unchecking a checkbox or picking a radio
   is recorded as `.check()` / `.uncheck()`.
2. **UC-02** — As a QA engineer, a double-click is recorded as a single
   `.dblclick()`, not two clicks.
3. **UC-03** — As a QA engineer, a right-click is recorded as `.rightclick()`.
4. **UC-04** — As a QA engineer, pressing Enter/Escape in a field is recorded as
   `.type('{enter}')` / `.type('{esc}')`, after the field's value.

---

## Acceptance criteria

- [x] AC-01: Clicking a **checkbox** records `check()` when it becomes checked and
      `uncheck()` when it becomes unchecked; a **radio** records `check()`.
- [x] AC-02: A **double-click** records `cy.get(sel).dblclick()` and removes the
      up-to-2 immediately-preceding identical `.click()` commands on that selector.
- [x] AC-03: A **right-click** (contextmenu) records `cy.get(sel).rightclick()`.
- [x] AC-04: **Enter** in a field records `.type('{enter}')`, **Escape** records
      `.type('{esc}')`; a pending debounced input value is flushed **before** the
      key command. **Tab** records nothing.
- [x] AC-05: All new captures respect **recording/paused** state, ignore the
      widget's own element, and use the existing selector resolution
      (`closest(...)` + `getReliableSelector`). Alt+click (assertion) is unaffected.
- [x] AC-06: A plain single click and text input behave exactly as before (no
      regressions).
- [x] AC-07: New behaviour is unit-tested (checkbox/radio, dblclick collapse,
      rightclick, Enter/Escape flush, Tab-ignored).
- [x] AC-08: `README.md` documents the new interactions.
- [x] AC-09: Gates green — `npm run lint` (0 errors), `npm test`, coverage
      **96.05%**, `npm run build` clean.

---

## Public API changes

None. New behaviour is internal to `RecordingService` (more DOM listeners +
`handleClickEvent` branch); commands flow through the existing pipeline.

---

## Out of scope

- **File upload** (`<input type=file>` → `.selectFile(...)`) — needs fixture-path
  handling; future spec.
- **Tab** key (Cypress `.type('{tab}')` unsupported without a plugin).
- Drag & drop, hover (`.trigger('mouseover')`), and other advanced gestures.
- Collapsing dblclick on toggles (checkbox double-click) — the collapse targets
  `.click()` commands only.

---

## Implementation notes

- **Checkbox/radio:** in `handleClickEvent`'s `input` branch, if
  `type ∈ {checkbox, radio}`, resolve the selector and append `check()`/`uncheck()`.
  This runs in the bubble phase, where `input.checked` already reflects the new
  (post-toggle) state, so no microtask is needed (unlike the Alt+click assert path,
  which cancels the toggle).
- **New listeners** (`dblclick`, `contextmenu`, `keydown`) registered in the
  constructor under the shared `AbortController`. A small `resolveSelectorFor(target)`
  helper centralises: ignore own/body/html → `closest(...)` → `getReliableSelector`.
- **dblclick collapse:** pop up to 2 trailing commands equal to
  `cy.get('<sel>').click()` before appending `dblclick()`.
- **Key flush:** extract `recordInputValue(target)` (used by the input debounce)
  and a `flushInputDebounce(target)` that clears the pending timer and records the
  value immediately, called before emitting the `{enter}`/`{esc}` command.

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-07-01 | Initial draft. Scope: checkbox/radio → check/uncheck, dblclick (with click-collapse), right-click, Enter/Escape (with input flush). Tab and file upload out of scope. |
| 2026-07-01 | Implemented: new dblclick/contextmenu/keydown listeners + `resolveSelectorFor`, checkbox/radio branch in `handleClickEvent`, `recordInputValue`/`flushInputDebounce` refactor. README updated. Gates green (lint 0, coverage 96.05%, build 0). Status → Implemented. Held on a branch pending manual testing (not yet merged/released). |
