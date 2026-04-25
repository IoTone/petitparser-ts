import { Parser } from '../../core/parser.ts';
import {
  plusGreedy,
  repeatGreedy,
  starGreedy,
} from '../repeater/greedy.ts';
import { plusLazy, repeatLazy, starLazy } from '../repeater/lazy.ts';
import { plus, repeat, star, times } from '../repeater/possessive.ts';

declare module '../../core/parser.ts' {
  interface Parser<R> {
    star(): Parser<R[]>;
    plus(): Parser<R[]>;
    times(count: number): Parser<R[]>;
    repeat(min: number, max: number): Parser<R[]>;

    starGreedy(limit: Parser<unknown>): Parser<R[]>;
    plusGreedy(limit: Parser<unknown>): Parser<R[]>;
    repeatGreedy(limit: Parser<unknown>, min: number, max: number): Parser<R[]>;

    starLazy(limit: Parser<unknown>): Parser<R[]>;
    plusLazy(limit: Parser<unknown>): Parser<R[]>;
    repeatLazy(limit: Parser<unknown>, min: number, max: number): Parser<R[]>;
  }
}

Parser.prototype.star = function <R>(this: Parser<R>): Parser<R[]> {
  return star(this);
};

Parser.prototype.plus = function <R>(this: Parser<R>): Parser<R[]> {
  return plus(this);
};

Parser.prototype.times = function <R>(this: Parser<R>, count: number): Parser<R[]> {
  return times(this, count);
};

Parser.prototype.repeat = function <R>(this: Parser<R>, min: number, max: number): Parser<R[]> {
  return repeat(this, min, max);
};

Parser.prototype.starGreedy = function <R>(this: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return starGreedy(this, limit);
};

Parser.prototype.plusGreedy = function <R>(this: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return plusGreedy(this, limit);
};

Parser.prototype.repeatGreedy = function <R>(
  this: Parser<R>,
  limit: Parser<unknown>,
  min: number,
  max: number,
): Parser<R[]> {
  return repeatGreedy(this, limit, min, max);
};

Parser.prototype.starLazy = function <R>(this: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return starLazy(this, limit);
};

Parser.prototype.plusLazy = function <R>(this: Parser<R>, limit: Parser<unknown>): Parser<R[]> {
  return plusLazy(this, limit);
};

Parser.prototype.repeatLazy = function <R>(
  this: Parser<R>,
  limit: Parser<unknown>,
  min: number,
  max: number,
): Parser<R[]> {
  return repeatLazy(this, limit, min, max);
};
