import { Parser } from '../../core/parser.ts';

/** Sentinel for "no upper bound". Use whenever a repeater max is open. */
export const UNBOUNDED = Number.MAX_SAFE_INTEGER;

/**
 * Base class for all repeating parsers (possessive, greedy, lazy). Holds a
 * `delegate` (the inner parser), `min` (required minimum count), and `max`
 * (optional maximum, `UNBOUNDED` for none).
 *
 * Subclasses implement the actual repetition strategy.
 */
export abstract class RepeatingParser<R, V> extends Parser<V> {
  readonly delegate: Parser<R>;
  readonly min: number;
  readonly max: number;

  constructor(parser: Parser<R>, min: number, max: number) {
    super();
    if (min < 0) throw new Error(`min must be >= 0, got ${String(min)}`);
    if (max < min) throw new Error(`max (${String(max)}) must be >= min (${String(min)})`);
    this.delegate = parser;
    this.min = min;
    this.max = max;
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate];
  }
}
