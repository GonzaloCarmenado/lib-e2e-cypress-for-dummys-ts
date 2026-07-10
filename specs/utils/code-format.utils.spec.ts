import { describe, it, expect } from 'vitest';
import { normalizeBlock, escapeSingleQuotes, escapeCssAttrValue } from '../../src/utils/code-format.utils';

describe('normalizeBlock', () => {
  it('adds base indent to a single-line zero-indent command', () => {
    expect(normalizeBlock('cy.click()', '  ')).toBe('  cy.click()');
  });

  it('strips leading whitespace from a single-line command', () => {
    expect(normalizeBlock('    cy.click()', '  ')).toBe('  cy.click()');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeBlock('', '  ')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeBlock('   \n   ', '  ')).toBe('');
  });

  it('preserves blank lines as empty strings', () => {
    const input = "cy.click()\n\ncy.type('x')";
    expect(normalizeBlock(input, '  ')).toBe("  cy.click()\n\n  cy.type('x')");
  });

  it('normalizes a consistently-indented block with zero min-indent', () => {
    const input = "before(() => {\n    cy.intercept('GET', '/api')\n});";
    // indents [0,4,0], minIndent=0, step=4
    // before→level 0, cy→level 1, });→level 0
    expect(normalizeBlock(input, '  ')).toBe(
      "  before(() => {\n    cy.intercept('GET', '/api')\n  });"
    );
  });

  it('strips common leading whitespace from a uniformly-indented block', () => {
    const input = "    before(() => {\n        cy.intercept('GET', '/api')\n    });";
    // indents [4,8,4], minIndent=4, relIndents=[4], step=4
    // all normalize same as zero-min case
    expect(normalizeBlock(input, '  ')).toBe(
      "  before(() => {\n    cy.intercept('GET', '/api')\n  });"
    );
  });

  it('detects indent step via GCD and fixes pathological indentation', () => {
    // Original: before at col 0, body at col 8, close at col 4 → step=GCD(8,4)=4
    const input = 'before(() => {\n        cy.intercept()\n    });';
    // indents [0,8,4], minIndent=0, relIndents=[8,4], GCD=4, step=4
    // before→level 0 → '  before'
    // cy.intercept→level 2 → '      cy.intercept'
    // });→level 1 → '    });'
    expect(normalizeBlock(input, '  ')).toBe(
      '  before(() => {\n      cy.intercept()\n    });'
    );
  });

  it('handles deeply nested blocks', () => {
    const input = "fetchToken().then(token => {\n    Cypress.env('t', token);\n});";
    // indents [0,4,0], step=4
    expect(normalizeBlock(input, '  ')).toBe(
      "  fetchToken().then(token => {\n    Cypress.env('t', token);\n  });"
    );
  });

  it('works with a tab-size-2 base indent', () => {
    expect(normalizeBlock("cy.visit('/')", '    ')).toBe("    cy.visit('/')");
  });

  it('trims trailing whitespace from lines', () => {
    expect(normalizeBlock('cy.click()   ', '  ')).toBe('  cy.click()');
  });
});

describe('escapeSingleQuotes', () => {
  it('leaves a string without single quotes unchanged', () => {
    expect(escapeSingleQuotes('login flow')).toBe('login flow');
  });

  it('escapes a single quote', () => {
    expect(escapeSingleQuotes("User's login")).toBe("User\\'s login");
  });

  it('escapes multiple single quotes', () => {
    expect(escapeSingleQuotes("a 'b' c")).toBe("a \\'b\\' c");
  });

  it('escapes backslashes before quotes so the result is a valid literal', () => {
    expect(escapeSingleQuotes('a\\b')).toBe('a\\\\b');
  });

  it('returns an empty string for empty input', () => {
    expect(escapeSingleQuotes('')).toBe('');
  });
});

describe('escapeCssAttrValue', () => {
  it('leaves a plain value unchanged', () => {
    expect(escapeCssAttrValue('my-button')).toBe('my-button');
  });

  it('escapes a double quote', () => {
    // CSS [attr="VALUE"]: a literal " inside VALUE must be written as \"
    // 'say "hello"' → 'say \\"hello\\"'  (runtime: say \"hello\")
    expect(escapeCssAttrValue('say "hello"')).toBe('say \\"hello\\"');
  });

  it('escapes multiple double quotes', () => {
    expect(escapeCssAttrValue('"wrap"')).toBe('\\"wrap\\"');
  });

  it('does not escape single quotes (those are safe inside double-quoted CSS attributes)', () => {
    expect(escapeCssAttrValue("o'brien")).toBe("o'brien");
  });

  it('returns empty string for empty input', () => {
    expect(escapeCssAttrValue('')).toBe('');
  });
});
