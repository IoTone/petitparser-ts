import type { Parser } from '../core/parser.ts';
import { settable, type SettableParser } from '../parser/combinator/settable.ts';
import { ExpressionGroup } from './group.ts';

/**
 * Operator-precedence parser builder.
 *
 * Usage:
 *
 *     const builder = new ExpressionBuilder<number>();
 *     builder.primitive(digit().plus().flatten().trim().map(Number));
 *
 *     // Lowest precedence first.
 *     builder.group()
 *       .left(char('+').trim(), (l, _, r) => l + r)
 *       .left(char('-').trim(), (l, _, r) => l - r);
 *     builder.group()
 *       .left(char('*').trim(), (l, _, r) => l * r)
 *       .left(char('/').trim(), (l, _, r) => l / r);
 *     builder.group()
 *       .right(char('^').trim(), (l, _, r) => l ** r);
 *     builder.group()
 *       .prefix(char('-').trim(), (_, v) => -v)
 *       .wrapper(char('(').trim(), char(')').trim(), (_, v) => v);
 *
 *     const expr = builder.build();
 *     expr.parse('1 + 2 * 3').value === 7
 *     expr.parse('2^3^2').value === 512  // right-associative: 2^(3^2)
 *
 * Each `.group()` call adds a higher-precedence level than the previous one.
 * The order *within* a group is fixed (prefix → postfix → left → right) — if
 * you need a different ordering, split into multiple groups.
 *
 * `loopback` (read-only) returns the topmost parser; useful for grammars that
 * need to embed the full expression elsewhere (e.g. inside a function call).
 */
export class ExpressionBuilder<T> {
  #primitive: Parser<T> | null = null;
  readonly #groups: ExpressionGroup<T>[] = [];
  readonly #loopback: SettableParser<T> = settable<T>('expression loopback used before build()');

  /** The topmost parser, available even before `build()` for use inside wrappers. */
  get loopback(): Parser<T> {
    return this.#loopback;
  }

  /** Set the leaf parser (the operand). Must be called exactly once before `build()`. */
  primitive(parser: Parser<T>): this {
    if (this.#primitive !== null) {
      throw new Error('ExpressionBuilder.primitive() may only be called once');
    }
    this.#primitive = parser;
    return this;
  }

  /** Begin a new precedence group, lower precedence than the previous one. */
  group(): ExpressionGroup<T> {
    const g = new ExpressionGroup<T>();
    this.#groups.push(g);
    return g;
  }

  /**
   * Build the final parser. The topmost (lowest-precedence) group wraps the
   * result; wrappers inside any group can recurse via `loopback`.
   */
  build(): Parser<T> {
    if (this.#primitive === null) {
      throw new Error('ExpressionBuilder.build() requires a primitive() call first');
    }
    let parser: Parser<T> = this.#primitive;
    // Iterate groups from highest precedence (last added) to lowest (first added),
    // so the lowest-precedence group ends up as the outermost / entry parser.
    for (let i = this.#groups.length - 1; i >= 0; i--) {
      parser = this.#groups[i]!.build(parser, this.#loopback);
    }
    this.#loopback.set(parser);
    return parser;
  }
}
