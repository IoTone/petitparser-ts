import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { failure as makeFailure, success, type Result } from '../../core/result.ts';
import { DelegateParser } from '../combinator/delegate.ts';

/**
 * Discards the structured value and returns the substring of input that
 * `delegate` consumed. Equivalent to upstream Dart's `.flatten()`.
 *
 * Replaces the legacy 2014 array-join behavior — `digit().plus().flatten()`
 * yields `"123"` (not `["1","2","3"].join('')`) by reading the buffer directly.
 */
export class FlattenParser<R> extends DelegateParser<R, string> {
  readonly message: string | null;

  constructor(parser: Parser<R>, message: string | null = null) {
    super(parser);
    this.message = message;
  }

  override parseOn(context: Context): Result<string> {
    const start = context.position;
    const r = this.delegate.parseOn(context);
    if (r.kind === 'failure') {
      if (this.message != null) return makeFailure(context, this.message);
      return r;
    }
    return success({ buffer: r.buffer, position: r.position }, r.buffer.substring(start, r.position), r.position);
  }

  override fastParseOn(buffer: string, position: number): number {
    return this.delegate.fastParseOn(buffer, position);
  }
}

export function flatten<R>(parser: Parser<R>, options: { message?: string } = {}): Parser<string> {
  return new FlattenParser(parser, options.message ?? null);
}
