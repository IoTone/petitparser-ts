import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure as makeFailure, type Result } from '../../core/result.ts';

/** Always fails with `message`, consumes nothing. */
export class FailureParser extends Parser<never> {
  readonly message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }

  override parseOn(context: Context): Result<never> {
    return makeFailure(context, this.message);
  }

  override fastParseOn(_buffer: string, _position: number): number {
    return -1;
  }
}

/** Returns a parser that always fails with `message`. */
export function failure(message = 'unable to parse'): Parser<never> {
  return new FailureParser(message);
}
