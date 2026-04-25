import { Parser } from '../../core/parser.ts';

/**
 * Base class for parsers with an arbitrary number of child parsers, e.g.
 * `SequenceParser` and `ChoiceParser`. Stores them as a readonly list and
 * exposes them via the `children` getter.
 *
 * The `children` array reference is stable across calls so reflection passes
 * can rely on identity. Replacement (Phase 5) will return a new instance
 * rather than mutating in place.
 */
export abstract class ListParser<R> extends Parser<R> {
  readonly parsers: readonly Parser<unknown>[];

  constructor(parsers: readonly Parser<unknown>[]) {
    super();
    this.parsers = parsers;
  }

  override get children(): readonly Parser<unknown>[] {
    return this.parsers;
  }
}
