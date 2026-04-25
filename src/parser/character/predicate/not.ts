import type { CharacterPredicate } from './character_predicate.ts';

/** Negates another predicate. Double-negation is collapsed by the factory. */
export class NotCharPredicate implements CharacterPredicate {
  readonly inner: CharacterPredicate;

  constructor(inner: CharacterPredicate) {
    this.inner = inner;
  }

  test(value: number): boolean {
    return !this.inner.test(value);
  }

  isEqualTo(other: CharacterPredicate): boolean {
    return other instanceof NotCharPredicate && this.inner.isEqualTo(other.inner);
  }
}

/** Negate a predicate, collapsing `not(not(p))` back to `p`. */
export function negatePredicate(inner: CharacterPredicate): CharacterPredicate {
  if (inner instanceof NotCharPredicate) return inner.inner;
  return new NotCharPredicate(inner);
}
