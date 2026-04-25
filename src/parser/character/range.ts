import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { RangeCharPredicate } from './predicate/range.ts';
import { SingleCharacterPredicate } from './predicate/single_character.ts';

/**
 * Matches one character in the inclusive range `[start, stop]`. Both bounds
 * must be single characters.
 *
 * In UTF-16 mode the range is over code units. With `{ unicode: true }`,
 * both bounds may be single Unicode code points (one or two code units each)
 * and the range covers code points — so e.g. `range('a', '𝕐', { unicode: true })`
 * spans the BMP through low astral planes.
 */
export function range(
  start: string,
  stop: string,
  options: { message?: string; unicode?: boolean } = {},
): Parser<string> {
  const unicode = options.unicode ?? false;
  let startCode: number;
  let stopCode: number;
  if (unicode) {
    const sCp = start.codePointAt(0);
    const eCp = stop.codePointAt(0);
    if (sCp === undefined || start.length !== (sCp > 0xffff ? 2 : 1)) {
      throw new Error(`range({ unicode: true }) expects single-code-point start, got ${JSON.stringify(start)}`);
    }
    if (eCp === undefined || stop.length !== (eCp > 0xffff ? 2 : 1)) {
      throw new Error(`range({ unicode: true }) expects single-code-point stop, got ${JSON.stringify(stop)}`);
    }
    startCode = sCp;
    stopCode = eCp;
  } else {
    if (start.length !== 1) {
      throw new Error(`range() expects single-character start, got ${JSON.stringify(start)}`);
    }
    if (stop.length !== 1) {
      throw new Error(`range() expects single-character stop, got ${JSON.stringify(stop)}`);
    }
    startCode = start.charCodeAt(0);
    stopCode = stop.charCodeAt(0);
  }
  const predicate =
    startCode === stopCode
      ? new SingleCharacterPredicate(startCode)
      : new RangeCharPredicate(startCode, stopCode);
  return new CharacterParser(predicate, options.message ?? `${start}..${stop} expected`, unicode);
}
