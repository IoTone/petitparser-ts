import { Parser } from '../../core/parser.ts';
import { allMatches, type AllMatchesOptions, type ParserMatch } from '../../matcher/matches.ts';
import { toPattern, type ParserPattern } from '../../matcher/pattern.ts';

declare module '../../core/parser.ts' {
  interface Parser<R> {
    /** Lazy iterable over every place this parser matches inside `input`. */
    allMatches(input: string, options?: AllMatchesOptions): Generator<ParserMatch<R>>;
    /** Returns a `RegExp`-shaped adapter (with `lastIndex`/`exec`) over this parser. */
    toPattern(): ParserPattern<R> & { bind(input: string): ParserPattern<R> };
  }
}

Parser.prototype.allMatches = function <R>(
  this: Parser<R>,
  input: string,
  options?: AllMatchesOptions,
): Generator<ParserMatch<R>> {
  return allMatches(this, input, options);
};

Parser.prototype.toPattern = function <R>(
  this: Parser<R>,
): ParserPattern<R> & { bind(input: string): ParserPattern<R> } {
  return toPattern(this);
};
