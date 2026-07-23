# 023 — E2E Self-Tests: Testing the Extension with Cypress

> **Status:** In Progress
> **Date:** 2026-07-23
> **Author:** Gonzalo

---

## Context and motivation

`lib-e2e-cypress-for-dummys` is a library that helps developers generate Cypress tests — yet the library itself has no Cypress tests. The irony is intentional context for this spec.

The project already has a Vitest unit-test suite (1094 tests) that covers services, utilities, and component logic in jsdom. What that suite cannot verify is the end-to-end behaviour of the extension as a real user experiences it: mounting in a live browser, responding to real DOM events, and producing correct Cypress command strings for each selector strategy.

The example microfrontend app (`ejemplo/`) was built specifically to exercise every feature of the extension — each MFE page contains a dedicated section for a specific selector strategy or interaction type. This makes it an ideal harness for extension self-tests.

These tests are Cypress specs that live alongside the existing `showcase.cy.ts` in `ejemplo/cypress/e2e/extension/`.

---

## Use cases

1. **UC-01 — Widget mounting and basic controls**
   _As a maintainer, I want a Cypress test to verify the extension mounts correctly and its recording controls are reachable via Shadow DOM, so that I catch regressions in the widget lifecycle._

2. **UC-02 — Selector strategy: data-cy**
   _As a maintainer, I want to confirm that clicking an element with `data-cy` generates a `cy.get('[data-cy="…"]').click()` command, so that the primary selector strategy works correctly in a real browser._

3. **UC-03 — Selector strategy: data-testid**
   _As a maintainer, I want to confirm that clicking a `data-testid` element generates the appropriate command when the strategy is set to `data-testid`._

4. **UC-04 — Selector strategy: aria-label**
   _As a maintainer, I want to confirm that clicking an `aria-label` element generates a `cy.get('[aria-label="…"]').click()` command._

5. **UC-05 — Selector strategy: clean id**
   _As a maintainer, I want to confirm that clicking a button with a clean `id` (no framework prefixes) generates a `cy.get('#id')` command._

6. **UC-06 — Framework id ignored**
   _As a maintainer, I want to confirm that clicking a button whose `id` is a known framework prefix (`mat-`, `cdk-`) does NOT generate an id-based command (falls back or triggers the picker)._

7. **UC-07 — HTTP GET interception**
   _As a maintainer, I want to confirm that triggering a GET request while recording adds a `cy.intercept('GET', …)` entry to the interceptors list._

8. **UC-08 — HTTP POST interception**
   _As a maintainer, I want to confirm that triggering a POST request while recording adds a `cy.intercept('POST', …)` entry with body validation._

9. **UC-09 — Form inputs: checkbox, radio, select, textarea**
   _As a maintainer, I want to confirm that each form control type generates the semantically correct Cypress command (`.check()`, `.select()`, `.clear().type()`)._

10. **UC-10 — Lab edge cases: special characters**
    _As a maintainer, I want to confirm that selectors containing apostrophes or double quotes are correctly escaped in the generated command string._

11. **UC-11 — Lab edge cases: sensitive data redaction**
    _As a maintainer, I want to confirm that HTTP responses containing `password`, `token`, or similar fields are redacted in the generated interceptor body._

---

## Acceptance criteria

### Widget (01-widget.cy.ts)

- [ ] AC-01: `<lib-e2e-recorder>` is present in the DOM after visiting `http://localhost:5000`.
- [ ] AC-02: The recording toggle button (`[data-action="toggle"]`) is reachable via `.shadow()` and is visible.
- [ ] AC-03: Clicking `[data-action="toggle"]` starts recording; clicking it again stops recording.
- [ ] AC-04: The commands panel (`[data-action="commands"]`) opens the previsualizer section.
- [ ] AC-05: The configuration button (`[data-action="config"]`) opens the Swal2 configuration modal (visible in the main document).
- [ ] AC-06: The help button (`[data-action="help"]`) opens the help panel inside the Shadow DOM.

### Selector strategies (02-selectors.cy.ts)

- [ ] AC-07: After starting recording and clicking `[data-cy="btn-click"]`, the previsualizer command list contains a string matching `cy.get('[data-cy="btn-click"]').click()`.
- [ ] AC-08: After clicking `[data-testid="testid-btn"]`, the command list contains `cy.get('[data-testid="testid-btn"]').click()`.
- [ ] AC-09: After clicking `[aria-label="Botón accesible"]`, the command list contains `cy.get('[aria-label="Botón accesible"]').click()`.
- [ ] AC-10: After clicking `#submit-order`, the command list contains `cy.get('#submit-order').click()`.
- [ ] AC-11: After clicking `#mat-tab-0` or `#cdk-overlay-1`, the command list does NOT contain `cy.get('#mat-tab-0')` or `cy.get('#cdk-overlay-1')` (framework ids are ignored).
- [ ] AC-12: After a double-click on `[data-cy="btn-dblclick"]`, the command list contains `.dblclick()`.
- [ ] AC-13: After a right-click on `[data-cy="btn-rightclick"]`, the command list contains `.rightclick()`.

### HTTP interception (03-http.cy.ts)

- [ ] AC-14: After clicking `[data-cy="btn-load-products"]` while recording, the interceptors section contains a `cy.intercept('GET', …/api/products…)` entry.
- [ ] AC-15: After clicking `[data-cy="btn-load-detail"]`, the interceptors section contains a `cy.intercept('GET', …/api/products/1…)` entry.
- [ ] AC-16: After filling `[data-cy="input-product"]` and `[data-cy="input-qty"]` and clicking `[data-cy="btn-submit-order"]`, the interceptors section contains a `cy.intercept('POST', …/api/orders…)` entry.
- [ ] AC-17: After clicking `[data-cy="btn-update-order"]`, the interceptors section contains a `cy.intercept('PUT', …/api/orders…)` entry.
- [ ] AC-18: After clicking `[data-cy="btn-delete-order"]`, no DELETE interceptor is added (DELETE is not monitored by the extension).

### Form inputs (04-forms.cy.ts)

- [ ] AC-19: Checking `[data-cy="chk-terms"]` while recording generates a `.check()` command.
- [ ] AC-20: Unchecking `[data-cy="chk-promo"]` (pre-checked) while recording generates an `.uncheck()` command.
- [ ] AC-21: Selecting a radio `[data-cy="radio-express"]` generates a `.check()` command.
- [ ] AC-22: Selecting an option in `[data-cy="category-filter"]` generates a `.select(…)` command.
- [ ] AC-23: Typing in `[data-cy="search-input"]` generates a `.clear().type(…)` command.
- [ ] AC-24: Typing in `[data-cy="textarea-notes"]` generates a `.clear().type(…)` command.

### Lab edge cases (05-lab.cy.ts)

- [ ] AC-25: Clicking `[data-cy="o'brien-btn"]` generates a command where the apostrophe is correctly escaped (does not break the `cy.get(…)` string syntax).
- [ ] AC-26: Clicking the button with `data-cy='say "hello"'` generates a command where the double quotes are correctly escaped.
- [ ] AC-27: Typing `it's a valid input` into `[data-cy="apostrophe-input"]` generates a `.type(…)` command with the text correctly escaped.
- [ ] AC-28: After clicking `[data-cy="btn-sensitive-get"]`, the interceptor body in the command list does not contain the literal token value (it is replaced with a redaction placeholder).
- [ ] AC-29: After clicking `[data-cy="btn-sensitive-post"]`, the interceptor body does not contain the literal password or access_token value.

---

## Public API changes

None. These are test files added to `ejemplo/cypress/e2e/extension/` and do not touch the library source.

The Cypress config (`ejemplo/cypress.config.ts`) must be updated to enable `includeShadowDom: true`.

---

## Out of scope

- IndexedDB persistence verification (requires complex async window access — deferred).
- File system output verification (saving generated tests to disk — requires a Cypress Node plugin — deferred).
- The Smart Selector Picker overlay (no-selector elements) — the picker requires manual selection of a suggested selector, which is difficult to automate reliably and is already covered by unit tests.
- Login setup panel tests — covered by unit tests in `specs/components/configuration.spec.ts`.
- The `lib-e2e-advanced-test-editor` and `lib-e2e-file-preview` components — these depend on filesystem access and are out of scope.
- Testing the Cypress runner CLI (`lib-e2e-cypress-runner`).

---

## Implementation notes

### Shadow DOM access pattern

All extension internals are inside Shadow DOM. Cypress accesses them consistently:

```ts
// Level 1: recorder shadow
cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').click()

// Level 2: nested custom element shadow (previsualizer)
cy.get('lib-e2e-recorder').shadow()
  .find('lib-e2e-test-previsualizer').shadow()
  .find('[data-ref="cmds"]')
  .should('contain.text', "cy.get('[data-cy=\"btn-click\"]').click()")
```

Enable `includeShadowDom: true` in `cypress.config.ts` globally to simplify traversal.

### Shared commands / helpers

A `cypress/support/recorder.ts` helper should expose:

```ts
// Start recording and open the commands panel
Cypress.Commands.add('startRecording', () => {
  cy.get('lib-e2e-recorder').shadow().find('[data-action="toggle"]').click()
  cy.get('lib-e2e-recorder').shadow().find('[data-action="commands"]').click()
})

// Assert a command string appears in the previsualizer
Cypress.Commands.add('commandShouldContain', (text: string) => {
  cy.get('lib-e2e-recorder').shadow()
    .find('lib-e2e-test-previsualizer').shadow()
    .find('[data-ref="cmds"]')
    .should('contain.text', text)
})

// Assert an interceptor string appears in the interceptors section
Cypress.Commands.add('interceptorShouldContain', (text: string) => {
  cy.get('lib-e2e-recorder').shadow()
    .find('lib-e2e-test-previsualizer').shadow()
    .find('[data-section="interceptors"]')
    .should('contain.text', text)
})
```

### Test isolation

Each test file navigates to its target page in `beforeEach` and reloads to reset extension state. No shared state between files.

### Running the suite

The example app must be running before Cypress can execute these tests:

```bash
cd ejemplo && npm run dev   # starts all 4 MFEs concurrently
npx cypress open            # or: npx cypress run
```

---

## Open questions

- [ ] Q1: Should the extension e2e suite be added to a CI step in the future, or remain a manual-run suite? (Recommendation: manual for now, CI later once the example app has a stable dev-server start command.)
- [ ] Q2: Does the previsualizer render commands incrementally (one per event) or only after stopping recording? This affects whether we need `.should('contain.text', …)` with retry or a stop-recording step first.

---

## History

| Date       | Change          |
|------------|-----------------|
| 2026-07-23 | Initial draft   |
| 2026-07-23 | Implementation started — 5 test files + custom commands written |
