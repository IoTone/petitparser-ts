import type { CharacterPredicate } from './character_predicate.ts';
import { ConstantCharPredicate } from './constant.ts';
import { RangeCharPredicate } from './range.ts';
import { SingleCharacterPredicate } from './single_character.ts';

/**
 * Matches code units in any of a sorted, non-overlapping set of inclusive
 * ranges, encoded as parallel `starts`/`stops` arrays. Lookup is O(log n)
 * via binary search.
 *
 * Constructor callers must pre-sort and non-overlap the ranges. Use the
 * `rangesPredicate(...)` factory below for arbitrary input.
 */
export class RangesCharPredicate implements CharacterPredicate {
  readonly starts: readonly number[];
  readonly stops: readonly number[];

  constructor(starts: readonly number[], stops: readonly number[]) {
    if (starts.length !== stops.length) {
      throw new Error('starts/stops length mismatch');
    }
    this.starts = starts;
    this.stops = stops;
  }

  test(value: number): boolean {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (value < this.starts[mid]!) {
        hi = mid - 1;
      } else if (value > this.stops[mid]!) {
        lo = mid + 1;
      } else {
        return true;
      }
    }
    return false;
  }

  isEqualTo(other: CharacterPredicate): boolean {
    if (!(other instanceof RangesCharPredicate)) return false;
    if (other.starts.length !== this.starts.length) return false;
    for (let i = 0; i < this.starts.length; i++) {
      if (this.starts[i] !== other.starts[i] || this.stops[i] !== other.stops[i]) return false;
    }
    return true;
  }
}

/**
 * Build a `CharacterPredicate` from a list of `[start, stop]` ranges. Sorts,
 * merges overlaps and adjacencies, and returns the smallest-possible predicate:
 * empty -> `ConstantCharPredicate(false)`, one singleton -> `SingleCharacterPredicate`,
 * one range -> `RangeCharPredicate`, otherwise `RangesCharPredicate`.
 */
export function rangesPredicate(ranges: readonly (readonly [number, number])[]): CharacterPredicate {
  if (ranges.length === 0) {
    return new ConstantCharPredicate(false);
  }
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const starts: number[] = [];
  const stops: number[] = [];
  let curStart = sorted[0]![0];
  let curStop = sorted[0]![1];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i]!;
    if (s <= curStop + 1) {
      if (e > curStop) curStop = e;
    } else {
      starts.push(curStart);
      stops.push(curStop);
      curStart = s;
      curStop = e;
    }
  }
  starts.push(curStart);
  stops.push(curStop);

  if (starts.length === 1) {
    if (starts[0] === stops[0]) return new SingleCharacterPredicate(starts[0]!);
    return new RangeCharPredicate(starts[0]!, stops[0]!);
  }
  return new RangesCharPredicate(starts, stops);
}
