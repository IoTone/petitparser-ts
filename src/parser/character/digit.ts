import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { RangeCharPredicate } from './predicate/range.ts';

const DIGIT_PREDICATE = new RangeCharPredicate(0x30, 0x39); // '0'..'9'

/** Matches one ASCII digit (0–9). */
export function digit(options: { message?: string } = {}): Parser<string> {
  return new CharacterParser(DIGIT_PREDICATE, options.message ?? 'digit expected');
}
