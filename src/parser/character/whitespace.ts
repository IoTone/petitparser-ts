import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import type { CharacterPredicate } from './predicate/character_predicate.ts';

/**
 * Whitespace predicate matching the same set as Dart's `whitespace()`:
 * ASCII whitespace (TAB, LF, VT, FF, CR, SP, NEL, NBSP) plus a curated set of
 * Unicode whitespace code units (OGHAM, EN QUAD..ZWNBSP, etc.). The hot path
 * (value < 0x100) is checked with cheap branches; the cold path uses a switch.
 */
class WhitespacePredicate implements CharacterPredicate {
  test(value: number): boolean {
    if (value < 0x100) {
      return (
        value === 0x09 ||
        value === 0x0a ||
        value === 0x0b ||
        value === 0x0c ||
        value === 0x0d ||
        value === 0x20 ||
        value === 0x85 ||
        value === 0xa0
      );
    }
    switch (value) {
      case 0x1680:
      case 0x2000:
      case 0x2001:
      case 0x2002:
      case 0x2003:
      case 0x2004:
      case 0x2005:
      case 0x2006:
      case 0x2007:
      case 0x2008:
      case 0x2009:
      case 0x200a:
      case 0x2028:
      case 0x2029:
      case 0x202f:
      case 0x205f:
      case 0x3000:
      case 0xfeff:
        return true;
      default:
        return false;
    }
  }

  isEqualTo(other: CharacterPredicate): boolean {
    return other instanceof WhitespacePredicate;
  }
}

const WHITESPACE_PREDICATE = new WhitespacePredicate();

/** Matches one whitespace character (ASCII + selected Unicode). */
export function whitespace(options: { message?: string } = {}): Parser<string> {
  return new CharacterParser(WHITESPACE_PREDICATE, options.message ?? 'whitespace expected');
}
