import type { Parser } from '../core/parser.ts';
import { ChoiceParser } from '../parser/combinator/choice.ts';
import { DelegateParser } from '../parser/combinator/delegate.ts';
import { ListParser } from '../parser/combinator/list.ts';
import { SequenceParser } from '../parser/combinator/sequence.ts';
import { SettableParser } from '../parser/combinator/settable.ts';
import { FailureParser } from '../parser/misc/failure.ts';
import { allParser } from './iterable.ts';

/** Severity of a linter issue. */
export type LinterType = 'info' | 'warning' | 'error';

/** A single issue reported by the linter. */
export interface LinterIssue {
  readonly type: LinterType;
  readonly title: string;
  readonly description: string;
  readonly parser: Parser<unknown>;
}

/** A rule contributes zero or more issues per traversal of the parser graph. */
export type LinterRule = (root: Parser<unknown>) => readonly LinterIssue[];

/**
 * Detects (direct or indirect) left-recursion. A parser is left-recursive
 * when its leftmost evaluation path eventually reaches itself without
 * consuming input.
 *
 * Implementation: for each parser, walk the leftmost-children chain (the
 * parsers that get a chance to run *first* given an empty match). If we
 * encounter the starting parser again, report an error.
 *
 * Approximations:
 * - For sequences, only `parsers[0]` is considered the leftmost (we don't
 *   model nullability, so sequences whose first child *can* match the empty
 *   string and whose second is left-recursive are missed). Phase 5 adds an
 *   Analyzer with proper FIRST/FOLLOW; we'll wire that in then.
 * - For choices, every alternative is leftmost.
 * - For repeaters / optional / wrapping delegates, the inner parser is the
 *   leftmost (since they can succeed with zero matches and let the outer
 *   continue, but the inner is what actually sees the cursor first).
 */
export const LeftRecursionRule: LinterRule = (root) => {
  const issues: LinterIssue[] = [];
  for (const parser of allParser(root)) {
    if (hasLeftRecursionFrom(parser)) {
      issues.push({
        type: 'error',
        title: 'left recursion',
        description: `parser ${parser.constructor.name} can recurse into itself without consuming input`,
        parser,
      });
    }
  }
  return issues;
};

function hasLeftRecursionFrom(start: Parser<unknown>): boolean {
  const visited = new Set<Parser<unknown>>();
  const stack: Parser<unknown>[] = [];

  function check(p: Parser<unknown>): boolean {
    if (visited.has(p)) return false;
    visited.add(p);
    for (const next of leftmostChildren(p)) {
      if (next === start) return true;
      stack.push(next);
      if (check(next)) return true;
      stack.pop();
    }
    return false;
  }

  for (const next of leftmostChildren(start)) {
    if (next === start) return true;
    if (check(next)) return true;
  }
  return false;
}

function leftmostChildren(parser: Parser<unknown>): readonly Parser<unknown>[] {
  if (parser instanceof ChoiceParser) return parser.parsers;
  if (parser instanceof SequenceParser) {
    return parser.parsers.length > 0 ? [parser.parsers[0] as Parser<unknown>] : [];
  }
  if (parser instanceof ListParser) return parser.parsers;
  if (parser instanceof DelegateParser) return [parser.delegate];
  return [];
}

/**
 * Flags `SettableParser` instances whose delegate was never replaced — i.e.
 * they still hold a `FailureParser('undefined parser')` placeholder. Catches
 * the common bug of declaring a forward reference and forgetting to `set()` it.
 */
export const UnresolvedSettableRule: LinterRule = (root) => {
  const issues: LinterIssue[] = [];
  for (const parser of allParser(root)) {
    if (parser instanceof SettableParser) {
      const inner: unknown = parser.delegate;
      if (inner instanceof FailureParser && inner.message === 'undefined parser') {
        issues.push({
          type: 'error',
          title: 'unresolved settable',
          description: 'SettableParser was created without a corresponding .set() call',
          parser,
        });
      }
    }
  }
  return issues;
};

/** Default rule set applied by `linter(parser)` when no explicit list is given. */
export const allLinterRules: readonly LinterRule[] = [LeftRecursionRule, UnresolvedSettableRule];

export interface LinterOptions {
  rules?: readonly LinterRule[];
}

/**
 * Run every rule against the parser graph reachable from `root`, returning
 * a flat list of issues. Each rule may produce zero or more issues per parser.
 */
export function linter<R>(root: Parser<R>, options: LinterOptions = {}): LinterIssue[] {
  const rules = options.rules ?? allLinterRules;
  const issues: LinterIssue[] = [];
  for (const rule of rules) {
    for (const issue of rule(root)) issues.push(issue);
  }
  return issues;
}
