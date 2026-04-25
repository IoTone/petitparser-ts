import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure, success, type Result } from '../../core/result.ts';
import type { CharacterPredicate } from './predicate/character_predicate.ts';

/**
 * Consumes one character from the input and emits it as a string, iff
 * `predicate.test(code)` returns true. Otherwise fails with `message`.
 *
 * Two modes:
 * - **UTF-16 (default)**: one UTF-16 code unit per character. The predicate
 *   tests `charCodeAt(position)`, position advances by 1. Surrogate pairs
 *   are seen as two separate characters.
 * - **Unicode (`unicode: true`)**: one Unicode code point per character. The
 *   predicate tests `codePointAt(position)`, position advances by 1 or 2
 *   depending on whether the code point is in the supplementary planes
 *   (above U+FFFF, requiring a surrogate pair).
 *
 * All character-class factories (`any`, `char`, `digit`, `letter`, `pattern`,
 * ...) funnel through this one parser, differing only in the predicate they
 * pass and the unicode flag.
 */
export class CharacterParser extends Parser<string> {
  readonly predicate: CharacterPredicate;
  readonly message: string;
  readonly unicode: boolean;

  constructor(predicate: CharacterPredicate, message: string, unicode = false) {
    super();
    this.predicate = predicate;
    this.message = message;
    this.unicode = unicode;
  }

  override parseOn(context: Context): Result<string> {
    const { buffer, position } = context;
    if (position >= buffer.length) return failure(context, this.message);
    if (this.unicode) {
      const code = buffer.codePointAt(position);
      // codePointAt returns undefined only for out-of-bounds, which we already checked.
      if (code !== undefined && this.predicate.test(code)) {
        const width = code > 0xffff ? 2 : 1;
        return success(context, buffer.substring(position, position + width), position + width);
      }
    } else {
      if (this.predicate.test(buffer.charCodeAt(position))) {
        return success(context, buffer.charAt(position), position + 1);
      }
    }
    return failure(context, this.message);
  }

  override fastParseOn(buffer: string, position: number): number {
    if (position >= buffer.length) return -1;
    if (this.unicode) {
      const code = buffer.codePointAt(position);
      if (code !== undefined && this.predicate.test(code)) {
        return position + (code > 0xffff ? 2 : 1);
      }
      return -1;
    }
    return this.predicate.test(buffer.charCodeAt(position)) ? position + 1 : -1;
  }

  override toString(): string {
    return `CharacterParser[${this.message}${this.unicode ? ', unicode' : ''}]`;
  }
}
