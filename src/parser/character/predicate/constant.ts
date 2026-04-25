import type { CharacterPredicate } from './character_predicate.ts';

/** Predicate that always returns the same constant. Used by `any()` (true). */
export class ConstantCharPredicate implements CharacterPredicate {
  readonly result: boolean;

  constructor(result: boolean) {
    this.result = result;
  }

  test(_value: number): boolean {
    return this.result;
  }

  isEqualTo(other: CharacterPredicate): boolean {
    return other instanceof ConstantCharPredicate && other.result === this.result;
  }
}
