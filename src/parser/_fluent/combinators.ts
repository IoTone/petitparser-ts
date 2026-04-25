/**
 * Fluent / instance-method form of every Phase 2 combinator.
 *
 * These re-exports are typed via TypeScript module augmentation: importing
 * this file (directly or via the public barrel) installs methods on
 * `Parser.prototype` and on the corresponding interface declaration. Tree-
 * shake-friendly users who only want the free-function forms can skip this
 * import.
 */
import { Parser } from '../../core/parser.ts';
import { and } from '../combinator/and.ts';
import { ChoiceParser, type FailureJoiner } from '../combinator/choice.ts';
import { end } from '../combinator/end.ts';
import { neg } from '../combinator/neg.ts';
import { not } from '../combinator/not.ts';
import { optional } from '../combinator/optional.ts';
import { type ChoiceResult } from '../combinator/or.ts';
import { type SequenceResult } from '../combinator/seq.ts';
import { SequenceParser } from '../combinator/sequence.ts';
import type { SettableParser } from '../combinator/settable.ts';
import { settable } from '../combinator/settable.ts';
import { skip } from '../combinator/skip.ts';

declare module '../../core/parser.ts' {
  interface Parser<R> {
    /** Sequence: `this` followed by each `other`, value tupled in order. */
    seq<T extends readonly Parser<unknown>[]>(
      ...others: T
    ): Parser<readonly [R, ...SequenceResult<T>]>;

    /** Choice: `this` or any `other`. The first to succeed wins. */
    or<T extends readonly Parser<unknown>[]>(...others: T): Parser<R | ChoiceResult<T>>;

    /** Choice with an explicit failure-joiner. */
    orWith<T extends readonly Parser<unknown>[]>(
      failureJoiner: FailureJoiner,
      ...others: T
    ): Parser<R | ChoiceResult<T>>;

    /** Optional — succeeds with `undefined` on miss. */
    optional(): Parser<R | undefined>;
    /** Optional with a fallback value. */
    optional<O>(otherwise: O): Parser<R | O>;

    /** Positive lookahead. */
    and(): Parser<R>;

    /** Negative lookahead. */
    not(options?: { message?: string }): Parser<undefined>;

    /** Char-level negation: consume one character iff `this` would fail. */
    neg(options?: { message?: string }): Parser<string>;

    /** Wrap so that `this` must consume the entire input. */
    end(options?: { message?: string }): Parser<R>;

    /** Wrap with optional `before` / `after` parsers whose values are discarded. */
    skip(options?: { before?: Parser<unknown>; after?: Parser<unknown> }): Parser<R>;

    /** Wrap as a settable forward-reference (rarely used; prefer `settable()`). */
    settable(): SettableParser<R>;
  }
}

Parser.prototype.seq = function <R, T extends readonly Parser<unknown>[]>(
  this: Parser<R>,
  ...others: T
): Parser<readonly [R, ...SequenceResult<T>]> {
  return new SequenceParser([this, ...others]) as unknown as Parser<readonly [R, ...SequenceResult<T>]>;
};

Parser.prototype.or = function <R, T extends readonly Parser<unknown>[]>(
  this: Parser<R>,
  ...others: T
): Parser<R | ChoiceResult<T>> {
  return new ChoiceParser([this, ...others] as readonly Parser<unknown>[]) as unknown as Parser<
    R | ChoiceResult<T>
  >;
};

Parser.prototype.orWith = function <R, T extends readonly Parser<unknown>[]>(
  this: Parser<R>,
  failureJoiner: FailureJoiner,
  ...others: T
): Parser<R | ChoiceResult<T>> {
  return new ChoiceParser(
    [this, ...others] as readonly Parser<unknown>[],
    failureJoiner,
  ) as unknown as Parser<R | ChoiceResult<T>>;
};

Parser.prototype.optional = function <R, O>(
  this: Parser<R>,
  otherwise?: O,
): Parser<R | O | undefined> {
  return optional(this, otherwise as O);
};

Parser.prototype.and = function <R>(this: Parser<R>): Parser<R> {
  return and(this);
};

Parser.prototype.not = function <R>(
  this: Parser<R>,
  options?: { message?: string },
): Parser<undefined> {
  return not(this, options);
};

Parser.prototype.neg = function <R>(
  this: Parser<R>,
  options?: { message?: string },
): Parser<string> {
  return neg(this, options);
};

Parser.prototype.end = function <R>(
  this: Parser<R>,
  options?: { message?: string },
): Parser<R> {
  return end(this, options);
};

Parser.prototype.skip = function <R>(
  this: Parser<R>,
  options?: { before?: Parser<unknown>; after?: Parser<unknown> },
): Parser<R> {
  return skip(this, options);
};

Parser.prototype.settable = function <R>(this: Parser<R>): SettableParser<R> {
  const s = settable<R>();
  s.delegate = this;
  return s;
};
