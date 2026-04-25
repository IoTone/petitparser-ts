import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { rangesPredicate } from './predicate/ranges.ts';

const LETTER_PREDICATE = rangesPredicate([
  [0x41, 0x5a], // A..Z
  [0x61, 0x7a], // a..z
]);

/** Matches one ASCII letter (A–Z, a–z). */
export function letter(options: { message?: string } = {}): Parser<string> {
  return new CharacterParser(LETTER_PREDICATE, options.message ?? 'letter expected');
}
