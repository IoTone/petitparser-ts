import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';

/** Always succeeds, consumes nothing, returns the current input position. */
export class PositionParser extends Parser<number> {
  override parseOn(context: Context): Result<number> {
    return success(context, context.position);
  }

  override fastParseOn(_buffer: string, position: number): number {
    return position;
  }
}

const INSTANCE = new PositionParser();

/** Returns a parser that captures the current input position as its value. */
export function position(): Parser<number> {
  return INSTANCE;
}
