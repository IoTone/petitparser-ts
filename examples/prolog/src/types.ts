/**
 * Prolog term AST. Four kinds:
 *
 *   atom        — a constant identifier ("tom", "[]")
 *   variable    — a logic variable ("X", "_temp")
 *   number      — a numeric literal (integers only in this small dialect)
 *   compound    — `functor(arg1, arg2, ...)`
 *
 * Lists like `[a, b, c]` are sugar for nested `'.'/2` compounds, with `'[]'`
 * as the empty-list atom: `.(a, .(b, .(c, [])))`. The grammar performs the
 * desugaring during parsing.
 */
export type Term =
  | { readonly kind: 'atom'; readonly name: string }
  | { readonly kind: 'variable'; readonly name: string }
  | { readonly kind: 'number'; readonly value: number }
  | {
      readonly kind: 'compound';
      readonly functor: string;
      readonly args: readonly Term[];
    };

/** A clause is `head :- body`. Facts have an empty body. */
export interface Clause {
  readonly head: Term;
  readonly body: readonly Term[];
}

/** A database is an ordered collection of clauses (clause order = search order). */
export type Database = readonly Clause[];

/** Variable bindings produced by unification. Maps variable name → bound term. */
export type Bindings = ReadonlyMap<string, Term>;

// ───────────────────────────────────────────────────────────────────────────
// Convenience constructors

export function atom(name: string): Term {
  return { kind: 'atom', name };
}

export function variable(name: string): Term {
  return { kind: 'variable', name };
}

export function num(value: number): Term {
  return { kind: 'number', value };
}

export function compound(functor: string, ...args: Term[]): Term {
  return { kind: 'compound', functor, args };
}

/** The empty-list atom, conventionally written `[]`. */
export const EMPTY_LIST: Term = { kind: 'atom', name: '[]' };

/** Build a Prolog list term from JS array elements: `list(a, b, c)` → `[a, b, c]`. */
export function list(...items: Term[]): Term {
  let result: Term = EMPTY_LIST;
  for (let i = items.length - 1; i >= 0; i--) {
    result = { kind: 'compound', functor: '.', args: [items[i]!, result] };
  }
  return result;
}

/** Cons a head onto a tail term: `cons(H, T)` → `.(H, T)`. */
export function cons(head: Term, tail: Term): Term {
  return { kind: 'compound', functor: '.', args: [head, tail] };
}

// ───────────────────────────────────────────────────────────────────────────
// Pretty-print

/**
 * Format a term in Prolog source syntax. Handles list desugaring (`.(a, b)`
 * with `b` itself a list collapses back to `[a, b1, b2, ...]`).
 */
export function show(term: Term): string {
  switch (term.kind) {
    case 'atom':
      return term.name;
    case 'variable':
      return term.name;
    case 'number':
      return String(term.value);
    case 'compound':
      if (term.functor === '.' && term.args.length === 2) {
        return showList(term);
      }
      return `${term.functor}(${term.args.map(show).join(', ')})`;
  }
}

function showList(head: Term): string {
  const elements: string[] = [];
  let cur: Term = head;
  while (cur.kind === 'compound' && cur.functor === '.' && cur.args.length === 2) {
    elements.push(show(cur.args[0]!));
    cur = cur.args[1]!;
  }
  if (cur.kind === 'atom' && cur.name === '[]') {
    return `[${elements.join(', ')}]`;
  }
  return `[${elements.join(', ')} | ${show(cur)}]`;
}
