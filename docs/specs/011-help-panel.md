# 011 — In-app Help panel

> **Status:** Implemented
> **Date:** 2026-07-01
> **Author:** Gonzalo

---

## Context and motivation

The widget has grown from "record clicks" into a broad tool (recording,
assertions, rich interactions, HTTP monitoring, selector picker, file editor +
runner, cross-app continuity, draggable widget, export/import, invisible mode,
i18n). **Discoverability is now the weak point** — even the author forgets what it
does. This adds an **in-app Help panel**: a categorized cheat-sheet of everything
the recorder can do, opened from the widget.

### Decisions (product owner)

- **Trigger:** a **5th radial button (`?`)** in the widget **and** the shortcut
  **Ctrl+Shift+H**. (The radial arc is re-fanned from 4 to 5 buttons.)
- **Content:** **comprehensive & categorized** — shortcuts, captured interactions,
  Alt+click assertions, the 4 panels, selector strategy, HTTP, data (export/import),
  invisible mode, local runner, cross-app continuity, draggable widget.
- **i18n:** **all 5 languages fully translated** now (es/en/fr/it/de).

---

## Use cases

1. **UC-01** — As a user, I click the `?` button (or press Ctrl+Shift+H) and see a
   panel listing everything the recorder can do, grouped by topic.
2. **UC-02** — As a user, I find the keyboard shortcuts and the Alt+click assertion
   tip without leaving the app or reading the README.

---

## Acceptance criteria

- [x] AC-01: A **`?` action** appears in the widget's action menu and opens the
      Help panel. **The action menu was changed from a radial fan to a labelled
      grid popover** (icons + labels) — the 5th button made the radial cramped; the
      popover opens toward the viewport interior (adaptive, spec 007 preserved) and
      is more discoverable (labels visible).
- [x] AC-02: **Ctrl+Shift+H** opens the Help panel (works when the widget is
      visible, like the other panel shortcuts).
- [x] AC-03: The panel is a Custom Element (`help-panel`) shown in a Swal modal,
      consistent with the other panels; its template is **pure** and all content is
      **escaped** (`escHtml` — needed because values contain literal `<select>`).
- [x] AC-04: Content is **categorized** and split into **two tabs**: *Quick
      reference* (8-section cheat-sheet) and *Usage guide* (workflow + what it
      covers + what it does NOT cover). Covers recording, shortcuts, interactions,
      Alt+click assertions, the panels, selectors, HTTP, data, invisible mode,
      runner, cross-app, drag.
- [x] AC-05: **Every** string goes through `TranslationService`; the new `HELP.*`
      keys exist and are **fully translated in all 5** language files.
- [x] AC-06: `showHelpDialog()` + `isHelpDialogOpen` are exposed on the element
      (toggle-modal pattern like the others); `help-panel` is exported & registered.
- [x] AC-07: The "action buttons" expectation is updated to 5; no other widget
      behaviour regresses.
- [x] AC-08: `README.md` mentions the in-app Help (`?` / Ctrl+Shift+H).
- [x] AC-09: Gates green — `npm run lint` (0), `npm test` (851), coverage
      **96.28%**, `npm run build` clean.

---

## Public API changes

```typescript
// LibE2eRecorderElement
isHelpDialogOpen: boolean;
showHelpDialog(): void;

// NEW component
export class HelpPanelElement extends HTMLElement {}   // <help-panel>
```

New i18n section `HELP.*` (section titles + concise one-line items) in all 5
languages. New key `RECORDER.BTN_HELP` (radial button label).

---

## Out of scope

- Searchable/filterable help, interactive tutorials, or contextual tooltips.
- Linking each item to live actions (it's a reference, not a launcher).
- Per-topic deep docs (that's the README / specs).

---

## Implementation notes

- **Component** `src/components/help-panel/{help-panel.ts,.styles.ts,.template.ts}`
  following conventions: `renderHelpPanel(t)` pure, styles as a const, content
  driven by `HELP.*` i18n keys grouped into sections (title + items).
- **Radial rework** (`lib-e2e-recorder.styles.ts`): 5 buttons over the quarter-arc
  (≈0/22.5/45/67.5/90°) via `--sx/--sy` magnitudes `(0,90) (34,83) (64,64) (83,34)
  (90,0)`; the vertical/horizontal extremes (`data-n="1"` and `data-n="5"`) get the
  centered labels; stagger transition-delays for 5.
- **Widget** template: add `data-n="5" data-action="help"` (`?`), label `RECORDER.BTN_HELP`.
- **Recorder**: `isHelpDialogOpen` + `showHelpDialog()` (toggle-modal + mount
  `help-panel`), wire `data-action="help"` in `render()`, add `Ctrl+Shift+H` to
  `handleKeyboardEvent` (key `h`).
- **index.ts**: export + the component self-registers as `help-panel`.

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-07-01 | Initial draft. Decisions: `?` radial button (5th) + Ctrl+Shift+H; comprehensive categorized content; all 5 languages fully translated. |
| 2026-07-01 | Implemented: `help-panel` component + 8-section content driven by `HELP.*` keys (fully translated ×5), radial re-fanned to 5 buttons, `showHelpDialog()` + Ctrl+Shift+H. Content escaped with `escHtml` (values contain `<select>`). Gates green (lint 0, 851 tests, coverage 96.28%, build 0). Held on a branch pending testing. |
| 2026-07-02 | UX iteration after testing: the 5-button radial felt cramped → **replaced with a labelled grid popover** (icons + labels). Added **two tabs** to the help panel — *Quick reference* + *Usage guide* (workflow / what it covers / what it does NOT cover). Guide body: es/en full; fr/it/de fallback to ES with `// TODO: translate`. Gates green (854 tests, coverage 96.38%, build 0). |
