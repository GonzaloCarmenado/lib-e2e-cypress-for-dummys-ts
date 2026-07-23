import { type Lang, isLang } from '../models/lang.model';
import { normalizeBlock, escapeSingleQuotes } from '../utils/code-format.utils';

/**
 * Transforms raw recording data into formatted Cypress test code strings.
 *
 * Handles language validation and the generation of `it(…)` blocks from a
 * list of recorded command strings.
 */
export class TransformationService {
  /**
   * Returns `lang` if it is a recognised i18n language code; falls back to
   * `'en'` for any unknown value.
   *
   * @param lang - The raw language string to validate.
   * @returns A valid {@link Lang} value.
   */
  toLang(lang: string): Lang {
    return isLang(lang) ? lang : 'en';
  }

  /**
   * Generates a Cypress `it(…)` block from a description and an array of
   * recorded command strings. Each command is dedented and re-indented with
   * two-space levels before being joined into the block body.
   *
   * @param description - The human-readable test description (used as the `it` title).
   * @param commands - The recorded Cypress command strings to include in the block.
   * @returns A formatted `it('…', () => { … });` string ready to paste into a spec file.
   */
  generateItDescription(description: string, commands: string[]): string {
    const commandsBlock = commands.map((cmd) => normalizeBlock(cmd, '  ')).join('\n');
    return `it('${escapeSingleQuotes(description)}', () => {\n${commandsBlock}\n});`;
  }
}

/** Shared singleton instance of {@link TransformationService}. */
export const transformationService = new TransformationService();
