# 021 — General audit: security, architecture & 1.0.0 readiness

> **Status:** Done
> **Date:** 2026-07-14
> **Author:** Gonzalo

---

## Context and motivation

The library has reached feature maturity (specs 001–020) and is published at
`0.10.0`. Before committing to a `1.0.0` major release — which signals API
stability and production-readiness under semver — we want a full, independent
audit across five dimensions:

1. **Security & privacy** — the library records user interactions, HTTP traffic
   (including request/response bodies), and writes files to disk via the File
   System Access API. It handles potentially sensitive data (auth tokens,
   credentials, PII). Any leak, injection, or unsafe write is a blocker.
2. **Vulnerabilities & supply chain** — `npm audit` state, dependency freshness,
   and whether any advisory affects the shipped bundle (runtime) vs. tooling only.
3. **Architecture & conventions** — adherence to the rules in `CLAUDE.md`
   (file layout, pure templates, services with `Subject<T>`, i18n discipline,
   escaping) and internal consistency.
4. **Code quality** — dead code, error handling, type-safety escape hatches
   (`any`, `!`, `as unknown as`), duplicated logic, and test-coverage blind spots.
5. **Public API surface** — is the exported API coherent, documented, and stable
   enough to freeze for a 1.0.0 contract?

The output of this spec is an **audit report** (`docs/audits/2026-07-14-audit.md`)
that classifies every finding by severity. We analyse it together, resolve the
blockers, then decide whether to cut `1.0.0`.

---

## Use cases

1. **UC-01 — Maintainer reviews security posture**
   A single report lists every place user-supplied or sensitive data is read,
   stored, escaped, or written, with a verdict on each.

2. **UC-02 — Maintainer decides on 1.0.0**
   The report ends with a go / no-go recommendation and, if no-go, the exact
   list of blockers that must be closed first.

3. **UC-03 — Findings become actionable work**
   Each finding has: severity, location (`file:line`), why it matters, and a
   proposed fix. High/critical findings get fixed under this spec; low ones may
   be deferred to the backlog with a note.

---

## Acceptance criteria

### Audit report

- [x] AC-01: `docs/audits/2026-07-14-audit.md` exists and covers all five
  dimensions above.
- [x] AC-02: Every finding is classified `critical` / `high` / `medium` / `low` /
  `info` and includes a `file:line` reference where applicable.
- [x] AC-03: The report separates **runtime** (shipped bundle) vulnerabilities
  from **devDependency/tooling** ones — only runtime issues can block 1.0.0.
- [x] AC-04: The report includes an explicit **1.0.0 go/no-go** section with a
  blocker list.

### Findings resolution

- [x] AC-05: All `critical` and `high` runtime findings are either fixed (with a
  commit + test) or explicitly accepted with a documented rationale.
- [x] AC-06: Any fix respects existing quality gates: `npm run lint`,
  `npm test`, `npm run build`, coverage ≥ 80%.
- [x] AC-07: `medium`/`low` findings that are not fixed are recorded in
  `docs/ROADMAP.md` backlog with a reference to this audit.

### Security-specific checks

- [x] AC-08: Confirm all user-supplied content reaching generated code or the DOM
  is escaped (`escHtml`/`escAttr`/`escapeSingleQuotes`/`escapeCssAttrValue`).
- [x] AC-09: Confirm no sensitive data (tokens, passwords, headers) is persisted
  or logged without the existing redaction path being applied.
- [x] AC-10: Confirm FSAA writes are constrained to the user-chosen directory and
  cannot traverse outside it (path-injection via filenames).

### 1.0.0 decision

- [x] AC-11: A documented decision (go → bump to 1.0.0 under a follow-up; no-go →
  blocker list) is recorded in this spec's History and the audit report.

---

## Out of scope

- Penetration testing against a live deployment (this is a browser library, not
  a service).
- Rewriting architecture — findings propose fixes, not redesigns.
- Upgrading major versions of `idb` / `sweetalert2` unless an advisory requires it.
- Performance profiling / bundle-size optimisation (separate concern).

---

## Method

The audit is produced by independent reviewers (one per dimension) reading the
actual source, cross-checked against `CLAUDE.md` and the shipped `dist/` surface.
Findings are de-duplicated and severity-ranked before landing in the report.
No fixes are applied until the report is reviewed together.

---

## Open questions

- [x] Q1: Do the devDependency advisories (`ws`, cypress chain) need addressing
  before 1.0.0? **No** — tooling-only, never shipped to consumers. Backlog.
- [x] Q2: Is the current public API the surface we want to freeze? **No, not
  as-was** — curated to an explicit allowlist (B2) before freezing.

---

## Decision

**GO for 1.0.0.** All four blockers (B1–B4) and the should-fix set (F1–F3 +
escaping LOWs) are resolved; gates green (1083 tests, 94.65% coverage). The
public surface is now an intentional allowlist safe to freeze under semver.
Deferred items (F4/F5/F6 + LOW polish) are non-blocking and tracked in the
ROADMAP backlog. The 1.0.0 version bump + publish is the follow-up step.

---

## History

| Date       | Change        |
|------------|---------------|
| 2026-07-14 | Initial draft |
| 2026-07-14 | Audit report produced; blockers + should-fix resolved; GO for 1.0.0 |
