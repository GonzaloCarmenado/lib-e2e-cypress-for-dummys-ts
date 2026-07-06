import { describe, it, expect } from 'vitest';
import { toFixtureInterceptors, simplifyFixtureWaits } from '../src/utils/fixture-convert.utils';

describe('toFixtureInterceptors', () => {
  const fixtures = [
    { name: 'get-api-users.json', content: '{}' },
    { name: 'get-api-products.json', content: '[]' },
  ];

  it('converts a matching spy interceptor to fixture-stub form', () => {
    const result = toFixtureInterceptors(
      ["cy.intercept('GET', '**/api/users').as('get-api-users')"],
      fixtures,
    );
    expect(result[0]).toBe(
      "cy.intercept('GET', '**/api/users', { fixture: 'get-api-users.json' }).as('get-api-users')",
    );
  });

  it('leaves non-GET interceptors unchanged', () => {
    const postIcp = "cy.intercept('POST', '**/api/users').as('post-api-users')";
    const result = toFixtureInterceptors([postIcp], fixtures);
    expect(result[0]).toBe(postIcp);
  });

  it('leaves interceptors with no matching fixture unchanged', () => {
    const unrelated = "cy.intercept('GET', '**/api/other').as('get-api-other')";
    const result = toFixtureInterceptors([unrelated], fixtures);
    expect(result[0]).toBe(unrelated);
  });

  it('converts multiple interceptors in one pass', () => {
    const input = [
      "cy.intercept('GET', '**/api/users').as('get-api-users')",
      "cy.intercept('POST', '**/api/users').as('post-api-users')",
      "cy.intercept('GET', '**/api/products').as('get-api-products')",
    ];
    const result = toFixtureInterceptors(input, fixtures);
    expect(result[0]).toContain("{ fixture: 'get-api-users.json' }");
    expect(result[1]).not.toContain('fixture'); // POST unchanged
    expect(result[2]).toContain("{ fixture: 'get-api-products.json' }");
  });

  it('returns an empty array unchanged', () => {
    expect(toFixtureInterceptors([], fixtures)).toEqual([]);
  });

  it('returns original array when fixtures list is empty', () => {
    const icp = "cy.intercept('GET', '**/api/users').as('get-api-users')";
    expect(toFixtureInterceptors([icp], [])).toEqual([icp]);
  });
});

describe('simplifyFixtureWaits', () => {
  const fixtures = [{ name: 'get-api-users.json', content: '{}' }];

  it('replaces an inline-validation wait with the no-op form', () => {
    const cmd = "cy.wait('@get-api-users').then((interception) => {\n  expect(interception.response.body.name).to.equal(\"Alice\");\n})";
    const result = simplifyFixtureWaits([cmd], fixtures);
    expect(result[0]).toBe("cy.wait('@get-api-users').then((interception) => { })");
  });

  it('replaces an already-plain wait for a fixture alias (idempotent)', () => {
    const cmd = "cy.wait('@get-api-users').then((interception) => { })";
    const result = simplifyFixtureWaits([cmd], fixtures);
    expect(result[0]).toBe("cy.wait('@get-api-users').then((interception) => { })");
  });

  it('leaves waits for non-fixture aliases unchanged', () => {
    const cmd = "cy.wait('@post-api-users').then((interception) => {\n  expect(interception.request.body.name).to.equal(\"Alice\");\n})";
    const result = simplifyFixtureWaits([cmd], fixtures);
    expect(result[0]).toBe(cmd);
  });

  it('leaves non-wait commands unchanged', () => {
    const cmd = "cy.get('[data-cy=\"btn\"]').click()";
    const result = simplifyFixtureWaits([cmd], fixtures);
    expect(result[0]).toBe(cmd);
  });

  it('handles a mixed command list', () => {
    const input = [
      "cy.get('[data-cy=\"btn\"]').click()",
      "cy.wait('@get-api-users').then((interception) => { expect(interception.response.body.x).to.equal(1); })",
      "cy.wait('@post-api-other').then((interception) => { expect(interception.request.body.y).to.equal(2); })",
    ];
    const result = simplifyFixtureWaits(input, fixtures);
    expect(result[0]).toBe(input[0]); // click unchanged
    expect(result[1]).toBe("cy.wait('@get-api-users').then((interception) => { })"); // simplified
    expect(result[2]).toBe(input[2]); // non-fixture wait unchanged
  });

  it('returns an empty array unchanged', () => {
    expect(simplifyFixtureWaits([], fixtures)).toEqual([]);
  });

  it('returns original array when fixtures list is empty', () => {
    const cmd = "cy.wait('@get-api-users').then((interception) => { })";
    expect(simplifyFixtureWaits([cmd], [])).toEqual([cmd]);
  });
});
