import type { Parser } from '../../core/parser.ts';
import { SequenceParser } from './sequence.ts';

/** Maps a tuple of `Parser<R_i>` to a tuple of `R_i`. */
export type SequenceResult<T extends readonly Parser<unknown>[]> = {
  readonly [K in keyof T]: T[K] extends Parser<infer R> ? R : never;
};

/**
 * Variadic typed sequence. Returns a parser whose value is a readonly tuple
 * of each child's value, with full type inference:
 *
 *     seq(digit(), letter())            // Parser<readonly [string, string]>
 *     seq(string('a'), digit(), end())  // Parser<readonly [string, string, undefined]>
 */
export function seq<T extends readonly Parser<unknown>[]>(...parsers: T): Parser<SequenceResult<T>> {
  return new SequenceParser(parsers) as unknown as Parser<SequenceResult<T>>;
}
