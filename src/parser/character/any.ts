import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { ConstantCharPredicate } from './predicate/constant.ts';

const ANY_PREDICATE = new ConstantCharPredicate(true);

/**
 * Matches any single character. Fails only at end of input.
 *
 * Pass `{ unicode: true }` to consume one Unicode code point per match
 * (advancing across surrogate pairs); the default reads one UTF-16 code unit
 * (so `'𝕏'` is two characters in the default mode).
 */
export function any(options: { message?: string; unicode?: boolean } = {}): Parser<string> {
  return new CharacterParser(ANY_PREDICATE, options.message ?? 'input expected', options.unicode);
}
