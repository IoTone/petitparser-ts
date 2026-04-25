import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { negatePredicate } from './predicate/not.ts';
import { rangesPredicate } from './predicate/ranges.ts';

/**
 * Matches any single character *not* appearing in `chars`. See `anyOf` for
 * UTF-16 vs Unicode mode semantics.
 */
export function noneOf(
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
    negatePredicate(rangesPredicate(ranges)),
    options.message ?? `none of ${JSON.stringify(chars)} expected`,
    unicode,
  );
}
