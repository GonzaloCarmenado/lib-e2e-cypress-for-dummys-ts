# 020 — GitHub Actions: CI + manual npm release

> **Status:** Done
> **Date:** 2026-07-14
> **Author:** Gonzalo

---

## Context and motivation

The repository already has a basic CI workflow (`.github/workflows/ci.yml`) that
runs lint + build + test on every push/PR to `main`. Two gaps remain:

1. **No test-coverage gate in CI** — `test:coverage` runs but its exit code is not
   enforced (thresholds live in `vitest.config.ts` but are only checked when the
   command exits non-zero, which it does; the existing workflow already runs it, so
   this is already covered).
2. **No automated npm publish** — every release is done manually from a developer
   machine, requiring a local npm token.  Publishing from a developer machine means
   the token must be shared or the release can only be done by whoever has access.

This spec covers splitting CI from release and introducing a **manual** publish
workflow that uses a repository secret so the token is never visible in logs or
source code.

---

## Use cases

1. **UC-01 — Developer pushes to main / opens a PR**
   CI runs automatically: lint → build → test (with coverage gate). No publish
   occurs. Green = safe to merge.

2. **UC-02 — Maintainer triggers a release manually**
   From the GitHub Actions UI (workflow_dispatch), the maintainer runs the
   `release` workflow. It re-validates the code, then publishes to npm via
   Trusted Publishing (OIDC) — no long-lived token is involved.
   *(Updated 2026-10-28: originally used an `NPM_TOKEN` secret; it expired and
   every publish failed with `E404 PUT`. Switched to OIDC.)*

3. **UC-03 — Token is not in source**
   The repository is public. The npm token must live exclusively in GitHub
   repository secrets (`Settings → Secrets and variables → Actions`). No token,
   URL, or credential appears in any committed file.

---

## Acceptance criteria

### CI workflow (`ci.yml`)

- [x] AC-01: Triggers on `push` to `main` and on any `pull_request` targeting `main`.
- [x] AC-02: Steps in order: checkout → setup-node (v20, npm cache) → `npm ci` →
  `npm run lint` → `npm run build` → `npm test` → `npm run test:coverage`.
- [x] AC-03: If any step exits non-zero, the workflow fails and subsequent steps
  are skipped (default GitHub Actions behaviour — no `continue-on-error`).
- [x] AC-04: Does NOT publish to npm under any circumstance.

### Release workflow (`release.yml`)

- [x] AC-05: Trigger is `workflow_dispatch` only (manual, no automatic trigger).
- [x] AC-06: Steps in order: checkout → setup-node (v24, npm cache, registry
  `https://registry.npmjs.org/`) → `npm ci` → `npm run lint` → `npm run build` →
  `npm test` → `npm run test:coverage` → `npm publish --access public`.
- [x] AC-07: The workflow declares `permissions: id-token: write` so npm
  (>= 11.5.1, bundled with Node 24) can authenticate via OIDC. No
  `NODE_AUTH_TOKEN` / `NPM_TOKEN` is used.
- [x] AC-08: `setup-node` uses `registry-url: https://registry.npmjs.org/`.
- [x] AC-09: The workflow file contains no hardcoded credentials, registry tokens,
  or user-specific values.

### Security

- [x] AC-10: Running `git grep -i "npm_\|_authToken\|//registry"` on the committed
  workflow files returns no matches (no token leaked in source).
- [x] AC-11: The trusted publisher must be configured manually on npmjs.com
  (package → Settings → Trusted Publisher → GitHub Actions, repo
  `GonzaloCarmenado/lib-e2e-cypress-for-dummys-ts`, workflow `release.yml`).
  Out of scope for the workflow itself.

### Quality gates

- [x] AC-12: Both workflow files pass `yamllint` / GitHub's own YAML parser
  (no syntax errors).
- [x] AC-13: `npm run build` and `npm test` pass locally before the workflows
  are committed.

---

## Workflow file layout

```
.github/
  workflows/
    ci.yml       # push + PR validation (already exists — update in place)
    release.yml  # manual npm publish (new)
```

---

## Trusted publisher setup (manual, out of scope for code)

Before the release workflow can run, a maintainer must, on npmjs.com:

1. Open the package → **Settings** → **Trusted Publisher**.
2. Choose **GitHub Actions**; owner `GonzaloCarmenado`, repository
   `lib-e2e-cypress-for-dummys-ts`, workflow filename `release.yml`.
3. Save.

The legacy `NPM_TOKEN` repository secret is no longer used and can be deleted.

---

## Out of scope

- Automatically bumping the version on release (stays a manual `npm version` step).
- Creating a GitHub Release / git tag from the workflow.
- Publishing to a private registry.
- Caching `node_modules` beyond what `actions/setup-node` provides via `cache: npm`.
- Matrix builds (Node 18/20/22) — single Node 20 target is sufficient.

---

## Open questions

- [x] Q1: Should the release workflow also bump the version automatically?
  **Decision:** No — the developer bumps `package.json` + `src/index.ts` locally
  and commits before triggering the workflow. Keeps the version bump visible in
  git history and under human control.

- [x] Q2: Should the release workflow create a git tag?
  **Decision:** Out of scope for now. Can be added later as a follow-up.

---

## History

| Date       | Change        |
|------------|---------------|
| 2026-07-14 | Initial draft |
