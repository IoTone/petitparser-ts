import type { Parser } from '../core/parser.ts';
import type { SettableParser } from '../parser/combinator/settable.ts';
import { settable } from '../parser/combinator/settable.ts';

/**
 * Generic graph rewriter: walks the parser tree under `root` depth-first,
 * recursively transforms each child, then calls `handler(rebuiltParser)`
 * which can return either the same parser (no transformation) or a new one
 * (replace).
 *
 * Cycles (recursive grammars built via `SettableParser`) are handled by
 * pre-installing a placeholder `SettableParser` for each visited parser; if
 * recursion re-enters the same node before `handler` returns, the placeholder
 * is what's used, then resolved once the real result arrives.
 *
 * Returns the transformed root. Original parsers are NOT mutated — every
 * rebound parser is a fresh `copy()`.
 *
 * Note on generics: TS erases the `R` type parameter at runtime, so
 * `handler` is given `Parser<unknown>` and the result is asserted back to
 * `Parser<R>`. Callers that rely on the result type being preserved should
 * design their handler to be a no-op for parsers whose type matters.
 */
export function transformParser<R>(
  root: Parser<R>,
  handler: (parser: Parser<unknown>) => Parser<unknown>,
): Parser<R> {
  const cache = new Map<Parser<unknown>, Parser<unknown>>();
  const placeholders = new Map<Parser<unknown>, SettableParser<unknown>>();

  function walk(parser: Parser<unknown>): Parser<unknown> {
    const cached = cache.get(parser);
    if (cached !== undefined) return cached;

    const existingPlaceholder = placeholders.get(parser);
    if (existingPlaceholder !== undefined) return existingPlaceholder;

    // Pre-allocate a placeholder for cycle resolution. If the recursion
    // re-enters this parser before we finish, callers get the placeholder.
    const placeholder = settable<unknown>(`transform cycle: ${parser.constructor.name}`);
    placeholders.set(parser, placeholder);

    const children = parser.children;
    let rebuilt: Parser<unknown> = parser;
    if (children.length > 0) {
      const newChildren = children.map(walk);
      const anyChanged = newChildren.some((c, i) => c !== children[i]);
      if (anyChanged) {
        rebuilt = parser.copy();
        for (let i = 0; i < children.length; i++) {
          if (newChildren[i] !== children[i]) {
            rebuilt.replace(children[i] as Parser<unknown>, newChildren[i] as Parser<unknown>);
          }
        }
      }
    }

    const transformed = handler(rebuilt);
    placeholder.set(transformed);
    cache.set(parser, transformed);
    placeholders.delete(parser);
    return transformed;
  }

  return walk(root) as Parser<R>;
}
