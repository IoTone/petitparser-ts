import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { negatePredicate } from './predicate/not.ts';
import { rangesPredicate } from './predicate/ranges.ts';

/** Matches any single code unit *not* appearing in `chars`. */
export function noneOf(chars: string, options: { message?: string } = {}): Parser<string> {
  const ranges: [number, number][] = [];
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    ranges.push([code, code]);
  }
  return new CharacterParser(
    negatePredicate(rangesPredicate(ranges)),
    options.message ?? `none of ${JSON.stringify(chars)} expected`,
  );
}
