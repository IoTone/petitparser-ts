import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { Token } from '../../core/token.ts';
import { DelegateParser } from '../combinator/delegate.ts';

/**
 * Wraps `delegate`'s value in a `Token<R>` carrying the buffer span and
 * (lazy) line/column. Position behavior is identical to the inner parser.
 */
export class TokenParser<R> extends DelegateParser<R, Token<R>> {
  override parseOn(context: Context): Result<Token<R>> {
    const start = context.position;
    const r = this.delegate.parseOn(context);
    if (r.kind === 'failure') return r;
    return success(
      { buffer: r.buffer, position: r.position },
      new Token<R>(r.value, r.buffer, start, r.position),
      r.position,
    );
  }
}

export function token<R>(parser: Parser<R>): Parser<Token<R>> {
  return new TokenParser(parser);
}
