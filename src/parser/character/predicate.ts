import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import type { CharacterPredicate } from './predicate/character_predicate.ts';

class FunctionCharPredicate implements CharacterPredicate {
  readonly fn: (code: number) => boolean;

  constructor(fn: (code: number) => boolean) {
    this.fn = fn;
  }

  test(value: number): boolean {
    return this.fn(value);
  }

  isEqualTo(other: CharacterPredicate): boolean {
    return other instanceof FunctionCharPredicate && other.fn === this.fn;
  }
}

/**
 * Matches one code unit accepted by `predicate`. Use this as an escape hatch
 * for character classes not covered by `digit`, `letter`, `range`, etc.
 *
 * Two parsers built from the *same* function reference compare as equal under
 * `isEqualTo`; built from different references they do not.
 */
export function predicate(
  test: (code: number) => boolean,
  options: { message?: string } = {},
): Parser<string> {
  return new CharacterParser(
    new FunctionCharPredicate(test),
    options.message ?? 'predicate expected',
  );
}
