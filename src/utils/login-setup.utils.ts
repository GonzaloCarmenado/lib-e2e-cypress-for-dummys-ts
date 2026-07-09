const EXPORT_FN_RE =
  /^(?!\/\/).*\bexport\s+(?:async\s+)?function\s+(\w+)|^(?!\/\/).*\bexport\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/gm;

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
