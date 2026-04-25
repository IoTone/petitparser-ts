import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { DelegateParser } from '../combinator/delegate.ts';

/**
 * Transforms the value of `delegate`'s successful parse with `fn`. Failures
 * propagate unchanged. Position is preserved across the transform.
 */
export class MapParser<I, O> extends DelegateParser<I, O> {
  readonly fn: (value: I) => O;
  readonly hasSideEffects: boolean;

  constructor(parser: Parser<I>, fn: (value: I) => O, hasSideEffects = false) {
    super(parser);
    this.fn = fn;
    this.hasSideEffects = hasSideEffects;
  }

  override parseOn(context: Context): Result<O> {
    const r = this.delegate.parseOn(context);
    if (r.kind === 'failure') return r;
    return success({ buffer: r.buffer, position: r.position }, this.fn(r.value), r.position);
  }
}

/** Apply `fn` to the parsed value on success. */
export function map<I, O>(
  parser: Parser<I>,
  fn: (value: I) => O,
  options: { hasSideEffects?: boolean } = {},
): Parser<O> {
  return new MapParser(parser, fn, options.hasSideEffects);
}
