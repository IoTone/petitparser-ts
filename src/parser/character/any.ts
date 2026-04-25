import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { ConstantCharPredicate } from './predicate/constant.ts';

const ANY_PREDICATE = new ConstantCharPredicate(true);

/** Matches any single input code unit. Fails only at end of input. */
export function any(options: { message?: string } = {}): Parser<string> {
  return new CharacterParser(ANY_PREDICATE, options.message ?? 'input expected');
}
