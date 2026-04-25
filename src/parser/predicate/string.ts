import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure, success, type Result } from '../../core/result.ts';

/**
 * Matches the literal string `s`. Case-sensitive by default; pass
 * `{ ignoreCase: true }` to match case-insensitively (the matched substring
 * is returned in its original input casing).
 *
 * Returns the matched substring on success.
 */
export class StringParser extends Parser<string> {
  readonly literal: string;
  readonly ignoreCase: boolean;
  readonly message: string;
  readonly #lowered: string | null;

  constructor(literal: string, ignoreCase: boolean, message: string) {
    super();
    this.literal = literal;
    this.ignoreCase = ignoreCase;
    this.message = message;
    this.#lowered = ignoreCase ? literal.toLowerCase() : null;
  }

  override parseOn(context: Context): Result<string> {
    const { buffer, position } = context;
    const stop = position + this.literal.length;
    if (stop > buffer.length) return failure(context, this.message);
    const slice = buffer.substring(position, stop);
    if (this.ignoreCase) {
      if (slice.toLowerCase() !== this.#lowered) return failure(context, this.message);
    } else if (slice !== this.literal) {
      return failure(context, this.message);
    }
    return success(context, slice, stop);
  }

  override fastParseOn(buffer: string, position: number): number {
    const stop = position + this.literal.length;
    if (stop > buffer.length) return -1;
    if (this.ignoreCase) {
      if (buffer.substring(position, stop).toLowerCase() !== this.#lowered) return -1;
    } else {
      for (let i = 0; i < this.literal.length; i++) {
        if (buffer.charCodeAt(position + i) !== this.literal.charCodeAt(i)) return -1;
      }
    }
    return stop;
  }
}

export interface StringOptions {
  ignoreCase?: boolean;
  message?: string;
}

/** Returns a parser that matches the literal `s`. */
export function string(s: string, options: StringOptions = {}): Parser<string> {
  const ignoreCase = options.ignoreCase ?? false;
  const message =
    options.message ?? (ignoreCase ? `${JSON.stringify(s)} expected (case-insensitive)` : `${JSON.stringify(s)} expected`);
  return new StringParser(s, ignoreCase, message);
}
