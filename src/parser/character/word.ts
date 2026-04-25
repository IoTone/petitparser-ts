import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { rangesPredicate } from './predicate/ranges.ts';

const WORD_PREDICATE = rangesPredicate([
  [0x30, 0x39], // 0..9
  [0x41, 0x5a], // A..Z
  [0x5f, 0x5f], // _
  [0x61, 0x7a], // a..z
]);

/** Matches one ASCII word character (letter, digit, or underscore). */
export function word(options: { message?: string } = {}): Parser<string> {
  return new CharacterParser(WORD_PREDICATE, options.message ?? 'letter or digit expected');
}
