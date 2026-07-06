# Spec 014 — Ticket Reference & Grouping

## Status: Done ✅

## Context and motivation

The library generates Cypress tests that are often tied to specific Jira tickets, GitHub issues, or other issue-tracker items. There is currently no way to associate a saved test with a ticket, which breaks traceability between QA and development work.

This spec adds a lightweight, browser-only ticket reference: a free-text ticket ID stored with the test, optionally rendered as a clickable link, and optionally used to group tests in the editor. No auth, no backend calls, no CORS.

## Use cases

1. **UC1 — Tag a test with a ticket ID when saving**: the save dialog shows an optional "Ticket" field; the user types `PROJ-123` and saves.
2. **UC2 — Ticket rendered as file comment**: when the test is output as Cypress code the ticket ID appears as a comment above the `it()` block, e.g. `// Ticket: PROJ-123`.
3. **UC3 — Clickable link in the test list**: if a base URL is configured in Settings, the ticket ID is rendered as a link that opens the issue in a new tab.
4. **UC4 — Group tests by ticket**: the test editor has a "Group by ticket" toggle; tests are grouped under their ticket header, ungrouped tests appear under "No ticket".
5. **UC5 — Configure issue tracker in Settings**: Settings panel has an "Issue tracker" card where the user can enable/disable the feature, choose a provider preset (Jira, GitHub, GitLab, Azure DevOps, Bitbucket, Custom), and enter the base URL.
6. **UC6 — Invalid ticket ID warns but never blocks**: if the ID doesn't match the expected pattern for the selected provider, a warning is shown but saving still proceeds.

## Acceptance criteria

- [x] `src/models/issue-tracker.model.ts` exports `IssueTrackerProvider`, `IssueTrackerPreset`, `ISSUE_TRACKER_PRESETS` (5 providers + custom), and `IssueTrackerConfig`.
- [x] `src/utils/ticket.utils.ts` exports `buildTicketUrl`, `buildTicketComment`, `isValidTicketId`.
- [x] `TestRecord` has an optional `ticketId?: string` field.
- [x] `PersistenceService.insertTest` accepts an optional `ticketId` parameter.
- [x] `SaveTestElement` emits `ticketId` in the `savetest` / `saveandexport` detail.
- [x] `ConfigurationElement` has an "Issue tracker" section with enable toggle, provider select, and base URL field.
- [x] `TestEditorElement` shows a ticket link (if configured) next to each test and supports group-by-ticket view.
- [x] `it()` title is **never** modified — ticket appears as a file comment.
- [x] All 5 i18n files contain the new keys.
- [x] All quality gates pass: lint 0 errors, all tests green, coverage ≥ 80%.

## Out of scope

- Any server-side or authenticated Jira/GitHub API calls.
- Auto-fetching ticket title or status.
- Embedding ticket ID in the `it()` description string.
- Integration with `generateDescribe()` (tickets are per-test metadata, not suite-level).

## Open questions

_None — all decisions locked._
