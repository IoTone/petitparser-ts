import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { DelegateParser } from './delegate.ts';

/**
 * Positive lookahead. Tries `delegate`; on success, returns its value but
 * does NOT advance the position. On failure, propagates the failure.
 */
export class AndParser<R> extends DelegateParser<R, R> {
  override parseOn(context: Context): Result<R> {
    const result = this.delegate.parseOn(context);
    if (result.kind === 'failure') return result;
    return success(context, result.value);
  }

  override fastParseOn(buffer: string, position: number): number {
    const r = this.delegate.fastParseOn(buffer, position);
    return r < 0 ? -1 : position;
  }
}

/** Positive lookahead — succeeds with `parser`'s value, consumes nothing. */
export function and<R>(parser: Parser<R>): Parser<R> {
  return new AndParser(parser);
}
