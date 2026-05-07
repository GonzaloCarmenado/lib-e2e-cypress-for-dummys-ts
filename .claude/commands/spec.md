# /spec — Generate a spec document

Generate a Spec-Driven Development document for the feature or change described in `$ARGUMENTS`.

## Steps

1. Determine the next sequential number by listing files in `docs/specs/` and finding the highest `NNN` prefix.
2. Derive a kebab-case filename from the feature name (e.g., `003-http-monitor-xhr.md`).
3. Fill in the spec template (`docs/specs/_template.md`) with:
   - **Context**: Why this feature is needed and what the current state is.
   - **Use cases**: Numbered UC-NN entries written as user stories.
   - **Acceptance criteria**: Checkboxes derived from the use cases.
   - **Public API changes**: Any new exports, component attributes, or events.
   - **Out of scope**: Explicit exclusions to prevent scope creep.
4. Write the file to `docs/specs/NNN-feature-name.md`.
5. Report the file path and a short summary of what was captured.

Do not start any implementation. The spec must be reviewed before coding begins.
