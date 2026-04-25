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

  /** Parsers default to identifying as their class name. Subclasses override to add detail. */
  toString(): string {
    return this.constructor.name;
  }

  /**
   * Returns a copy of this parser with the same configuration and the same
   * child references. Default returns `this` (safe for stateless leaves);
   * `DelegateParser` and `ListParser` override to produce a fresh instance
   * whose mutable child slots can be rebound by `replace()`. Used by
   * `transformParser` to rewrite parser graphs without disturbing the
   * original tree.
   */
  copy(): this {
    return this;
  }

  /**
   * Replace any direct child reference equal to `source` (by identity) with
   * `target`. Default no-op for leaves; combinators override to mutate their
   * child slots. Used by `transformParser` after `copy()` to install rewritten
   * children.
   */
  replace(_source: Parser<unknown>, _target: Parser<unknown>): void {
    // No children to replace.
  }
}
