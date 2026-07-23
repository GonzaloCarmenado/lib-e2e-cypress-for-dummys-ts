/** Represents a directory node in a scanned filesystem tree. */
export interface DirectoryNode {
  name: string;
  kind: 'directory';
  children: (DirectoryNode | FileNode)[];
}

/** Represents a file leaf in a scanned filesystem tree. */
export interface FileNode {
  name: string;
  kind: 'file';
}

/**
 * Provides text-manipulation helpers for the Advanced Test Editor workflow:
 * inserting `beforeEach` interceptor blocks, appending `it(…)` blocks, building
 * JSDoc comments, and scanning the File System Access API directory tree.
 */
export class AdvancedTestTransformationService {
  /**
   * Inserts a `beforeEach` block containing the given interceptors immediately
   * after the opening `describe(…{` brace of a Cypress spec file.
   *
   * @param content - The full source text of the spec file.
   * @param interceptors - Pre-formatted interceptor lines to embed in the hook.
   * @param alertFn - Optional callback invoked with an i18n key when no
   *                  `describe` block is found; the function returns `''` in that case.
   * @returns The modified source text, or `''` if no `describe` was found.
   */
  insertBeforeEach(content: string, interceptors: string, alertFn?: (msg: string) => void): string {
    const match = content.match(/(describe\s*\(.*?{)/s);
    if (!match) {
      alertFn?.('ADVANCED_EDITOR.NO_DESCRIBE');
      return '';
    }
    const insertPos = (match.index ?? 0) + match[0].length;
    const beforeEachBlock = `\n  beforeEach(() => {\n${interceptors}  })\n`;
    return content.slice(0, insertPos) + beforeEachBlock + content.slice(insertPos);
  }

  /**
   * Appends an `it(…)` block just before the last `})` closing brace of a
   * Cypress spec file, so the new test is added at the end of the `describe`.
   *
   * @param content - The full source text of the spec file.
   * @param itBlock - The formatted `it(…)` string to insert.
   * @param alertFn - Optional callback invoked with an i18n key when no closing
   *                  `})` is found; the function returns `''` in that case.
   * @returns The modified source text, or `''` if no closing brace was found.
   */
  insertItBlock(content: string, itBlock: string, alertFn?: (msg: string) => void): string {
    const idx = content.lastIndexOf('})');
    if (idx === -1) {
      alertFn?.('ADVANCED_EDITOR.NO_END');
      return '';
    }
    return content.slice(0, idx) + '\n' + itBlock + '\n' + content.slice(idx);
  }

  /**
   * Wraps a multi-line notes string in a JSDoc-style block comment
   * (`/** … *\/`). Returns an empty string when `notes` is blank.
   *
   * @param notes - The raw notes text (may contain newlines).
   * @returns A formatted block comment string, or `''` if notes is empty.
   */
  buildBlockComment(notes: string): string {
    if (!notes.trim()) return '';
    const lines = notes.split('\n').map(l => ` * ${l}`).join('\n');
    return `/**\n${lines}\n */`;
  }

  /**
   * Returns `true` when `file` is a {@link FileNode} (i.e. has `kind === 'file'`).
   *
   * @param file - Any value, typically a node from a scanned directory tree.
   * @returns `true` if `file` is a non-null object with `kind === 'file'`.
   */
  isFile(file: unknown): boolean {
    return !!file && (file as FileNode).kind === 'file';
  }

  /**
   * Recursively scans a File System Access API directory handle and builds a
   * {@link DirectoryNode} tree representing its contents.
   *
   * @param dirHandle - The root directory handle to scan.
   * @returns A promise that resolves to the fully populated {@link DirectoryNode}.
   */
  async scanDirectory(dirHandle: FileSystemDirectoryHandle): Promise<DirectoryNode> {
    const result: DirectoryNode = { name: dirHandle.name, kind: 'directory', children: [] };
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        result.children.push(await this.scanDirectory(entry as FileSystemDirectoryHandle));
      } else {
        result.children.push({ name: entry.name, kind: 'file' });
      }
    }
    return result;
  }
}

/** Shared singleton instance of {@link AdvancedTestTransformationService}. */
export const advancedTestTransformationService = new AdvancedTestTransformationService();
