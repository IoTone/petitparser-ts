import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import type { CharacterPredicate } from './predicate/character_predicate.ts';
import { negatePredicate } from './predicate/not.ts';
import { rangesPredicate } from './predicate/ranges.ts';

/**
 * Builds a character-class parser from a regex-like class string.
 *
 * The body (no surrounding `[...]`) supports:
 * - single chars: `"abc"` matches `a`, `b`, or `c`.
 * - ranges: `"a-z"` matches any lowercase letter.
 * - mixed: `"ac-df-"` matches `a`, `c`, `d`, `f`, or a literal `-`.
 * - leading `^` negates: `"^a-c"` matches anything except `a`, `b`, or `c`.
 *
 * A trailing or leading `-` is treated as the literal hyphen character (i.e.
 * `"-az"` matches `-`, `a`, or `z`; `"a-"` matches `a` or `-`).
 *
 * Phase 1 implements this as a hand-rolled scanner — bootstrapping with the
 * combinator parsers themselves (as upstream Dart does) is deferred until
 * those combinators land in Phase 2.
 */
export function pattern(body: string, options: { message?: string } = {}): Parser<string> {
  const message = options.message ?? `[${body}] expected`;
  const negated = body.startsWith('^');
  const inner = negated ? body.slice(1) : body;
  let predicate = parsePatternBody(inner);
  if (negated) predicate = negatePredicate(predicate);
  return new CharacterParser(predicate, message);
}

function parsePatternBody(body: string): CharacterPredicate {
  const ranges: [number, number][] = [];
  let i = 0;
  while (i < body.length) {
    const startCode = body.charCodeAt(i);
    // Range form `X-Y`, but only if the `-` is not the trailing character and
    // the `-` is not at the start of the body (handled by leading-hyphen below).
    if (i + 2 < body.length && body.charCodeAt(i + 1) === 0x2d /* '-' */) {
      const stopCode = body.charCodeAt(i + 2);
      if (stopCode < startCode) {
        throw new Error(
          `pattern(): invalid range "${body.charAt(i)}-${body.charAt(i + 2)}" (start > stop)`,
        );
      }
      ranges.push([startCode, stopCode]);
      i += 3;
    } else {
      ranges.push([startCode, startCode]);
      i += 1;
    }
  }
  return rangesPredicate(ranges);
}
