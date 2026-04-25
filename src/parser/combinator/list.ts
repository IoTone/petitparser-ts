import { Parser } from '../../core/parser.ts';

/**
 * Base class for parsers with an arbitrary number of child parsers, e.g.
 * `SequenceParser` and `ChoiceParser`. Stores them as a mutable internal
 * array exposed through the `parsers` getter (readonly externally) so that
 * `transformParser` can rebind individual children via `replace()` without
 * forcing every subclass to know how to reconstruct itself.
 */
export abstract class ListParser<R> extends Parser<R> {
  protected _parsers: Parser<unknown>[];

  constructor(parsers: readonly Parser<unknown>[]) {
    super();
    this._parsers = [...parsers];
  }

  get parsers(): readonly Parser<unknown>[] {
    return this._parsers;
  }

  override get children(): readonly Parser<unknown>[] {
    return this._parsers;
  }

  override copy(): this {
    const cloned = Object.create(Object.getPrototypeOf(this) as object) as this;
    Object.assign(cloned, this);
    cloned._parsers = [...this._parsers];
    return cloned;
  }

  override replace(source: Parser<unknown>, target: Parser<unknown>): void {
    for (let i = 0; i < this._parsers.length; i++) {
      if (this._parsers[i] === source) this._parsers[i] = target;
    }
  }
}
