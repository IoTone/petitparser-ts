import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure as makeFailure, success, type Result } from '../../core/result.ts';
import type { CharacterParser } from '../character/character_parser.ts';
import { UNBOUNDED } from './repeating.ts';

/**
 * Repeating-character fast path. Mirrors upstream's `starString`/`plusString`
 * family: when the inner parser is a `CharacterParser`, the repetition can
 * skip the per-iteration delegate dispatch and emit a flat substring instead
 * of an array of single-character strings. Often >5x faster for large
 * matches.
 */
export class RepeatingCharacterParser extends Parser<string> {
  readonly delegate: CharacterParser;
  readonly min: number;
  readonly max: number;
  readonly message: string;

  constructor(delegate: CharacterParser, min: number, max: number, message: string) {
    super();
    if (min < 0) throw new Error(`min must be >= 0, got ${String(min)}`);
    if (max < min) throw new Error(`max (${String(max)}) must be >= min (${String(min)})`);
    this.delegate = delegate;
    this.min = min;
    this.max = max;
    this.message = message;
  }

  override parseOn(context: Context): Result<string> {
    const { buffer, position } = context;
    let cursor = position;
    const cap = Math.min(buffer.length, position + this.max);
    while (cursor < cap && this.delegate.predicate.test(buffer.charCodeAt(cursor))) {
      cursor++;
    }
    if (cursor - position < this.min) return makeFailure(context, this.message);
    return success(context, buffer.substring(position, cursor), cursor);
  }

  override fastParseOn(buffer: string, position: number): number {
    let cursor = position;
    const cap = Math.min(buffer.length, position + this.max);
    while (cursor < cap && this.delegate.predicate.test(buffer.charCodeAt(cursor))) {
      cursor++;
    }
    return cursor - position < this.min ? -1 : cursor;
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate];
  }
}

/** Match `parser` (a `CharacterParser`) zero or more times, returning the matched substring. */
export function starString(parser: CharacterParser, options: { message?: string } = {}): Parser<string> {
  return new RepeatingCharacterParser(parser, 0, UNBOUNDED, options.message ?? `${parser.message} (any)`);
}

/** Match one or more, returning the substring. */
export function plusString(parser: CharacterParser, options: { message?: string } = {}): Parser<string> {
  return new RepeatingCharacterParser(parser, 1, UNBOUNDED, options.message ?? parser.message);
}

/** Match exactly `count`, returning the substring. */
export function timesString(parser: CharacterParser, count: number, options: { message?: string } = {}): Parser<string> {
  return new RepeatingCharacterParser(parser, count, count, options.message ?? parser.message);
}

/** Match between `min` and `max`, returning the substring. */
export function repeatString(
  parser: CharacterParser,
  min: number,
  max: number,
  options: { message?: string } = {},
): Parser<string> {
  return new RepeatingCharacterParser(parser, min, max, options.message ?? parser.message);
}
