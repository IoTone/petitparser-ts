import type { Parser } from '../core/parser.ts';
import { ChoiceParser } from '../parser/combinator/choice.ts';
import { transformParser } from './transform.ts';

/**
 * Rule signature for `optimize()`. Receives a parser, returns either the same
 * parser (no transformation) or a replacement.
 */
export type OptimizerRule = (parser: Parser<unknown>) => Parser<unknown>;

/**
 * Collapses nested `ChoiceParser`s into one. `Choice(a, Choice(b, c), d)`
 * becomes `Choice(a, b, c, d)`. Preserves the failure-joiner of the outermost
 * choice (inner choices' joiners are discarded — the outer policy wins).
 */
export const FlattenChoice: OptimizerRule = (parser) => {
  if (!(parser instanceof ChoiceParser)) return parser;
  const flat: Parser<unknown>[] = [];
  let changed = false;
  for (const child of parser.parsers) {
    if (child instanceof ChoiceParser) {
      flat.push(...child.parsers);
      changed = true;
    } else {
      flat.push(child);
    }
  }
  if (!changed) return parser;
  return new ChoiceParser(flat, parser.failureJoiner);
};

/**
 * Shares structurally-identical subtrees by reference. Walks the cache of
 * already-seen parsers and returns the first reference whose tree is
 * `serialize`-equal. The cache is per-`optimize()` invocation.
 *
 * Currently identity-only (replaces an exact `===` duplicate, not structurally
 * equivalent ones). Full structural deduplication requires `isEqualTo` support
 * across all parser classes — deferred. The identity case still helps when
 * the same primitive (e.g. `whitespace()` from `trim()` defaults) appears
 * many times in a grammar.
 */
export function makeRemoveDuplicate(): OptimizerRule {
  // Identity dedup is a no-op when transformParser already shares parsers via
  // its own visited-cache. Provided as a hook for future structural-equality
  // dedup in Phase 5+.
  return (parser) => parser;
}

export const RemoveDuplicate = makeRemoveDuplicate();

/** Default rule set applied by `optimize(parser)` when no explicit list is given. */
export const allOptimizerRules: readonly OptimizerRule[] = [FlattenChoice];

export interface OptimizeOptions {
  rules?: readonly OptimizerRule[];
}

/**
 * Walk the parser tree and apply each rule to every node, in the order given.
 * Returns a new parser with the optimizations applied; the original is not
 * mutated.
 */
export function optimize<R>(root: Parser<R>, options: OptimizeOptions = {}): Parser<R> {
  const rules = options.rules ?? allOptimizerRules;
  return transformParser(root, (parser) => {
    let current = parser;
    for (const rule of rules) {
      current = rule(current);
    }
    return current;
  });
}
