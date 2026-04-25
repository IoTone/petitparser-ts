import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { RangeCharPredicate } from './predicate/range.ts';

const UPPERCASE_PREDICATE = new RangeCharPredicate(0x41, 0x5a); // 'A'..'Z'

/** Matches one ASCII uppercase letter (A–Z). */
export function uppercase(options: { message?: string } = {}): Parser<string> {
  return new CharacterParser(UPPERCASE_PREDICATE, options.message ?? 'uppercase letter expected');
}
