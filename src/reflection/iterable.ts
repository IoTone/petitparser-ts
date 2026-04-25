import type { Parser } from '../core/parser.ts';

/**
 * Lazy depth-first iteration over every parser reachable from `root`,
 * deduplicated by reference. Visits each unique parser exactly once.
 *
 * Order is "this-then-children" (pre-order). Cycles are handled — a parser
 * already yielded is not re-entered, so recursive grammars terminate.
 */
export function* allParser(root: Parser<unknown>): Generator<Parser<unknown>> {
  const seen = new Set<Parser<unknown>>();
  const stack: Parser<unknown>[] = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    yield current;
    // Push children in reverse so first child is visited first (LIFO order).
    const children = current.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child !== undefined && !seen.has(child)) stack.push(child);
    }
  }
}
