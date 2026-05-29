import { type Lang, isLang } from '../models/lang.model';
import { normalizeBlock } from '../utils/code-format.utils';

export class TransformationService {
  toLang(lang: string): Lang {
    return isLang(lang) ? lang : 'en';
  }

  generateItDescription(description: string, commands: string[]): string {
    const commandsBlock = commands.map((cmd) => normalizeBlock(cmd, '  ')).join('\n');
    return `it('${description}', () => {\n${commandsBlock}\n});`;
  }
}

export const transformationService = new TransformationService();
