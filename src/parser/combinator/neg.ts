import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { failure as makeFailure, success, type Result } from '../../core/result.ts';
import { Parser as ParserBase } from '../../core/parser.ts';

/**
 * Char-level negation: consumes one character iff `parser` would fail at this
 * position. Equivalent to `not(parser).seq(any()).pick(-1)` but allocation-free
 * and one stack frame deep — useful as a building block for things like
 * `char('"').neg().star()` (everything until a closing quote).
 */
export class NegParser<R> extends ParserBase<string> {
  delegate: Parser<R>;
  readonly message: string;

  constructor(parser: Parser<R>, message: string) {
    super();
    this.delegate = parser;
    this.message = message;
  }

  override parseOn(context: Context): Result<string> {
    const { buffer, position } = context;
    if (position >= buffer.length) return makeFailure(context, 'input expected');
    const inner = this.delegate.parseOn(context);
    if (inner.kind === 'success') return makeFailure(context, this.message);
    return success(context, buffer.charAt(position), position + 1);
  }

  override fastParseOn(buffer: string, position: number): number {
    if (position >= buffer.length) return -1;
    return this.delegate.fastParseOn(buffer, position) < 0 ? position + 1 : -1;
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate];
  }

  override copy(): this {
    const cloned = Object.create(Object.getPrototypeOf(this) as object) as this;
    Object.assign(cloned, this);
    return cloned;
  }

  override replace(source: Parser<unknown>, target: Parser<unknown>): void {
    if (this.delegate === source) {
      this.delegate = target as Parser<R>;
    }
  }
}

/** Consumes one char iff `parser` would fail there. */
export function neg<R>(parser: Parser<R>, options: { message?: string } = {}): Parser<string> {
  return new NegParser(parser, options.message ?? 'no match expected');
}
