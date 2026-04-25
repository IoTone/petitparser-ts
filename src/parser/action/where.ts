import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { failure as makeFailure, type Result } from '../../core/result.ts';
import { DelegateParser } from '../combinator/delegate.ts';

/**
 * Semantic predicate: succeeds only when `delegate` succeeds AND `predicate`
 * accepts the parsed value. On rejection, fails at the position where
 * `delegate` succeeded with `failureFactory(value)` (or a default message).
 */
export class WhereParser<R> extends DelegateParser<R, R> {
  readonly predicate: (value: R) => boolean;
  readonly failureFactory: (value: R) => string;

  constructor(
    parser: Parser<R>,
    predicate: (value: R) => boolean,
    failureFactory: (value: R) => string = (v) => `predicate not satisfied: ${String(v)}`,
  ) {
    super(parser);
    this.predicate = predicate;
    this.failureFactory = failureFactory;
  }

  override parseOn(context: Context): Result<R> {
    const r = this.delegate.parseOn(context);
    if (r.kind === 'failure') return r;
    if (this.predicate(r.value)) return r;
    return makeFailure({ buffer: r.buffer, position: r.position }, this.failureFactory(r.value));
  }
}

export function where<R>(
  parser: Parser<R>,
  predicate: (value: R) => boolean,
  options: { failureFactory?: (value: R) => string } = {},
): Parser<R> {
  return new WhereParser(parser, predicate, options.failureFactory);
}
