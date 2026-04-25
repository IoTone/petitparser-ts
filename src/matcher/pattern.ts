import type { Parser } from '../core/parser.ts';
import { allMatches, type ParserMatch } from './matches.ts';

/**
 * `RegExp`-shaped adapter over a parser. JavaScript has no `Pattern` interface
 * (Dart does), so this exposes the closest practical analogue: a stateful
 * object with `lastIndex` and `exec(input)`, plus a `[Symbol.iterator]` for
 * use with `for...of` to iterate every non-overlapping match across the input
 * since the last `lastIndex` reset.
 *
 * For most use cases prefer `allMatches(parser, input)` — `toPattern()` exists
 * for interop with code that already speaks the `RegExp` shape.
 */
export interface ParserPattern<R> {
  /** End of the most recent match. Set explicitly to control where the next `exec` starts. */
  lastIndex: number;
  /** Returns the next match at or after `lastIndex`, or `null` if none. Updates `lastIndex` on success. */
  exec(input: string): ParserMatch<R> | null;
  [Symbol.iterator](): Iterator<ParserMatch<R>>;
}

class StatefulPattern<R> implements ParserPattern<R> {
  lastIndex = 0;
  readonly #parser: Parser<R>;
  // For iterator support, we capture the input on the first call.
  #boundInput: string | null = null;

  constructor(parser: Parser<R>) {
    this.#parser = parser;
  }

  exec(input: string): ParserMatch<R> | null {
    const it = allMatches(this.#parser, input, { start: this.lastIndex });
    const next = it.next();
    if (next.done) return null;
    const match = next.value;
    this.lastIndex = match.position === match.start ? match.start + 1 : match.position;
    return match;
  }

  // Bind the iterator to a specific input by stashing it. Most users will use
  // `for (const m of allMatches(parser, input))` instead — this exists for
  // RegExp-shape consumers who do `for (const m of parser.toPattern())` after
  // a separate `pattern.bind(input)` style step. We keep it minimal for now.
  bind(input: string): this {
    this.#boundInput = input;
    this.lastIndex = 0;
    return this;
  }

  [Symbol.iterator](): Iterator<ParserMatch<R>> {
    if (this.#boundInput == null) {
      throw new Error('ParserPattern: call bind(input) before iterating');
    }
    return allMatches(this.#parser, this.#boundInput);
  }
}

export function toPattern<R>(parser: Parser<R>): ParserPattern<R> & { bind(input: string): ParserPattern<R> } {
  return new StatefulPattern(parser);
}
