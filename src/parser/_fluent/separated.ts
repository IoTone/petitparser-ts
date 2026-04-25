import { Parser } from '../../core/parser.ts';
import {
  plusSeparated,
  repeatSeparated,
  starSeparated,
  timesSeparated,
  type SeparatedList,
} from '../repeater/separated.ts';

declare module '../../core/parser.ts' {
  interface Parser<R> {
    starSeparated<S>(separator: Parser<S>): Parser<SeparatedList<R, S>>;
    plusSeparated<S>(separator: Parser<S>): Parser<SeparatedList<R, S>>;
    timesSeparated<S>(separator: Parser<S>, count: number): Parser<SeparatedList<R, S>>;
    repeatSeparated<S>(
      separator: Parser<S>,
      min: number,
      max: number,
    ): Parser<SeparatedList<R, S>>;
  }
}

Parser.prototype.starSeparated = function <R, S>(
  this: Parser<R>,
  separator: Parser<S>,
): Parser<SeparatedList<R, S>> {
  return starSeparated(this, separator);
};

Parser.prototype.plusSeparated = function <R, S>(
  this: Parser<R>,
  separator: Parser<S>,
): Parser<SeparatedList<R, S>> {
  return plusSeparated(this, separator);
};

Parser.prototype.timesSeparated = function <R, S>(
  this: Parser<R>,
  separator: Parser<S>,
  count: number,
): Parser<SeparatedList<R, S>> {
  return timesSeparated(this, separator, count);
};

Parser.prototype.repeatSeparated = function <R, S>(
  this: Parser<R>,
  separator: Parser<S>,
  min: number,
  max: number,
): Parser<SeparatedList<R, S>> {
  return repeatSeparated(this, separator, min, max);
};
