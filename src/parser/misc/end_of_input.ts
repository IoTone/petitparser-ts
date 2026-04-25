import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure, success, type Result } from '../../core/result.ts';

/** Succeeds only at end of input, returns `undefined`. */
export class EndOfInputParser extends Parser<undefined> {
  readonly message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }

  override parseOn(context: Context): Result<undefined> {
    if (context.position >= context.buffer.length) {
      return success(context, undefined);
    }
    return failure(context, this.message);
  }

  override fastParseOn(buffer: string, position: number): number {
    return position >= buffer.length ? position : -1;
  }
}

/** Returns a parser that succeeds only at end of input. */
export function endOfInput(options: { message?: string } = {}): Parser<undefined> {
  return new EndOfInputParser(options.message ?? 'end of input expected');
}
