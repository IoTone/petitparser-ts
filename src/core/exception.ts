import type { Failure } from './result.ts';

/**
 * Thrown by convenience accessors that demand a successful parse but receive
 * a `Failure`. Carries the original `Failure` for inspection.
 *
 * Most callers should narrow on `result.kind === 'success'` instead of
 * triggering this exception — it exists for the ergonomics of throwing from
 * deeper code paths (e.g. `pattern()` constructing a character class).
 */
export class ParserException extends Error {
  readonly failure: Failure;

  constructor(failure: Failure) {
    super(`${failure.message} at position ${String(failure.position)}`);
    this.name = 'ParserException';
    this.failure = failure;
  }
}
