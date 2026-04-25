import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';

/** Always succeeds, consumes nothing, returns `undefined`. */
export class EpsilonParser<R> extends Parser<R> {
  readonly value: R;

  constructor(value: R) {
    super();
    this.value = value;
  }

  override parseOn(context: Context): Result<R> {
    return success(context, this.value);
  }

  override fastParseOn(_buffer: string, position: number): number {
    return position;
  }
}

/** Matches the empty input — always succeeds, returns `undefined`. */
export function epsilon(): Parser<undefined> {
  return new EpsilonParser<undefined>(undefined);
}

/** Matches the empty input — always succeeds, returns `value` typed as `R`. */
export function epsilonWith<R>(value: R): Parser<R> {
  return new EpsilonParser<R>(value);
}
