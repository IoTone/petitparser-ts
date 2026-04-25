import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { rangesPredicate } from './predicate/ranges.ts';

/**
 * Matches any single code unit appearing in `chars`.
 *
 * Builds a `RangesCharPredicate` (binary search) for sets of more than a few
 * characters; small sets collapse to `SingleCharacterPredicate` or
 * `RangeCharPredicate` automatically via `rangesPredicate`.
 */
export function anyOf(chars: string, options: { message?: string } = {}): Parser<string> {
  const ranges: [number, number][] = [];
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    ranges.push([code, code]);
  }
  return new CharacterParser(
    rangesPredicate(ranges),
    options.message ?? `any of ${JSON.stringify(chars)} expected`,
  );
}
