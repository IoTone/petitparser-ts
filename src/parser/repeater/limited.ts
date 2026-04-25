import type { Parser } from '../../core/parser.ts';
import { RepeatingParser } from './repeating.ts';

/**
 * Common base for `GreedyRepeatingParser` and `LazyRepeatingParser`: a
 * repetition that stops based on a separate `limit` parser rather than the
 * inner parser's failure point.
 */
export abstract class LimitedRepeatingParser<R> extends RepeatingParser<R, R[]> {
  readonly limit: Parser<unknown>;

  constructor(parser: Parser<R>, limit: Parser<unknown>, min: number, max: number) {
    super(parser, min, max);
    this.limit = limit;
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate, this.limit];
  }
}
