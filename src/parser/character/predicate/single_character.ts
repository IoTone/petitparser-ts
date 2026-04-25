import type { CharacterPredicate } from './character_predicate.ts';

/** Matches exactly one specific code unit. */
export class SingleCharacterPredicate implements CharacterPredicate {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  test(value: number): boolean {
    return this.value === value;
  }

  isEqualTo(other: CharacterPredicate): boolean {
    return other instanceof SingleCharacterPredicate && other.value === this.value;
  }
}
