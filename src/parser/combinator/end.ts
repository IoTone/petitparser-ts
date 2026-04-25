import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { failure as makeFailure, type Result } from '../../core/result.ts';
import { DelegateParser } from './delegate.ts';

/**
 * Wraps `parser` so it must consume the entire input. On success, returns the
 * inner value. On a partial parse, fails at the position where leftover input
 * begins with `message`.
 */
export class EndParser<R> extends DelegateParser<R, R> {
  readonly message: string;

  constructor(parser: Parser<R>, message: string) {
    super(parser);
    this.message = message;
  }

  override parseOn(context: Context): Result<R> {
    const result = this.delegate.parseOn(context);
    if (result.kind === 'failure') return result;
    if (result.position < result.buffer.length) {
      return makeFailure({ buffer: result.buffer, position: result.position }, this.message);
    }
    return result;
  }

  override fastParseOn(buffer: string, position: number): number {
    const r = this.delegate.fastParseOn(buffer, position);
    return r < 0 || r < buffer.length ? -1 : r;
  }
}

/** Wrap `parser` so it must match the entire input. */
export function end<R>(parser: Parser<R>, options: { message?: string } = {}): Parser<R> {
  return new EndParser(parser, options.message ?? 'end of input expected');
}
