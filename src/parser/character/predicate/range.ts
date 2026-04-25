import type { CharacterPredicate } from './character_predicate.ts';

/** Matches code units in the inclusive range `[start, stop]`. */
export class RangeCharPredicate implements CharacterPredicate {
  readonly start: number;
  readonly stop: number;

  constructor(start: number, stop: number) {
    if (start > stop) {
      throw new Error(`invalid character range: start (${String(start)}) > stop (${String(stop)})`);
    }
    this.start = start;
    this.stop = stop;
  }

  test(value: number): boolean {
    return this.start <= value && value <= this.stop;
  }

  isEqualTo(other: CharacterPredicate): boolean {
    return (
      other instanceof RangeCharPredicate && other.start === this.start && other.stop === this.stop
    );
  }
}
