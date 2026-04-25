import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure, success, type Result } from '../../core/result.ts';

/**
 * Matches one platform-independent newline: `\r\n`, `\r`, or `\n`. Returns
 * the matched substring. Implemented as a single dedicated parser (not a
 * choice combinator) so it can land in Phase 1 before combinators exist.
 */
export class NewlineParser extends Parser<string> {
  readonly message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }

  override parseOn(context: Context): Result<string> {
    const { buffer, position } = context;
    if (position >= buffer.length) return failure(context, this.message);
    const ch = buffer.charCodeAt(position);
    if (ch === 0x0d /* \r */) {
      if (position + 1 < buffer.length && buffer.charCodeAt(position + 1) === 0x0a /* \n */) {
        return success(context, '\r\n', position + 2);
      }
      return success(context, '\r', position + 1);
    }
    if (ch === 0x0a /* \n */) {
      return success(context, '\n', position + 1);
    }
    return failure(context, this.message);
  }

  override fastParseOn(buffer: string, position: number): number {
    if (position >= buffer.length) return -1;
    const ch = buffer.charCodeAt(position);
    if (ch === 0x0d) {
      return position + 1 < buffer.length && buffer.charCodeAt(position + 1) === 0x0a
        ? position + 2
        : position + 1;
    }
    if (ch === 0x0a) return position + 1;
    return -1;
  }
}

/** Returns a parser that matches one platform-independent newline. */
export function newline(options: { message?: string } = {}): Parser<string> {
  return new NewlineParser(options.message ?? 'newline expected');
}
