import { context, type Context } from './context.ts';
import { success, type Result } from './result.ts';

/**
 * Abstract base of every parser. Generic in the result type `R`.
 *
 * Phase 0 surface is intentionally minimal — only `parseOn`, `fastParseOn`,
 * and `parse`. `copy`, `children`, `replace`, and `isEqualTo` arrive with the
 * reflection layer in Phase 5.
 */
export abstract class Parser<R> {
  abstract parseOn(context: Context): Result<R>;

  fastParseOn(buffer: string, position: number): number {
    const result = this.parseOn({ buffer, position });
    return result.kind === 'success' ? result.position : -1;
  }

  parse(input: string): Result<R> {
    return this.parseOn(context(input));
  }
}

/** Always succeeds, consumes nothing, returns `undefined`. Phase 0 proof of life. */
export class EpsilonParser extends Parser<undefined> {
  override parseOn(context: Context): Result<undefined> {
    return success(context, undefined);
  }
}

export function epsilon(): Parser<undefined> {
  return new EpsilonParser();
}
