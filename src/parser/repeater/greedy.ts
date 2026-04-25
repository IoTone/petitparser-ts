import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { LimitedRepeatingParser } from './limited.ts';
import { UNBOUNDED } from './repeating.ts';

/**
 * Greedy repetition with a follow-set `limit`. First consumes `delegate` as
 * many times as possible (between min and max). Then walks back, one match at
 * a time, looking for the longest prefix where `limit` succeeds at the cursor.
 *
 * Reports the inner parser's failure if fewer than `min` were ever matched;
 * reports `limit`'s failure if no walked-back position satisfies it.
 */
export class GreedyRepeatingParser<R> extends LimitedRepeatingParser<R> {
  override parseOn(context: Context): Result<R[]> {
    const values: R[] = [];
    const positions: number[] = [context.position];
    let cursor: Context = context;
    while (values.length < this.max) {
      const result = this.delegate.parseOn(cursor);
      if (result.kind === 'failure') {
        if (values.length < this.min) return result;
        break;
      }
      values.push(result.value);
      cursor = { buffer: result.buffer, position: result.position };
      positions.push(result.position);
    }
    while (values.length >= this.min) {
      const limitResult = this.limit.parseOn(cursor);
      if (limitResult.kind === 'success') {
        return success(cursor, values, cursor.position);
      }
      if (values.length === this.min) return limitResult;
      values.pop();
      positions.pop();
      cursor = { buffer: context.buffer, position: positions[positions.length - 1]! };
    }
    return this.limit.parseOn(cursor) as unknown as Result<R[]>;
  }
}

/** Greedy `star` with a follow `limit` — matches as many as possible while `limit` still succeeds. */
export function starGreedy<R>(parser: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return new GreedyRepeatingParser(parser, limit, 0, UNBOUNDED);
}

/** Greedy `plus` with a follow `limit`. */
export function plusGreedy<R>(parser: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return new GreedyRepeatingParser(parser, limit, 1, UNBOUNDED);
}

/** Greedy bounded repeat with a follow `limit`. */
export function repeatGreedy<R>(
  parser: Parser<R>,
  limit: Parser<unknown>,
  min: number,
  max: number,
): Parser<R[]> {
  return new GreedyRepeatingParser(parser, limit, min, max);
}
