# CLAUDE.md — lib-e2e-cypress-for-dummys

Development rules for this project. Claude must follow all of these without exception.

---

## Stack

- Pure TypeScript library (`"type": "module"`), zero Angular
- Build: `tsup` (ESM + CJS + `.d.ts`), external: `idb`, `sweetalert2`
- Tests: `vitest` + `jsdom` + `fake-indexeddb`
- Custom Elements / Shadow DOM, no framework
- i18n: 5 languages (es/en/fr/it/de) via `TranslationService`

---

## Spec-Driven Development (SDD)

Every significant feature or change must have a spec document **before** implementation starts.

### When a spec is required

- New features or components
- API changes (public exports, constructor signatures, event names)
- Breaking changes
- Multi-step refactors

Minor bug fixes and small isolated patches do not need a spec.

### Spec format

Location: `docs/specs/NNN-feature-name.md` (e.g., `001-http-monitor.md`)

Use the template at `docs/specs/_template.md`. Every spec must include:
- Context and motivation
- Use cases (numbered)
- Acceptance criteria (checkboxes)
- Out of scope
- Open questions

Specs are **living documents** — update them when decisions change. Never delete old specs.

---

## Test-Driven Development (TDD)

1. Write failing unit tests first, based on the use cases in the spec.
2. Write the minimum implementation to make tests pass.
3. Refactor, keeping tests green.

### Coverage gate

Minimum 80% coverage on lines, functions, branches, and statements.

- If coverage drops below 80% after your changes, **stop and notify the user** before proceeding.
- Never comment out tests, use `.skip`, or write assertions that trivially pass to inflate coverage.
- `vitest run --coverage` must exit 0 before a task is closed.

### Test file location

`specs/<name>.spec.ts` — one spec file per service or utility module being tested.

---

## Code quality gates

All three must pass before closing any task:

```
npm run lint        # ESLint — zero errors
npm test            # vitest run — all tests pass
npm run build       # tsup — compiles cleanly
```

The pre-commit hook runs `lint-staged` (ESLint on staged `.ts` files).
The pre-push hook runs `npm test` and `npm run test:coverage`.

---

## Internationalization (i18n)

**No static strings in component code or templates.** Every user-visible string must go through `TranslationService`.

1. Add the key to all 5 translation files: `src/i18n/es.ts`, `en.ts`, `fr.ts`, `it.ts`, `de.ts`.
2. Use `this.t('SECTION.KEY')` in components, or the `t` parameter in template functions.
3. If you cannot produce a quality translation for a language, use the Spanish value and add a `// TODO: translate` comment. Never leave a key missing from any language file.

---

## Commits (Conventional Commits)

Commits must be atomic — one logical change per commit.

Format: `type(scope): short description`

| Type       | When to use                                  |
|------------|----------------------------------------------|
| `feat`     | New feature or behaviour visible to the user |
| `fix`      | Bug fix                                      |
| `test`     | Adding or updating tests only                |
| `docs`     | Documentation only                           |
| `refactor` | Code restructure, no behaviour change        |
| `chore`    | Build, config, tooling changes               |
| `style`    | Formatting, no logic change                  |

Examples:
```
feat(http-monitor): intercept XHR requests and generate cy.intercept commands
test(recording-service): add coverage for pauseRecording edge cases
fix(configuration): prevent duplicate language entries on re-render
docs(readme): document showToast API and parameters
```

---

## README updates

Every commit that adds, removes, or changes user-visible functionality **must** include a corresponding update to `README.md` in the same commit.

User-visible means: public API, component attributes/events, configuration options, new UI features.

---

## Architecture conventions

### File layout

```
src/
  components/<name>/
    <name>.ts           # Custom Element class
    <name>.styles.ts    # CSS — exported as string constant or function
    <name>.template.ts  # HTML render functions — pure, no side effects
  services/             # Business logic classes
  utils/                # Pure utility functions
  models/               # TypeScript types and interfaces
  i18n/                 # Translation files (one per language)
```

### Templates

- Template functions are pure: `renderX(state, t) => string`
- No DOM access, no `document`, no `window` inside template functions
- Escape all user-supplied content with `escHtml`/`escAttr` from `src/utils/html.utils.ts`

### Styles

- Static CSS → export a `const` string
- Dynamic CSS (values depend on state) → export a function `getStyles(state): string`

### Services

- Stateful services use `Subject<T>` from `src/utils/subject.ts`
- Services expose snapshot methods (`getXSnapshot()`) and subscription methods (`onXChange(fn)`)

---

## Definition of Done checklist

Before marking any task complete, verify:

- [ ] Spec document exists in `docs/specs/` (if required)
- [ ] Tests written first (TDD order respected)
- [ ] `npm run lint` — zero errors
- [ ] `npm test` — all tests pass
- [ ] `npm run test:coverage` — ≥ 80% on all metrics
- [ ] `npm run build` — clean compile
- [ ] All new strings go through i18n (all 5 languages updated)
- [ ] `README.md` updated if public API or UI changed
- [ ] Commits are atomic and follow Conventional Commits format
