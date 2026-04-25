import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { RangeCharPredicate } from './predicate/range.ts';

const LOWERCASE_PREDICATE = new RangeCharPredicate(0x61, 0x7a); // 'a'..'z'

/** Matches one ASCII lowercase letter (a–z). */
export function lowercase(options: { message?: string } = {}): Parser<string> {
  return new CharacterParser(LOWERCASE_PREDICATE, options.message ?? 'lowercase letter expected');
}
