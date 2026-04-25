import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure, success, type Result } from '../../core/result.ts';
import type { CharacterPredicate } from './predicate/character_predicate.ts';

/**
 * Consumes one code unit from the input and emits it as a single-character
 * string, iff `predicate.test(code)` returns true. Otherwise fails with
 * `message`.
 *
 * All character-class factories (`any`, `char`, `digit`, `letter`, `pattern`, ...)
 * funnel through this one parser, differing only in the predicate they pass.
 */
export class CharacterParser extends Parser<string> {
  readonly predicate: CharacterPredicate;
  readonly message: string;

  constructor(predicate: CharacterPredicate, message: string) {
    super();
    this.predicate = predicate;
    this.message = message;
  }

  override parseOn(context: Context): Result<string> {
    const { buffer, position } = context;
    if (position < buffer.length && this.predicate.test(buffer.charCodeAt(position))) {
      return success(context, buffer.charAt(position), position + 1);
    }
    return failure(context, this.message);
  }

  override fastParseOn(buffer: string, position: number): number {
    return position < buffer.length && this.predicate.test(buffer.charCodeAt(position))
      ? position + 1
      : -1;
  }

  override toString(): string {
    return `CharacterParser[${this.message}]`;
  }
}
