import type { Bindings, Term } from './types.ts';

/**
 * Walk a term to its current binding: if it's an unbound variable or a
 * non-variable, return as-is. If it's a bound variable, follow the chain
 * recursively until we reach an unbound or non-variable.
 *
 * Used both by unification (to compare canonical forms) and by display (to
 * substitute bindings into a result term).
 */
export function walk(term: Term, bindings: Bindings): Term {
  let current = term;
  while (current.kind === 'variable') {
    const bound = bindings.get(current.name);
    if (bound === undefined || bound === current) return current;
    current = bound;
  }
  return current;
}

/**
 * Recursively walk a compound's args too. Used for showing a final answer:
 * if `X` is bound to `foo(Y)` and `Y` is bound to `bar`, then `walkDeep(X)`
 * returns `foo(bar)`.
 */
export function walkDeep(term: Term, bindings: Bindings): Term {
  const t = walk(term, bindings);
  if (t.kind === 'compound') {
    return { kind: 'compound', functor: t.functor, args: t.args.map((a) => walkDeep(a, bindings)) };
  }
  return t;
}

/**
 * Classical Robinson unification. Returns the extended bindings on success,
 * `null` on failure. Bindings are immutable — a new map is returned for every
 * extension so callers can backtrack by simply discarding it.
 *
 * No occurs check by default — typical Prolog implementations omit it for
 * performance, accepting that infinite terms can be created. Pass
 * `occursCheck: true` to enable it.
 */
export function unify(a: Term, b: Term, bindings: Bindings, occursCheck = false): Bindings | null {
  const aw = walk(a, bindings);
  const bw = walk(b, bindings);

  if (aw.kind === 'variable' && bw.kind === 'variable' && aw.name === bw.name) {
    return bindings;
  }
  if (aw.kind === 'variable') {
    if (occursCheck && occurs(aw.name, bw, bindings)) return null;
    return new Map(bindings).set(aw.name, bw);
  }
  if (bw.kind === 'variable') {
    if (occursCheck && occurs(bw.name, aw, bindings)) return null;
    return new Map(bindings).set(bw.name, aw);
  }
  if (aw.kind === 'atom' && bw.kind === 'atom') {
    return aw.name === bw.name ? bindings : null;
  }
  if (aw.kind === 'number' && bw.kind === 'number') {
    return aw.value === bw.value ? bindings : null;
  }
  if (aw.kind === 'compound' && bw.kind === 'compound') {
    if (aw.functor !== bw.functor || aw.args.length !== bw.args.length) return null;
    let current: Bindings = bindings;
    for (let i = 0; i < aw.args.length; i++) {
      const next = unify(aw.args[i]!, bw.args[i]!, current, occursCheck);
      if (next === null) return null;
      current = next;
    }
    return current;
  }
  return null;
}

/** Does `varName` appear inside `term` after walking? Used for the occurs check. */
function occurs(varName: string, term: Term, bindings: Bindings): boolean {
  const t = walk(term, bindings);
  if (t.kind === 'variable') return t.name === varName;
  if (t.kind === 'compound') return t.args.some((a) => occurs(varName, a, bindings));
  return false;
}
