import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { RepeatingParser, UNBOUNDED } from './repeating.ts';

/**
 * Possessive repetition: repeatedly applies `delegate` until it fails or the
 * `max` count is reached. No backtracking — once a match is consumed, it is
 * never released even if a later combinator would prefer it weren't.
 *
 * Returns the array of successful values. Fails iff fewer than `min` matches
 * were consumed.
 */
export class PossessiveRepeatingParser<R> extends RepeatingParser<R, R[]> {
  override parseOn(context: Context): Result<R[]> {
    const values: R[] = [];
    let cursor: Context = context;
    while (values.length < this.max) {
      const result = this.delegate.parseOn(cursor);
      if (result.kind === 'failure') {
        if (values.length < this.min) return result;
        break;
      }
      values.push(result.value);
      cursor = { buffer: result.buffer, position: result.position };
    }
    return success(cursor, values, cursor.position);
  }

  override fastParseOn(buffer: string, position: number): number {
    let cursor = position;
    let count = 0;
    while (count < this.max) {
      const next = this.delegate.fastParseOn(buffer, cursor);
      if (next < 0) {
        if (count < this.min) return -1;
        break;
      }
      cursor = next;
      count++;
    }
    return cursor;
  }
}

/** Match `parser` zero or more times. */
export function star<R>(parser: Parser<R>): Parser<R[]> {
  return new PossessiveRepeatingParser(parser, 0, UNBOUNDED);
}

/** Match `parser` one or more times. */
export function plus<R>(parser: Parser<R>): Parser<R[]> {
  return new PossessiveRepeatingParser(parser, 1, UNBOUNDED);
}

/** Match `parser` exactly `count` times. */
export function times<R>(parser: Parser<R>, count: number): Parser<R[]> {
  return new PossessiveRepeatingParser(parser, count, count);
}

/** Match `parser` between `min` and `max` times (inclusive). */
export function repeat<R>(parser: Parser<R>, min: number, max: number): Parser<R[]> {
  return new PossessiveRepeatingParser(parser, min, max);
}
