import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { LimitedRepeatingParser } from './limited.ts';
import { UNBOUNDED } from './repeating.ts';

/**
 * Lazy (non-greedy) repetition with a follow-set `limit`. Consumes `delegate`
 * the *minimum* number of times that lets `limit` succeed at the cursor, while
 * staying within `[min, max]`. Reports `limit`'s failure once `max` is reached
 * without satisfying it; reports `delegate`'s failure if `min` can't be met.
 */
export class LazyRepeatingParser<R> extends LimitedRepeatingParser<R> {
  override parseOn(context: Context): Result<R[]> {
    const values: R[] = [];
    let cursor: Context = context;
    // First reach min matches.
    while (values.length < this.min) {
      const r = this.delegate.parseOn(cursor);
      if (r.kind === 'failure') return r;
      values.push(r.value);
      cursor = { buffer: r.buffer, position: r.position };
    }
    // Then try the limit; if it fails, take one more match. When the next
    // delegate match also fails, we report the *limit* failure — it conveys
    // the more useful "we never found the follow-set" diagnostic instead of
    // "ran out of element matches partway through".
    while (true) {
      const limitResult = this.limit.parseOn(cursor);
      if (limitResult.kind === 'success') return success(cursor, values, cursor.position);
      if (values.length >= this.max) return limitResult;
      const r = this.delegate.parseOn(cursor);
      if (r.kind === 'failure') return limitResult;
      values.push(r.value);
      cursor = { buffer: r.buffer, position: r.position };
    }
  }
}

/** Lazy `star` with a follow `limit` — matches as few as possible. */
export function starLazy<R>(parser: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return new LazyRepeatingParser(parser, limit, 0, UNBOUNDED);
}

/** Lazy `plus` with a follow `limit`. */
export function plusLazy<R>(parser: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return new LazyRepeatingParser(parser, limit, 1, UNBOUNDED);
}

/** Lazy bounded repeat with a follow `limit`. */
export function repeatLazy<R>(
  parser: Parser<R>,
  limit: Parser<unknown>,
  min: number,
  max: number,
): Parser<R[]> {
  return new LazyRepeatingParser(parser, limit, min, max);
}
