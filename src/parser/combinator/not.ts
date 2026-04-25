import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { failure as makeFailure, success, type Result } from '../../core/result.ts';
import { DelegateParser } from './delegate.ts';

/**
 * Negative lookahead. Succeeds (with `undefined`) iff `delegate` fails at the
 * current position. Consumes nothing in either case.
 */
export class NotParser<R> extends DelegateParser<R, undefined> {
  readonly message: string;

  constructor(parser: Parser<R>, message: string) {
    super(parser);
    this.message = message;
  }

  override parseOn(context: Context): Result<undefined> {
    const result = this.delegate.parseOn(context);
    if (result.kind === 'failure') return success(context, undefined);
    return makeFailure(context, this.message);
  }

  override fastParseOn(buffer: string, position: number): number {
    const r = this.delegate.fastParseOn(buffer, position);
    return r < 0 ? position : -1;
  }
}

/** Negative lookahead — succeeds when `parser` fails. */
export function not<R>(parser: Parser<R>, options: { message?: string } = {}): Parser<undefined> {
  return new NotParser(parser, options.message ?? 'success not expected');
}
