import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { RangeCharPredicate } from './predicate/range.ts';
import { SingleCharacterPredicate } from './predicate/single_character.ts';

/**
 * Matches one code unit in the inclusive range `[start, stop]`. Both bounds
 * must be single-character strings.
 */
export function range(
  start: string,
  stop: string,
  options: { message?: string } = {},
): Parser<string> {
  if (start.length !== 1) {
    throw new Error(`range() expects single-character start, got ${JSON.stringify(start)}`);
  }
  if (stop.length !== 1) {
    throw new Error(`range() expects single-character stop, got ${JSON.stringify(stop)}`);
  }
  const startCode = start.charCodeAt(0);
  const stopCode = stop.charCodeAt(0);
  const predicate =
    startCode === stopCode
      ? new SingleCharacterPredicate(startCode)
      : new RangeCharPredicate(startCode, stopCode);
  return new CharacterParser(predicate, options.message ?? `${start}..${stop} expected`);
}
