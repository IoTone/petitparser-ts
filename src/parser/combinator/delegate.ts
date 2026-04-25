import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import type { Result } from '../../core/result.ts';

/**
 * Wraps a single child `delegate` parser. Default `parseOn` forwards to it
 * unchanged. Subclasses (label, settable, future actions like `map`/`trim`/
 * `flatten`/`token`) override `parseOn` to transform the result.
 *
 * The `delegate` field is intentionally mutable so that `SettableParser` can
 * resolve forward references after grammar construction. Combinators that
 * don't need to mutate it should treat it as if it were `readonly`.
 */
export abstract class DelegateParser<I, O> extends Parser<O> {
  delegate: Parser<I>;

  constructor(delegate: Parser<I>) {
    super();
    this.delegate = delegate;
  }

  override parseOn(context: Context): Result<O> {
    // Default identity behavior is only correct when I === O. Subclasses with
    // a transforming output type must override this method.
    return this.delegate.parseOn(context) as unknown as Result<O>;
  }

  override fastParseOn(buffer: string, position: number): number {
    return this.delegate.fastParseOn(buffer, position);
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate];
  }
}
