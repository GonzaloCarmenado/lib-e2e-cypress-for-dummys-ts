# 009 — Assertion capture while recording (Alt+click)

> **Status:** Implemented
> **Date:** 2026-07-01
> **Author:** Gonzalo

---

## Context and motivation

The recorder captures **actions** (clicks, inputs, selects, route changes, HTTP)
but no **verifications**. Today the only way to add an assertion is the manual
*assertion builder* in the command previewer (type a selector + pick a `should`
type). A generated test with no `should()` is weak — it drives the app but never
checks anything.

This adds **inline assertion capture while recording**: hold **Alt** and click an
element to record a Cypress assertion about it, instead of a `.click()`. It turns
"I recorded some clicks" into "I recorded a real test".

### Resolved design decisions (product owner)

- **Trigger:** **Alt+click** (one-off). No mode toggle — you stay in normal
  recording; Alt+click just records an assertion for that element.
- **What to assert:** **auto-inferred** from the element (zero friction, the
  "for dummies" spirit):
  - `input[checkbox|radio]` → `should('be.checked')` / `should('not.be.checked')`
  - `input`/`textarea`/`select` with a value → `should('have.value', '<value>')`
  - element with short visible text → `should('contain.text', '<text>')`
  - otherwise → `should('be.visible')`
- **Suppress the action:** an Alt+click **must not** trigger the element's real
  action (no navigation / form submit / app click). Captured in the **capture
  phase** with `preventDefault()` + `stopImmediatePropagation()`.

---

## Use cases

1. **UC-01 — Assert without leaving record mode**
   As a QA engineer recording a flow, I want to Alt+click an element to add a
   verification for it, without switching modes.
2. **UC-02 — Sensible assertion by default**
   As a QA engineer, I want the right kind of assertion chosen for me based on the
   element (checkbox state, input value, visible text, or just visibility).
3. **UC-03 — Assert doesn't perform the action**
   As a QA engineer, when I Alt+click a button/link I want it verified **without**
   clicking it (no navigation/submit), so asserting never changes the flow.
4. **UC-04 — Editable like any command**
   As a QA engineer, the captured assertion appears in the command previewer where
   I can reorder or delete it like any other command.

---

## Acceptance criteria

- [x] AC-01: While recording (not paused), **Alt+click** on an element with a
      reliable selector appends a Cypress **assertion** command (not a `.click()`).
- [x] AC-02: The assertion is **auto-inferred**: checkbox/radio → `be.checked` /
      `not.be.checked`; input/textarea/select with a value → `have.value`; element
      with short visible text → `contain.text`; else → `be.visible`.
- [x] AC-03: The selector is resolved with the **existing** strategy
      (`closest([data-cy],[data-testid],[aria-label],[id])` + `getReliableSelector`);
      the widget's own element is ignored.
- [x] AC-04: An Alt+click that is handled **suppresses the element's action**
      (`preventDefault` + `stopImmediatePropagation` in the capture phase) and does
      **not** also emit a `.click()` command.
- [x] AC-05: A **normal click** (no Alt) behaves exactly as before (records the
      action); Alt+click is a **no-op when not recording / paused**.
- [x] AC-06: An Alt+click on an element with **no reliable selector** does not
      throw and records nothing (it is left to behave as a normal Alt+click; the
      Smart Selector Picker for assertions is out of scope here).
- [x] AC-07: Values/text embedded in the assertion are **single-quote escaped**
      (via `escapeSingleQuotes`), so quotes never break the generated command.
- [x] AC-08: The assertion-inference logic is a **pure, unit-tested util**; the
      capture/suppress path is covered by a `RecordingService` integration test.
- [x] AC-09: `README.md` documents Alt+click-to-assert.
- [x] AC-10: Gates green — `npm run lint` (0 errors), `npm test` (828 pass),
      coverage **95.97%**, `npm run build` clean.

> Impl note: checkbox/radio `checked` is read on the next **microtask** (the click
> activation toggles it transiently; we cancel the action, so the true state is
> read after the restore).

---

## Public API changes

```typescript
// NEW util (pure, exported):
export function inferAssertionCommand(el: HTMLElement, selector: string): string;
```

No changes to the `RecordingService` / element public API — the Alt+click capture
listener is internal (it appends via the existing command pipeline). No new i18n
strings (the feature is behavioural, no UI text).

---

## Out of scope

- A persistent **"assertion mode" toggle** and a **quick menu** to pick the
  assertion type (auto-infer only, for now).
- Routing an **unresolvable** Alt+click through the Smart Selector Picker to assert
  on a chosen ancestor (v1 records nothing in that case).
- Assertions on **HTTP** / non-DOM state (that's the HTTP-monitor territory).
- Negative/`not.exist` assertions and multi-condition assertions.

---

## Implementation notes

- **New util** `src/utils/assertion.utils.ts` → `inferAssertionCommand(el, selector)`
  returning the `cy.get('<selector>').should(...)` string; imports
  `escapeSingleQuotes`. Pure and DOM-free enough to unit-test by passing a jsdom
  element. Text is whitespace-normalised and capped (~60 chars) → falls back to
  `be.visible` for long/empty text.
- **RecordingService**: add a **capture-phase** `click` listener
  (`{ capture: true, signal: this.abort.signal }`), separate from the existing
  bubble listener. It early-returns unless `isRecording && !isPaused && e.altKey`;
  ignores own element / `body` / `html`; resolves the container + selector with the
  existing helpers; then `preventDefault()` + `stopImmediatePropagation()`
  (suppresses the app action **and** the bubble-phase action listener, so no
  duplicate `.click()`) and `addCommand(inferAssertionCommand(container, selector))`.
- Registered in the constructor next to the other listeners; torn down by the same
  `AbortController` on `destroy()`.

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-07-01 | Initial draft. Decisions: Alt+click one-off trigger; auto-infer assertion by element type; suppress the action (capture phase). Auto-only (no menu/toggle) and picker-for-assert are out of scope. |
| 2026-07-01 | Implemented: `inferAssertionCommand` util + capture-phase Alt+click listener in RecordingService (suppresses action, no duplicate click, checkbox/radio state read on microtask). README documented. Gates green (lint 0, 828 tests, coverage 95.97%, build 0). Status → Implemented. |
