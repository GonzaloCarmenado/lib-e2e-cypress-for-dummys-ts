import { describe, it, expect } from 'vitest';
import { syntaxHighlight } from '../../src/utils/syntax-highlight.utils';

describe('syntaxHighlight', () => {
  it('wraps keywords in sh-kw spans', () => {
    expect(syntaxHighlight('const x = 1')).toContain('<span class="sh-kw">const</span>');
  });

  it('wraps cy in sh-bi span', () => {
    expect(syntaxHighlight("cy.get('[data-cy=\"btn\"]')")).toContain('<span class="sh-bi">cy</span>');
  });

  it('wraps expect in sh-bi span', () => {
    expect(syntaxHighlight("expect(a).to.equal('b')")).toContain('<span class="sh-bi">expect</span>');
  });

  it('wraps single-quoted strings in sh-str span', () => {
    expect(syntaxHighlight("cy.visit('/')")).toContain("<span class=\"sh-str\">'/'</span>");
  });

  it('wraps double-quoted strings in sh-str span', () => {
    expect(syntaxHighlight('cy.contains("hello")')).toContain('<span class="sh-str">"hello"</span>');
  });

  it('wraps template literals in sh-str span', () => {
    expect(syntaxHighlight('const s = `hello`')).toContain('<span class="sh-str">`hello`</span>');
  });

  it('wraps single-line comments in sh-cmt span', () => {
    expect(syntaxHighlight('// a comment')).toContain('<span class="sh-cmt">// a comment</span>');
  });

  it('stops processing the line after a comment', () => {
    const result = syntaxHighlight('const x = 1; // comment');
    expect(result).toContain('sh-cmt');
    expect(result).toContain('sh-kw');
  });

  it('wraps numbers in sh-num span', () => {
    expect(syntaxHighlight('cy.viewport(1900, 1200)')).toContain('<span class="sh-num">1900</span>');
    expect(syntaxHighlight('cy.viewport(1900, 1200)')).toContain('<span class="sh-num">1200</span>');
  });

  it('does not treat numbers inside identifiers as sh-num', () => {
    const result = syntaxHighlight('get2Clients()');
    expect(result).not.toContain('sh-num');
  });

  it('handles multiline code preserving newlines', () => {
    const code = "it('test', () => {\n  cy.visit('/');\n});";
    const result = syntaxHighlight(code);
    expect(result.split('\n')).toHaveLength(3);
    expect(result).toContain('<span class="sh-kw">it</span>');
  });

  it('highlights describe keyword', () => {
    expect(syntaxHighlight("describe('suite', () => {")).toContain('<span class="sh-kw">describe</span>');
  });

  it('highlights beforeEach keyword', () => {
    expect(syntaxHighlight('beforeEach(() => {')).toContain('<span class="sh-kw">beforeEach</span>');
  });

  it('handles escaped quotes inside strings', () => {
    const code = "cy.contains('it\\'s here')";
    const result = syntaxHighlight(code);
    expect(result).toContain('sh-str');
    expect(result).toContain('sh-bi');
  });

  it('escapes HTML special chars in plain identifiers', () => {
    expect(syntaxHighlight('a < b')).toContain('&lt;');
  });

  it('escapes HTML inside strings', () => {
    expect(syntaxHighlight("cy.get('<div>')")).toContain('&lt;div&gt;');
  });

  it('handles empty string', () => {
    expect(syntaxHighlight('')).toBe('');
  });

  it('handles true, false, null, undefined keywords', () => {
    const result = syntaxHighlight('true false null undefined');
    expect(result).toContain('<span class="sh-kw">true</span>');
    expect(result).toContain('<span class="sh-kw">false</span>');
    expect(result).toContain('<span class="sh-kw">null</span>');
    expect(result).toContain('<span class="sh-kw">undefined</span>');
  });
});
