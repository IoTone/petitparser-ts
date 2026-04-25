import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from '../character/character_parser.ts';
import {
  plusString,
  repeatString,
  starString,
  timesString,
} from '../repeater/character.ts';

declare module '../character/character_parser.ts' {
  interface CharacterParser {
    /** Match this `CharacterParser` zero or more times, returning the matched substring. */
    starString(options?: { message?: string }): Parser<string>;
    plusString(options?: { message?: string }): Parser<string>;
    timesString(count: number, options?: { message?: string }): Parser<string>;
    repeatString(min: number, max: number, options?: { message?: string }): Parser<string>;
  }
}

CharacterParser.prototype.starString = function (
  this: CharacterParser,
  options?: { message?: string },
): Parser<string> {
  return starString(this, options);
};

CharacterParser.prototype.plusString = function (
  this: CharacterParser,
  options?: { message?: string },
): Parser<string> {
  return plusString(this, options);
};

CharacterParser.prototype.timesString = function (
  this: CharacterParser,
  count: number,
  options?: { message?: string },
): Parser<string> {
  return timesString(this, count, options);
};

CharacterParser.prototype.repeatString = function (
  this: CharacterParser,
  min: number,
  max: number,
  options?: { message?: string },
): Parser<string> {
  return repeatString(this, min, max, options);
};
