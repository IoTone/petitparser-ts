import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { failure as makeFailure, type Failure, type Result } from '../../core/result.ts';
import { ListParser } from './list.ts';

/**
 * Strategy for combining failures across choice alternatives.
 *
 * Mirrors upstream Dart's `FailureJoiner`. The strategy is invoked when a
 * choice tries multiple alternatives and they all fail; it picks (or fuses)
 * the failure that gets reported to the caller.
 */
export type FailureJoiner = (current: Failure, next: Failure) => Failure;

/** Default. Reports the failure of the *last* alternative tried. */
export const selectLast: FailureJoiner = (_current, next) => next;

/** Reports the failure that consumed the most input — most useful for diagnostics. */
export const selectFarthest: FailureJoiner = (current, next) =>
  next.position >= current.position ? next : current;

/** Like `selectFarthest`, but joins the messages when positions tie. */
export const selectFarthestJoined: FailureJoiner = (current, next) => {
  if (next.position > current.position) return next;
  if (next.position < current.position) return current;
  if (current.message === next.message) return current;
  return {
    kind: 'failure',
    buffer: current.buffer,
    position: current.position,
    message: `${current.message} OR ${next.message}`,
  };
};

/**
 * Tries each child parser in order. Returns the first success, or — if all
 * fail — the failure picked by `failureJoiner` (default: `selectLast`).
 */
export class ChoiceParser<R> extends ListParser<R> {
  readonly failureJoiner: FailureJoiner;

  constructor(parsers: readonly Parser<R>[], failureJoiner: FailureJoiner = selectLast) {
    super(parsers);
    this.failureJoiner = failureJoiner;
  }

  override parseOn(context: Context): Result<R> {
    let lastFailure: Failure = makeFailure(context, 'no choices given', context.position);
    for (let i = 0; i < this.parsers.length; i++) {
      const result = (this.parsers[i] as Parser<R>).parseOn(context);
      if (result.kind === 'success') return result;
      lastFailure = i === 0 ? result : this.failureJoiner(lastFailure, result);
    }
    return lastFailure;
  }

  override fastParseOn(buffer: string, position: number): number {
    for (let i = 0; i < this.parsers.length; i++) {
      const r = this.parsers[i]!.fastParseOn(buffer, position);
      if (r >= 0) return r;
    }
    return -1;
  }
}
