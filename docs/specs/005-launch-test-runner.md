# 005 — Launch Test Runner

> **Status:** Implemented
> **Date:** 2026-06-19
> **Author:** Gonzalo

---

## Context and motivation

The file editor (`file-preview`) shows a **"▶ Lanzar test"** button. Today it is a
dead stub:

```ts
async launchTest(specPath?) {
  const path = specPath ?? `cypress/e2e/${this.fileName}`;
  const response = await fetch('http://localhost:8123/run-test', {
    method: 'POST', headers: {...}, body: JSON.stringify({ specPath: path }),
  });
  await response.json();   // parsed and discarded
}
```

Nothing in the project serves `http://localhost:8123/run-test`, the port/URL are
hardcoded, the click is fire-and-forget (no `await`/`catch`), the response is
thrown away, and there is **no feedback whatsoever** — so it fails silently and
appears to do nothing.

The goal is to make it real: from the editor, the QA engineer runs the **single
spec they are editing** through Cypress in **headless / background** mode (the
project's `cypress run --spec <file>` command — *not* the Cypress GUI) and sees
the **result (pass/fail + output) inside the widget**. This makes the
record → tweak → run loop very fast.

Two hard constraints from the product owner:

1. Running Cypress requires a local **Node** process (a "runner"); the browser
   cannot spawn it. So the feature talks to a local runner over HTTP.
2. It only makes sense when the app under test runs **locally**. If the widget is
   loaded on a deployed environment (pruebas/stg/prod), launching a local Cypress
   run is meaningless. The button must therefore be **enabled only when the page
   is served from localhost**, and otherwise be disabled with a hint like
   *"muévelo a local para poder probar"*.

---

## Use cases

1. **UC-01 — Run the spec I'm editing, headless**
   As a QA engineer editing a `.cy.ts` file locally, I want to click "Lanzar test"
   and have Cypress run *only that spec* in the background (no GUI) so that I get a
   fast pass/fail without switching tools.

2. **UC-02 — See the result and the output**
   As a QA engineer, I want to see whether the run passed or failed and the run
   output (so I can read the failure) inside the editor, without opening a terminal.

3. **UC-03 — Only offer it where it makes sense**
   As a QA engineer, I want the button disabled (with an explanatory hint) when I'm
   viewing the widget on a non-local environment, so I don't trigger meaningless runs.

4. **UC-04 — Know when there is no runner**
   As a QA engineer, I want a clear message when no local runner is reachable
   (instead of nothing happening), so I know I need to start it.

5. **UC-05 — Don't block the UI**
   As a QA engineer, I want the editor to show a "running…" state while the spec
   runs and then update with the result, without freezing.

---

## Acceptance criteria

- [x] AC-01: The launch button is **enabled only** when `window.location.hostname`
      is a local host (`localhost`, `127.0.0.1`, `::1`, or empty/`file:`).
- [x] AC-02: When not local, the button is disabled and a hint label
      (`FILE_PREVIEW.LAUNCH_LOCAL_ONLY`, e.g. "muévelo a local para poder probar")
      is shown near it.
- [x] AC-03: Clicking sends `POST {runnerUrl}` with body `{ specPath }`, where
      `runnerUrl` defaults to `http://localhost:8123/run-test` and is configurable.
- [x] AC-04: While the request is in flight the button shows a **running** state
      (disabled + label) and cannot be re-triggered.
- [x] AC-05: On success the editor shows a **result panel** with pass/fail status
      and the runner's output text.
- [x] AC-06: If the runner is unreachable (`fetch` rejects / non-OK), the user sees
      a clear error (toast + result panel message); **no unhandled rejection, no
      silent failure** — `launchTest` is wrapped in try/catch.
- [x] AC-07: If the run completes but tests fail, the panel shows a **failed**
      state and the output; success vs failure is derived from the runner response
      (`{ success: boolean }`).
- [x] AC-08: The runner executes the project's Cypress in **headless** mode for the
      given spec only (`cypress run --spec <path>`), in the background (no GUI), and
      responds with JSON `{ success, exitCode, output }`.
- [x] AC-09: The runner URL/port is configurable (not hardcoded in the component).
- [x] AC-10: New user-visible strings exist in all 5 i18n files.
- [x] AC-11: A runner **CLI is shipped as a `bin`** in the package so the feature
      works end-to-end with one command (`npx lib-e2e-cypress-runner`), documented in the README.
- [x] AC-12: Coverage stays ≥ 80% (runner.ts 98.9%, host.utils 100%, file-preview 97%);
      the browser side is unit-tested with `fetch` mocked (success, failure, unreachable,
      non-local gating) and the runner with `spawn` mocked + a live ephemeral server.

---

## Public API changes

```typescript
// file-preview (FilePreviewElement)
// NEW: configurable runner endpoint (attribute/property), default kept.
runnerUrl: string;            // default 'http://localhost:8123/run-test'

// launchTest gains result handling; signature unchanged but now returns/render-driven:
launchTest(specPath?: string): Promise<void>;   // try/catch + updates result state

// NEW host gating helper (utils), reused by the template's disabled/hint logic:
export function isLocalHost(hostname: string): boolean;

// Runner HTTP contract (local Node process):
//   POST /run-test  { specPath: string }
//   200 { success: boolean; exitCode: number; output: string }
//   (non-2xx or connection error → treated as "runner unavailable")
```

New i18n keys (illustrative): `FILE_PREVIEW.LAUNCH_LOCAL_ONLY`,
`FILE_PREVIEW.LAUNCH_RUNNING`, `FILE_PREVIEW.LAUNCH_PASSED`,
`FILE_PREVIEW.LAUNCH_FAILED`, `FILE_PREVIEW.LAUNCH_NO_RUNNER`.

---

## Out of scope

- Running the **full suite** or multiple specs at once (single spec only).
- The Cypress **interactive GUI** / `cypress open`.
- Watch mode / re-run on save.
- CI integration, parallelization, sharding.
- Authentication/authorization on the runner (it is a localhost dev tool).
- Editing the project's Cypress config; the runner uses whatever the project has.

---

## Implementation notes

- **Local gating**: derive once in the component from `window.location.hostname`
  via `isLocalHost()`; the template renders the button `disabled` + hint when false.
  This is the only place `window` is read (kept in the component, not the template).
- **Result panel**: add a results area to `file-preview` (below the editor or in the
  blocks panel) showing status badge + a `<pre>` of the output. Drive it from a small
  state machine: `idle | running | passed | failed | error`.
- **No silent failure**: wrap the `fetch` in try/catch; map connection errors to the
  `error`/"no runner" state and a toast.
- **Runner**: a tiny Node HTTP server shipped as a `bin` in this package
  (`npx <pkg>-runner`). On `POST /run-test` it runs the configured Cypress command
  for the given spec (default `npx cypress run --spec {spec}`, headless) and returns
  `{ success, exitCode, output }`. Node-only entry point, separate from the browser
  bundle (built as its own tsup target); uses only `node:*` builtins + `child_process`.
- The existing `launchTest` already builds `cypress/e2e/${fileName}`; spec-path
  resolution for nested folders needs revisiting (Q5).

---

## Open questions

- [x] Q1: **Runner distribution** → **Resolved: ship a `bin` CLI in this package**
      (Option A). Making each user paste/maintain a server file is error-prone;
      plug & play wins. The bin is a separate Node-only entry point — the browser
      bundle stays framework-agnostic and never imports it.
- [x] Q2: **Command fixed vs configurable** → **Resolved: configurable**, default
      `npx cypress run --spec {spec}` with `{spec}` substituted; runner accepts an
      override (flag/env/config).
- [x] Q3: **Port** → **Resolved: default `8123`, configurable** via a CLI flag on
      the runner and the `runnerUrl` property/attribute on the widget.
- [x] Q4: **Streaming vs await** → **Resolved: await + final output for v1**;
      live streaming (SSE) is a future enhancement.
- [x] Q5: **Spec path resolution** → **Resolved**: the browser sends the file name;
      `runner.toSpecGlob()` turns a bare name into a `**/<name>` glob so nested specs
      match (a value with a slash is used as-is). Exact relative-path resolution from
      the editor tree can refine this later.
- [x] Q6: **Security** → **Resolved with mitigations**: runner binds to `127.0.0.1`
      only, passes the spec as **argv (no shell interpolation)**, restricts specs to
      the configured project dir, and is documented as a **dev-only** tool.

---

## History

| Date       | Change                                                             |
|------------|--------------------------------------------------------------------|
| 2026-06-19 | Initial draft                                                      |
| 2026-06-19 | Review: Q1 ship a bin CLI, Q2 configurable command, Q3 port 8123 configurable, Q4 await+final output, Q6 security mitigations; Q5 left to confirm during implementation |
| 2026-06-22 | Implemented in two phases: file-preview browser side (gating, states, result panel) + the `lib-e2e-cypress-runner` bin; Q5 resolved (glob); status → Implemented |
