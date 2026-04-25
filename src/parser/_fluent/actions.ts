import { Parser } from '../../core/parser.ts';
import type { Token } from '../../core/token.ts';
import { cast } from '../action/cast.ts';
import { castList } from '../action/cast_list.ts';
import { constant } from '../action/constant.ts';
import { flatten } from '../action/flatten.ts';
import { labeled } from '../action/labeled.ts';
import { map } from '../action/map.ts';
import { permute } from '../action/permute.ts';
import { pick } from '../action/pick.ts';
import { token } from '../action/token.ts';
import { trim } from '../action/trim.ts';
import { where } from '../action/where.ts';

declare module '../../core/parser.ts' {
  interface Parser<R> {
    /** Transform the value with `fn`. */
    map<O>(fn: (value: R) => O, options?: { hasSideEffects?: boolean }): Parser<O>;

    /** Pick the `index`-th element. Negative indexes count from the end. Requires R to be array-like. */
    pick<E>(this: Parser<readonly E[]>, index: number): Parser<E>;

    /** Reorder an array result. Requires R to be array-like. */
    permute<E>(this: Parser<readonly E[]>, indexes: readonly number[]): Parser<E[]>;

    /** Replace the value with the substring of input that this parser consumed. */
    flatten(options?: { message?: string }): Parser<string>;

    /** Wrap the value in a `Token<R>` carrying the buffer span and line/column. */
    token(): Parser<Token<R>>;

    /** Trim matches of `before`/`after` (default: `whitespace()`) before and after this parser. */
    trim(before?: Parser<unknown>, after?: Parser<unknown>): Parser<R>;

    /** Type-only cast. Runtime no-op. */
    cast<T>(): Parser<T>;

    /** Type-only cast of array elements. Requires R to be array-like. */
    castList<T>(this: Parser<readonly unknown[]>): Parser<T[]>;

    /** Replace the value with `value`. */
    constant<V>(value: V): Parser<V>;

    /** Semantic predicate — succeed only when the parsed value passes `predicate`. */
    where(predicate: (value: R) => boolean, options?: { failureFactory?: (value: R) => string }): Parser<R>;

    /** Tag this parser with a debug name (alias for `labeled(this, name)` / `label(name, this)`). */
    labeled(name: string): Parser<R>;
  }
}

Parser.prototype.map = function <R, O>(
  this: Parser<R>,
  fn: (value: R) => O,
  options?: { hasSideEffects?: boolean },
): Parser<O> {
  return map(this, fn, options);
};

Parser.prototype.pick = function <E>(this: Parser<readonly E[]>, index: number): Parser<E> {
  return pick(this, index);
};

Parser.prototype.permute = function <E>(
  this: Parser<readonly E[]>,
  indexes: readonly number[],
): Parser<E[]> {
  return permute(this, indexes);
};

Parser.prototype.flatten = function <R>(
  this: Parser<R>,
  options?: { message?: string },
): Parser<string> {
  return flatten(this, options);
};

Parser.prototype.token = function <R>(this: Parser<R>): Parser<Token<R>> {
  return token(this);
};

Parser.prototype.trim = function <R>(
  this: Parser<R>,
  before?: Parser<unknown>,
  after?: Parser<unknown>,
): Parser<R> {
  return trim(this, before, after);
};

Parser.prototype.cast = function <T>(this: Parser<unknown>): Parser<T> {
  return cast<T>(this);
};

Parser.prototype.castList = function <T>(this: Parser<readonly unknown[]>): Parser<T[]> {
  return castList<T>(this);
};

Parser.prototype.constant = function <R, V>(this: Parser<R>, value: V): Parser<V> {
  return constant(this, value);
};

Parser.prototype.where = function <R>(
  this: Parser<R>,
  predicate: (value: R) => boolean,
  options?: { failureFactory?: (value: R) => string },
): Parser<R> {
  return where(this, predicate, options);
};

Parser.prototype.labeled = function <R>(this: Parser<R>, name: string): Parser<R> {
  return labeled(this, name);
};
