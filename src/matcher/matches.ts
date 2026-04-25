import type { Parser } from '../core/parser.ts';
import type { Success } from '../core/result.ts';

export interface AllMatchesOptions {
  /** Position to start scanning from. Default `0`. */
  start?: number;
  /** When true, after a match resume from `matchStart + 1` instead of `matchEnd`. Default `false`. */
  overlapping?: boolean;
}

/**
 * A single match returned by `allMatches`. Extends `Success<R>` with `start`
 * (the position where the match began); `position` is the position right
 * after the match (where the next scan resumes by default).
 */
export interface ParserMatch<R> extends Success<R> {
  readonly start: number;
}

/**
 * Lazy iterable of every place `parser` matches inside `input`. By default,
 * non-overlapping: after a successful match `[start, end)`, the next attempt
 * starts at `end` (or at `start + 1` for zero-width matches, to make progress).
 * With `overlapping: true`, every position is tried.
 *
 * Replaces the legacy `matches` / `matchesSkipping` pair with a single iterator.
 */
export function* allMatches<R>(
  parser: Parser<R>,
  input: string,
  options: AllMatchesOptions = {},
): Generator<ParserMatch<R>> {
  const overlapping = options.overlapping ?? false;
  let position = Math.max(0, options.start ?? 0);
  while (position <= input.length) {
    const result = parser.parseOn({ buffer: input, position });
    if (result.kind === 'success') {
      const match: ParserMatch<R> = {
        kind: 'success',
        buffer: result.buffer,
        position: result.position,
        value: result.value,
        start: position,
      };
      yield match;
      if (overlapping) {
        position = position + 1;
      } else {
        position = result.position === position ? position + 1 : result.position;
      }
    } else {
      position = position + 1;
    }
  }
}
