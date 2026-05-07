# 001 — Smart Selector Picker

> **Status:** Draft
> **Date:** 2026-05-07
> **Author:** gc

---

## Context and motivation

When the user clicks on an element that has no valid testing selector (`data-cy`, `data-testid`, `aria-label`, or a clean `id`), the recorder currently ignores the click silently. Only for `mat-select` / `mat-option` is a comment added (`// No se pudo generar un selector confiable`).

A user with no knowledge of Cypress or the DOM hierarchy cannot fix this: they do not know which parent element to target, which attribute to add, or even why the click was not captured.

This feature adds an interactive picker that activates on those "no valid selector" clicks. The picker walks the DOM ancestor chain of the clicked element, colour-codes each ancestor by selector quality, and lets the user navigate and confirm which element (and therefore which `cy.get()` command) to record. Users who do not want this behaviour can disable it in Settings.

---

## Use cases

1. **UC-01 — Click without valid selector triggers the picker**
   When recording is active, `smartSelectorEnabled` is `true`, and the user clicks an element with no testable selector, the picker overlay appears anchored below the widget, showing the ancestor chain of the clicked element.

2. **UC-02 — Keyboard navigation through ancestors**
   The user presses ↑ / ↓ to move the selection cursor through the ancestor list. The currently selected row is highlighted and a live preview of the generated `cy.get()` command is shown.

3. **UC-03 — Colour-coded selector quality**
   Each ancestor row carries a colour badge indicating selector quality:
   - 🟢 **Excellent** — has `data-cy`, `data-testid`, or `aria-label`
   - 🔵 **Good** — has a valid `id` (passes the existing `FORBIDDEN_ID_PREFIXES` and length rules)
   - 🟡 **Acceptable** — has one or more CSS classes (no testing attribute, no valid id)
   - 🔴 **Not recommended** — only tag name or inline `style`; no stable selector exists

4. **UC-04 — Confirm selection**
   Pressing `Enter` or clicking the highlighted row adds `cy.get('<selector>').click()` to the recording and dismisses the picker.

5. **UC-05 — Cancel or dismiss**
   Pressing `Escape` or clicking outside the picker dismisses it without adding any command (silent drop, same as current behaviour).

6. **UC-06 — Feature can be disabled**
   `smartSelectorEnabled` is stored in the DB config (default `true`). When `false`, the recorder silently drops unresolvable clicks, preserving the existing behaviour. The toggle is exposed in the Settings panel.

7. **UC-07 — Picker auto-selects the best ancestor on open**
   On open, the cursor is pre-positioned on the first ancestor that has at least a CSS class (🟡 or better). If every ancestor is 🔴, the cursor starts at the clicked element itself.

8. **UC-08 — Picker closes automatically when recording stops or is paused**
   If recording is paused or stopped while the picker is open, the picker dismisses silently.

---

## Acceptance criteria

- [ ] AC-01: A new boolean config key `smartSelectorEnabled` (string `'true'`/`'false'`, default `'true'`) is stored in the existing `configuration` IndexedDB store via `PersistenceService.setConfig`.
- [ ] AC-02: A toggle for this setting is visible in the `ConfigurationElement` panel under a new section.
- [ ] AC-03: When `smartSelectorEnabled` is `'false'`, no picker is shown; the click is silently dropped.
- [ ] AC-04: When the picker opens, it shows the full ancestor chain from the clicked element up to (but not including) `<html>`, excluding the recorder's own Shadow DOM host.
- [ ] AC-05: Every row shows: quality badge (colour + emoji), tag name, the key attribute value if any, and the generated `cy.get()` selector preview.
- [ ] AC-06: The four quality tiers are applied exactly as specified in UC-03.
- [ ] AC-07: ↑ / ↓ navigation wraps around (bottom → top and vice versa).
- [ ] AC-08: `Enter` or row click adds `cy.get('<selector>').click()` via `recording.appendCommand()` and closes the picker.
- [ ] AC-09: `Escape` or outside click closes the picker without adding any command.
- [ ] AC-10: The picker closes automatically when recording stops or pauses.
- [ ] AC-11: The picker never appears for clicks on the recorder widget itself.
- [ ] AC-12: All visible strings go through `TranslationService` (all 5 languages).
- [ ] AC-13: Unit tests cover: quality classification logic, keyboard navigation, confirm/cancel paths, auto-close on recording change.
- [ ] AC-14: `npm run lint`, `npm test`, `npm run test:coverage` (≥ 80%) and `npm run build` all pass.

---

## Public API changes

### `PersistenceService` — no change
Uses existing `setConfig` / `getConfig` with new key `smartSelectorEnabled`.

### `RecordingService` — new observable

```typescript
// Emitted when a click has no resolvable selector and smartSelectorEnabled is true.
// Consumers (LibE2eRecorderElement) listen and show the picker.
onSelectorNotFound(
  fn: (target: HTMLElement, action: 'click') => void
): () => void;
```

Internal helper added (not exported):

```typescript
// Returns the quality tier for a given element
function getSelectorQuality(el: HTMLElement): SelectorQuality;

type SelectorQuality = 'excellent' | 'good' | 'acceptable' | 'poor';
```

### New component — `SelectorPickerElement`

```
src/components/selector-picker/
  selector-picker.ts
  selector-picker.styles.ts
  selector-picker.template.ts
```

```typescript
// Custom element: <selector-picker>
// Injected into document.body (outside Shadow DOM) so it overlays the host app.
class SelectorPickerElement extends HTMLElement {
  // Set before connectedCallback
  targetElement: HTMLElement | null;
  recording: RecordingService;
  translation: TranslationService;

  // Dispatched events
  // 'selectorchosen'  → detail: string  (the cy.get() command)
  // 'pickercancelled' → no detail
}
```

### `ConfigurationElement` — new toggle

New section rendered by `renderConfiguration` / `ConfigurationState`:

```typescript
interface ConfigurationState {
  // ... existing fields
  smartSelectorEnabled: boolean;   // NEW
}
```

### i18n keys (all 5 languages)

```
CONFIG.SMART_SELECTOR_SECTION
CONFIG.SMART_SELECTOR_TITLE
CONFIG.SMART_SELECTOR_SUB
SELECTOR_PICKER.TITLE
SELECTOR_PICKER.PREVIEW_LABEL
SELECTOR_PICKER.CONFIRM_HINT
SELECTOR_PICKER.CANCEL_HINT
SELECTOR_PICKER.QUALITY_EXCELLENT
SELECTOR_PICKER.QUALITY_GOOD
SELECTOR_PICKER.QUALITY_ACCEPTABLE
SELECTOR_PICKER.QUALITY_POOR
```

---

## Out of scope

- Suggesting which `data-cy` attribute to add to the element (attribute injection is a future spec).
- Capturing `input` or `select` events through the picker (only `click` actions).
- Supporting Firefox / Safari File System API limitations (unrelated to this feature).
- Multi-selection of ancestors (only one ancestor is confirmed per picker session).

---

## Implementation notes

- `SelectorPickerElement` is appended to `document.body` so it appears above the host application. It must not conflict with the host app's CSS — use a Shadow Root.
- The picker must intercept `keydown` on `window` (with `stopPropagation` to avoid triggering the recorder's own Ctrl+R/P shortcuts while the picker is open) and remove the listener on close.
- Quality classification is a pure function → extracted to `src/utils/selector-quality.utils.ts` for easy unit testing.
- The picker can be triggered both by regular "no-selector" clicks AND the existing `// No se pudo generar un selector confiable` mat-select/mat-option paths (if `smartSelectorEnabled` is `true`).
- `LibE2eRecorderElement` subscribes to `onSelectorNotFound` in `connectedCallback` and unsubscribes in `disconnectedCallback`.

---

## Open questions

- [x] Q1: Should the picker also trigger for `mat-select` / `mat-option` when `smartSelectorEnabled` is `true`, replacing the current comment?  ← **Decision: yes**, full consistency.
- [x] Q2: Maximum depth of the ancestor chain to show (avoid listing 30+ ancestors for deeply nested DOM trees). ← **Decision: cap at 10 ancestors**.
- [x] Q3: Should clicking a 🔴 "poor" row still be allowed, or should those rows be disabled?  ← **Decision: allow**, but show a warning tooltip.

---

## History

| Date       | Change                          |
|------------|---------------------------------|
| 2026-05-07 | Initial draft                   |
| 2026-05-07 | Q1–Q3 resolved; implementation approved |
