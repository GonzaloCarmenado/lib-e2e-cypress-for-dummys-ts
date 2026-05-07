# /check — Full quality gate

Run the full Definition of Done quality gate and report results.

## Steps

Run these commands sequentially and collect their exit codes and output:

```
npm run lint
npm test
npm run test:coverage
npm run build
```

For each command report: PASS or FAIL, and if FAIL show the relevant error output.

At the end print a summary table:

| Gate              | Result |
|-------------------|--------|
| ESLint            | ✓ / ✗  |
| Tests             | ✓ / ✗  |
| Coverage (≥80%)   | ✓ / ✗  |
| Build             | ✓ / ✗  |

If all pass: "All gates passed. Ready to commit."
If any fail: list what must be fixed before committing.

Do not fix anything automatically — only report. The developer decides what to fix.
