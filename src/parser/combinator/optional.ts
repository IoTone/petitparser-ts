import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { DelegateParser } from './delegate.ts';

/**
 * Tries `delegate`. If it succeeds, returns its value. If it fails, succeeds
 * at the original position with the configured `otherwise` value (default:
 * `undefined`).
 */
export class OptionalParser<R, O> extends DelegateParser<R, R | O> {
  readonly otherwise: O;

  constructor(parser: Parser<R>, otherwise: O) {
    super(parser);
    this.otherwise = otherwise;
  }

  override parseOn(context: Context): Result<R | O> {
    const result = this.delegate.parseOn(context);
    if (result.kind === 'success') return result;
    return success(context, this.otherwise);
  }

  override fastParseOn(buffer: string, position: number): number {
    const r = this.delegate.fastParseOn(buffer, position);
    return r < 0 ? position : r;
  }
}

/** Make `parser` optional. Defaults to `undefined` on miss. */
export function optional<R>(parser: Parser<R>): Parser<R | undefined>;
/** Make `parser` optional, returning `otherwise` on miss. */
export function optional<R, O>(parser: Parser<R>, otherwise: O): Parser<R | O>;
export function optional<R, O>(parser: Parser<R>, otherwise?: O): Parser<R | O | undefined> {
  return new OptionalParser<R, O | undefined>(parser, otherwise);
}
