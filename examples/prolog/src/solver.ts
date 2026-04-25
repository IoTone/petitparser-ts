import type { Bindings, Clause, Database, Term } from './types.ts';
import { unify } from './unify.ts';

/**
 * SLD resolution with classical backtracking. Yields one bindings map per
 * successful proof of the goal list, in the order Prolog would enumerate them
 * (depth-first, clause-order in the database).
 *
 * `solve([], db, b)` succeeds once with `b` (an empty goal list is trivially
 * true). For a non-empty goal list, we walk the database, rename each
 * candidate clause's variables to fresh names (preventing accidental capture
 * across recursive calls), unify the head with the first goal, and
 * recursively solve `(clause body) ++ (rest of goals)`.
 *
 * Returns a `Generator` so callers can stop after the first solution, take
 * the first N, or enumerate all of them.
 */
export function* solve(
  goals: readonly Term[],
  database: Database,
  bindings: Bindings = new Map(),
  counter: { value: number } = { value: 0 },
): Generator<Bindings> {
  if (goals.length === 0) {
    yield bindings;
    return;
  }
  const [goal, ...rest] = goals;
  for (const clause of database) {
    const renamed = renameClause(clause, `_${String(counter.value++)}`);
    const next = unify(goal!, renamed.head, bindings);
    if (next === null) continue;
    yield* solve([...renamed.body, ...rest], database, next, counter);
  }
}

/**
 * Substitute every variable name in the clause with `name + suffix`. This
 * gives each clause-instance fresh variables on every use, so that, e.g.,
 * the `X` in `member(X, [X|_])` doesn't collide with the `X` of the calling
 * goal.
 */
export function renameClause(clause: Clause, suffix: string): Clause {
  return {
    head: renameTerm(clause.head, suffix),
    body: clause.body.map((b) => renameTerm(b, suffix)),
  };
}

function renameTerm(term: Term, suffix: string): Term {
  switch (term.kind) {
    case 'variable':
      return { kind: 'variable', name: term.name + suffix };
    case 'compound':
      return {
        kind: 'compound',
        functor: term.functor,
        args: term.args.map((a) => renameTerm(a, suffix)),
      };
    default:
      return term;
  }
}
