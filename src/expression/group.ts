import type { Parser } from '../core/parser.ts';
import { map } from '../parser/action/map.ts';
import { or } from '../parser/combinator/or.ts';
import { seq } from '../parser/combinator/seq.ts';
import { star } from '../parser/repeater/possessive.ts';

/**
 * Per-precedence group of an `ExpressionBuilder`. Holds the operator
 * declarations (wrappers, prefixes, postfixes, left/right-associative binaries,
 * optionality flag) for one level. The builder snapshots groups in the order
 * they were declared and lets each one wrap the next-higher-precedence parser
 * during `build()`.
 *
 * Precedence: groups added earlier are *lower* precedence (they end up further
 * out in the parser tree). Within a single group, the application order is
 * fixed: prefix → postfix → left-binary → right-binary, and wrappers act as
 * additional alternatives at the level (so `(...)` can re-enter the topmost
 * loopback parser).
 */
export class ExpressionGroup<T> {
  readonly wrappers: Wrapper<T>[] = [];
  readonly prefixes: Prefix<T>[] = [];
  readonly postfixes: Postfix<T>[] = [];
  readonly lefts: Binary<T>[] = [];
  readonly rights: Binary<T>[] = [];
  isOptional = false;

  /** Add a wrapper operator (e.g. `(`, `)` for parens). Re-enters the topmost parser. */
  wrapper<L, R>(left: Parser<L>, right: Parser<R>, build: (l: L, v: T, r: R) => T): this {
    this.wrappers.push({
      left: left,
      right: right,
      build: build as (l: unknown, v: T, r: unknown) => T,
    });
    return this;
  }

  /** Add a prefix unary operator (e.g. `-` for negation). */
  prefix<O>(op: Parser<O>, build: (op: O, value: T) => T): this {
    this.prefixes.push({
      op: op,
      build: build as (op: unknown, value: T) => T,
    });
    return this;
  }

  /** Add a postfix unary operator (e.g. `!` for factorial). */
  postfix<O>(op: Parser<O>, build: (value: T, op: O) => T): this {
    this.postfixes.push({
      op: op,
      build: build as (value: T, op: unknown) => T,
    });
    return this;
  }

  /** Add a left-associative binary operator (e.g. `+`, `-`). */
  left<O>(op: Parser<O>, build: (left: T, op: O, right: T) => T): this {
    this.lefts.push({
      op: op,
      build: build as (left: T, op: unknown, right: T) => T,
    });
    return this;
  }

  /** Add a right-associative binary operator (e.g. `^`, `=`). */
  right<O>(op: Parser<O>, build: (left: T, op: O, right: T) => T): this {
    this.rights.push({
      op: op,
      build: build as (left: T, op: unknown, right: T) => T,
    });
    return this;
  }

  /** Mark this whole precedence level as optional — falling through on miss. */
  optional(): this {
    this.isOptional = true;
    return this;
  }

  /**
   * Internal — invoked by `ExpressionBuilder.build()`. Wraps `inner` (the
   * next-higher-precedence parser) with this group's operators, returning the
   * level's combined parser. `loopback` is the topmost parser (used by
   * wrappers to re-enter the full expression).
   */
  build(inner: Parser<T>, loopback: Parser<T>): Parser<T> {
    let level: Parser<T> = inner;

    if (this.wrappers.length > 0) {
      const wrapperAlts = this.wrappers.map((w) =>
        map(seq(w.left, loopback, w.right), ([l, v, r]) => w.build(l, v, r)),
      );
      level = or(level, ...wrapperAlts);
    }

    if (this.prefixes.length > 0) {
      const opChoice = or(
        ...this.prefixes.map((p) => map(p.op, (op) => ({ op, build: p.build }))),
      );
      level = map(seq(star(opChoice), level), ([prefixes, value]) =>
        prefixes.reduceRight((acc, p) => p.build(p.op, acc), value),
      );
    }

    if (this.postfixes.length > 0) {
      const opChoice = or(
        ...this.postfixes.map((p) => map(p.op, (op) => ({ op, build: p.build }))),
      );
      level = map(seq(level, star(opChoice)), ([value, postfixes]) =>
        postfixes.reduce((acc, p) => p.build(acc, p.op), value),
      );
    }

    if (this.lefts.length > 0) {
      const opChoice = or(...this.lefts.map((p) => map(p.op, (op) => ({ op, build: p.build }))));
      level = map(seq(level, star(seq(opChoice, level))), ([first, rest]) =>
        rest.reduce((acc, [opPair, right]) => opPair.build(acc, opPair.op, right), first),
      );
    }

    if (this.rights.length > 0) {
      const opChoice = or(...this.rights.map((p) => map(p.op, (op) => ({ op, build: p.build }))));
      level = map(seq(level, star(seq(opChoice, level))), ([first, rest]) => {
        if (rest.length === 0) return first;
        // Right-associative reduction: combine from the right.
        // For `a op1 b op2 c op3 d`: result = op1(a, op2(b, op3(c, d)))
        let acc = rest[rest.length - 1]![1];
        for (let i = rest.length - 1; i >= 1; i--) {
          const [pair] = rest[i]!;
          const [, prevRight] = rest[i - 1]!;
          acc = pair.build(prevRight, pair.op, acc);
        }
        const [firstPair] = rest[0]!;
        return firstPair.build(first, firstPair.op, acc);
      });
    }

    if (this.isOptional) {
      level = or(level, inner);
    }

    return level;
  }
}

interface Wrapper<T> {
  left: Parser<unknown>;
  right: Parser<unknown>;
  build: (l: unknown, v: T, r: unknown) => T;
}

interface Prefix<T> {
  op: Parser<unknown>;
  build: (op: unknown, value: T) => T;
}

interface Postfix<T> {
  op: Parser<unknown>;
  build: (value: T, op: unknown) => T;
}

interface Binary<T> {
  op: Parser<unknown>;
  build: (left: T, op: unknown, right: T) => T;
}
