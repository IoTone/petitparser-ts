import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { rangesPredicate } from './predicate/ranges.ts';

/**
 * Matches any single character appearing in `chars`.
 *
 * Builds a `RangesCharPredicate` (binary search) for sets of more than a few
 * characters; small sets collapse to `SingleCharacterPredicate` or
 * `RangeCharPredicate` automatically via `rangesPredicate`.
 *
 * In UTF-16 mode (default), `chars` is iterated by code unit. With
 * `{ unicode: true }`, `chars` is iterated by code point so a surrogate-pair
 * character contributes one entry to the predicate, not two.
 */
export function anyOf(
  chars: string,
  options: { message?: string; unicode?: boolean } = {},
): Parser<string> {
  const unicode = options.unicode ?? false;
  const ranges: [number, number][] = [];
  if (unicode) {
    for (const ch of chars) {
      const code = ch.codePointAt(0);
      if (code !== undefined) ranges.push([code, code]);
    }
  } else {
    for (let i = 0; i < chars.length; i++) {
      const code = chars.charCodeAt(i);
      ranges.push([code, code]);
    }
  }
  return new CharacterParser(
    rangesPredicate(ranges),
    options.message ?? `any of ${JSON.stringify(chars)} expected`,
    unicode,
  );
}
