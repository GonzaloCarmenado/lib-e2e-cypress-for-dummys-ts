/**
 * Converts spy-style `cy.intercept(...)` strings to fixture-stub form when a
 * matching fixture exists, and simplifies the corresponding `cy.wait(...)` commands
 * by stripping inline body-validation callbacks (the data is now stubbed).
 *
 * These conversions are applied at save-and-export time (spec 012) so that:
 *  - recording always uses spy interceptors (no decision about save mode needed);
 *  - fixture stubs are only emitted when the user clicks "Save and Edit" AND the
 *    Cypress folder has write permission.
 */

/**
 * For each spy interceptor whose alias has a matching fixture, inserts the
 * `{ fixture: '<alias>.json' }` response body.
 *
 * Input:  `cy.intercept('GET', '**\/api').as('get-api')`
 * Output: `cy.intercept('GET', '**\/api', { fixture: 'get-api.json' }).as('get-api')`
 */
export function toFixtureInterceptors(
  interceptors: string[],
  fixtures: Array<{ name: string }>,
): string[] {
  const fixtureNames = new Set(fixtures.map((f) => f.name));
  return interceptors.map((icp) => {
    const match = icp.match(/\.as\('([^']+)'\)$/);
    if (!match) return icp;
    const fixtureFile = `${match[1]}.json`;
    if (!fixtureNames.has(fixtureFile)) return icp;
    return icp.replace(/\)\.as\(/, `, { fixture: '${fixtureFile}' }).as(`);
  });
}

/**
 * For each `cy.wait('@alias')` command whose alias maps to a captured fixture,
 * replaces any inline body-validation callback with the no-op form.
 *
 * Input:  `cy.wait('@get-api').then((interception) => { expect(...) ... })`
 * Output: `cy.wait('@get-api').then((interception) => { })`
 */
export function simplifyFixtureWaits(
  commands: string[],
  fixtures: Array<{ name: string }>,
): string[] {
  const fixtureAliases = new Set(fixtures.map((f) => f.name.replace(/\.json$/, '')));
  return commands.map((cmd) => {
    const match = cmd.match(/^cy\.wait\('@([^']+)'\)/);
    if (!match || !fixtureAliases.has(match[1])) return cmd;
    return `cy.wait('@${match[1]}').then((interception) => { })`;
  });
}
