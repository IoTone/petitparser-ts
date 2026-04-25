import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { SingleCharacterPredicate } from './predicate/single_character.ts';

/**
 * Matches exactly the character `c`.
 *
 * In the default UTF-16 mode, `c` must be a single-code-unit string (so a
 * surrogate-pair character like `'𝕏'` won't fit). With `{ unicode: true }`,
 * `c` may be a one- or two-code-unit string representing a single Unicode
 * code point.
 */
export function char(
  c: string,
  options: { message?: string; unicode?: boolean } = {},
): Parser<string> {
  const unicode = options.unicode ?? false;
  if (unicode) {
    // c may be 1 (BMP) or 2 (surrogate pair) UTF-16 code units, but must be
    // exactly one Unicode code point.
    const codePoint = c.codePointAt(0);
    if (codePoint === undefined || c.length !== (codePoint > 0xffff ? 2 : 1)) {
      throw new Error(
        `char({ unicode: true }) expects a single-code-point string, got ${JSON.stringify(c)}`,
      );
    }
    return new CharacterParser(
      new SingleCharacterPredicate(codePoint),
      options.message ?? `${JSON.stringify(c)} expected`,
      true,
    );
  }
  if (c.length !== 1) {
    throw new Error(`char() expects a single-character string, got ${JSON.stringify(c)}`);
  }
  return new CharacterParser(
    new SingleCharacterPredicate(c.charCodeAt(0)),
    options.message ?? `${JSON.stringify(c)} expected`,
  );
}
