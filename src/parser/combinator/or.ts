import type { Parser } from '../../core/parser.ts';
import { ChoiceParser, type FailureJoiner } from './choice.ts';

/** Maps a tuple of `Parser<R_i>` to the union `R_1 | R_2 | ... | R_n`. */
export type ChoiceResult<T extends readonly Parser<unknown>[]> = T[number] extends Parser<infer R>
  ? R
  : never;

/**
 * Variadic typed choice. Returns a parser whose value is the union of each
 * child's result type. The first matching alternative wins; on total failure
 * the joiner strategy picks which failure to report (default: last).
 *
 *     or(string('true'), string('false'))      // Parser<string>
 *     or(digit(), letter())                    // Parser<string>
 *     or(epsilonWith(0), digit().map(Number))  // Parser<number>
 */
export function or<T extends readonly Parser<unknown>[]>(
  ...parsers: T
): Parser<ChoiceResult<T>> {
  return new ChoiceParser(parsers) as unknown as Parser<ChoiceResult<T>>;
}

/** Same as `or(...)` but with an explicit failure-joiner strategy. */
export function orWith<T extends readonly Parser<unknown>[]>(
  failureJoiner: FailureJoiner,
  ...parsers: T
): Parser<ChoiceResult<T>> {
  return new ChoiceParser(
    parsers,
    failureJoiner,
  ) as unknown as Parser<ChoiceResult<T>>;
}
