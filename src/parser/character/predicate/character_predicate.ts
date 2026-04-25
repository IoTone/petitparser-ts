/**
 * Tests whether a single UTF-16 code unit (the value of `String.charCodeAt(i)`)
 * is part of the character class.
 *
 * Concrete implementations (single, range, ranges, not, ...) form an algebra
 * that the character-parser factories combine into a final predicate before
 * wrapping it in a `CharacterParser`. Predicates expose `isEqualTo` so that
 * Phase 5 reflection / optimization passes can compare them structurally.
 *
 * Phase 1 deliberately operates on UTF-16 code units, not full Unicode code
 * points — surrogate-pair / `unicode: true` support lands in Phase 7 to mirror
 * upstream's 7.0.0 consolidation.
 */
export interface CharacterPredicate {
  test(value: number): boolean;
  isEqualTo(other: CharacterPredicate): boolean;
}
