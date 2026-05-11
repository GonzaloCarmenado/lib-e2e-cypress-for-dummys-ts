export interface DirectoryNode {
  name: string;
  kind: 'directory';
  children: (DirectoryNode | FileNode)[];
}

export interface FileNode {
  name: string;
  kind: 'file';
}

export class AdvancedTestTransformationService {
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

  insertItBlock(content: string, itBlock: string, alertFn?: (msg: string) => void): string {
    const idx = content.lastIndexOf('})');
    if (idx === -1) {
      alertFn?.('ADVANCED_EDITOR.NO_END');
      return '';
    }
    return content.slice(0, idx) + '\n' + itBlock + '\n' + content.slice(idx);
  }

  isFile(file: unknown): boolean {
    return !!file && (file as FileNode).kind === 'file';
  }

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

export const advancedTestTransformationService = new AdvancedTestTransformationService();
