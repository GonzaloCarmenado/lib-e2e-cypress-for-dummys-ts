# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] — 2026-07-14

First stable release. The public API surface (`src/index.ts` exports) is now
frozen under semantic versioning. Backed by the general audit in
`docs/audits/2026-07-14-audit.md` (spec 021).

### Added
- `LICENSE` file (MIT).
- `CHANGELOG.md` (this file).
- Broader credential redaction: `redactSensitiveFields` now matches `apiKey`,
  `pwd`, `sessionId`, `idToken`, `clientSecret`, `privateKey`, `pin`, `otp`,
  `ssn`, card fields and more (separator/case-insensitive), while avoiding false
  positives like `author` / `normalKey`.
- Tests for the login-setup save handler and issue-tracker DOM wiring
  (`configuration.ts` coverage 78% → 85%).

### Changed
- **Public export surface curated** (see Breaking below).

### Fixed
- Escaping gaps that could produce invalid generated Cypress code: the selector
  in `inferAssertionCommand` and the interceptor URL wildcard / fixture path are
  now single-quote escaped.
- Hardcoded Spanish strings in the login-setup dialog now go through i18n
  (`CONFIG.LOGIN_SETUP_FUNCTIONS_DETECTED`, `CONFIG.LOGIN_SETUP_BLOCK_ASSIGN`,
  added to all 5 languages).

### Breaking
- `src/index.ts` now exports an explicit allowlist. Internal singletons,
  internal constants, low-level modal/drag helpers and the test-only
  `_resetHttpMonitorState` are no longer re-exported from the package root.

## [0.10.0] — 2026-07-14

### Added
- Record `<input type="file">` uploads as `.selectFile('cypress/fixtures/…')`,
  with in-memory capture of file bytes and auto-copy via the File System Access
  API on Save-and-Edit (spec 019).
- Manual npm release workflow (`.github/workflows/release.yml`) using the
  `NPM_TOKEN` repository secret (spec 020).

### Changed
- Internal recorder refactor: extracted `ensurePopupDimensions`,
  `injectAssertionBuilder`, `mountFilesystemSetupContent`, `mountComponentInSwal`
  and `openSwalDialog`; `lib-e2e-recorder.ts` shrank from 1053 to ~940 lines
  (spec 018).

## [0.9.0]

### Changed
- **Breaking:** `Subject<T>` (`src/utils/subject.ts`) is no longer re-exported
  from the package root — it is an internal reactive primitive.

## [0.1.0 – 0.8.x]

Initial feature set (specs 001–016): smart selector picker, test notes, export
selection, merge-on-import, headless runner, cross-app recording continuity,
draggable widget, assertion capture, richer interactions, in-app help,
HTTP → fixtures, ticket reference & grouping, login setup template, example
microfrontend showcase, security & quality audit fixes (spec 017).

[Unreleased]: https://github.com/GonzaloCarmenado/lib-e2e-cypress-for-dummys-ts/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/GonzaloCarmenado/lib-e2e-cypress-for-dummys-ts/compare/v0.10.0...v1.0.0
[0.10.0]: https://github.com/GonzaloCarmenado/lib-e2e-cypress-for-dummys-ts/releases/tag/v0.10.0
