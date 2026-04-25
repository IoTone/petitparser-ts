import { context, type Context } from './context.ts';
import type { Result } from './result.ts';

/**
 * Abstract base of every parser. Generic in the result type `R`.
 *
 * Phase 1 surface: `parseOn` (abstract), plus convenience `fastParseOn`,
 * `parse`, and `accept`. Reflection-shaped methods (`copy`, `replace`,
 * `isEqualTo`, full `children` semantics) arrive in Phase 5.
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

  /** Returns `true` iff `parse(input)` succeeds (regardless of remaining input). */
  accept(input: string): boolean {
    return this.fastParseOn(input, 0) >= 0;
  }

  /**
   * Direct sub-parsers of this parser. Combinators override this; leaf parsers
   * (character, epsilon, etc.) return an empty list. The full reflection API
   * (`replace`, `isEqualTo`, `copy`) lands in Phase 5.
   */
  get children(): readonly Parser<unknown>[] {
    return [];
  }
}
