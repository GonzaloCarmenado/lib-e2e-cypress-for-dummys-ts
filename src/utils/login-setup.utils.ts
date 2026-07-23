const EXPORT_FN_RE =
  /^(?!\/\/).*\bexport\s+(?:async\s+)?function\s+(\w+)|^(?!\/\/).*\bexport\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/gm;

/**
 * Extracts the names of all exported functions and arrow-function constants from
 * a TypeScript/JavaScript file's source text. Skips commented-out declarations.
 *
 * @param fileContent - The full text of the source file to parse.
 * @returns An array of exported function/constant names in declaration order.
 */
export function extractExportedFunctions(fileContent: string): string[] {
  const names: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(EXPORT_FN_RE.source, EXPORT_FN_RE.flags);
  while ((match = re.exec(fileContent)) !== null) {
    const name = match[1] ?? match[2];
    if (name) names.push(name);
  }
  return names;
}

/**
 * Generates the initial content for a login service scaffold file. The file
 * contains two stub exported functions — `fetchAuthToken` and
 * `setupRequestInterceptors` — with TODO comments guiding the developer.
 *
 * @returns A multi-line string containing the scaffold source code.
 */
export function buildLoginScaffold(): string {
  return [
    '/**',
    ' * Login service scaffold — fill in your own auth logic.',
    ' * This file is not committed to source control.',
    ' */',
    '',
    'export function fetchAuthToken() {',
    '  // TODO: implement — retrieve and return your auth token',
    '}',
    '',
    'export function setupRequestInterceptors() {',
    '  // TODO: implement — configure cy.intercept() or set localStorage/cookies',
    '}',
    '',
  ].join('\n');
}

/**
 * Computes the relative ES-module import path from one file to another, using
 * only forward slashes and omitting the `.ts` extension from the target.
 *
 * @param fromFilePath - Absolute or relative path of the importing file.
 * @param toServiceFilePath - Absolute or relative path of the file being imported.
 * @returns A relative import path suitable for use in an `import … from '…'` statement.
 */
export function buildLoginImportPath(fromFilePath: string, toServiceFilePath: string): string {
  const fromParts = fromFilePath.replace(/\\/g, '/').split('/');
  const toParts   = toServiceFilePath.replace(/\\/g, '/').split('/');

  fromParts.pop(); // remove filename, keep directory segments

  // find common prefix length
  let common = 0;
  while (common < fromParts.length && common < toParts.length - 1 && fromParts[common] === toParts[common]) {
    common++;
  }

  const ups   = fromParts.length - common;
  const downs = toParts.slice(common);

  const serviceFile = downs[downs.length - 1].replace(/\.ts$/, '');
  const prefix = ups === 0 ? '.' : Array(ups).fill('..').join('/');
  const middle = downs.slice(0, -1);

  return [prefix, ...middle, serviceFile].join('/');
}

/**
 * Returns `true` when a test file's source already contains a call to at least
 * one of the specified login function names.
 *
 * @param content - The source text of the test file to check.
 * @param fnNames - The login function names to look for (e.g. `['fetchAuthToken']`).
 * @returns `true` if any function name is invoked in `content`.
 */
export function hasLoginBlocks(content: string, fnNames: string[]): boolean {
  return fnNames.some(fn => new RegExp(`\\b${fn}\\s*\\(`).test(content));
}

/**
 * Injects a login import line and `before`/`beforeEach` hook blocks into an
 * existing Cypress test file, inserting them immediately after the opening
 * `describe(…{` brace. Already-present import lines are not duplicated.
 *
 * @param content - The current source text of the test file.
 * @param importLine - The `import { … } from '…'` statement to prepend.
 * @param beforeBlock - A `before(() => { … });` block string, or empty.
 * @param beforeEachBlock - A `beforeEach(() => { … });` block string, or empty.
 * @returns The modified source text with hooks and imports injected.
 */
export function injectLoginBlocksIntoExisting(
  content: string,
  importLine: string,
  beforeBlock: string,
  beforeEachBlock: string,
): string {
  let result = content;

  if (importLine && !content.includes(importLine)) {
    result = `${importLine}\n\n${result}`;
  }

  const blocks = [beforeBlock, beforeEachBlock].filter(Boolean).join('');
  if (blocks) {
    const describeMatch = result.match(/(describe\s*\(.*?{)/s);
    if (describeMatch) {
      const insertPos = (describeMatch.index ?? 0) + describeMatch[0].length;
      result = result.slice(0, insertPos) + '\n' + blocks + result.slice(insertPos);
    }
  }

  return result;
}

/**
 * Builds the import line and hook blocks needed to wire a login service into a
 * Cypress `describe` block.
 *
 * @param importPath - The relative module path to import from (e.g. `'../../support/login'`).
 * @param beforeFn - Name of the function to call in a `before` hook, or `null`.
 * @param beforeEachFn - Name of the function to call in a `beforeEach` hook, or `null`.
 * @returns An object with `importLine`, `beforeBlock`, and `beforeEachBlock` strings.
 *          All values are empty strings when both `beforeFn` and `beforeEachFn` are falsy.
 */
export function buildLoginBlocks(
  importPath: string,
  beforeFn: string | null,
  beforeEachFn: string | null,
): { importLine: string; beforeBlock: string; beforeEachBlock: string } {
  if (!beforeFn && !beforeEachFn) {
    return { importLine: '', beforeBlock: '', beforeEachBlock: '' };
  }

  const fns = [...new Set([beforeFn, beforeEachFn].filter(Boolean))] as string[];
  const importLine = `import { ${fns.join(', ')} } from '${importPath}';`;

  const beforeBlock     = beforeFn     ? `  before(() => { ${beforeFn}(); });\n` : '';
  const beforeEachBlock = beforeEachFn ? `  beforeEach(() => { ${beforeEachFn}(); });\n` : '';

  return { importLine, beforeBlock, beforeEachBlock };
}
