import { describe, expect, it } from 'vitest';

import {
  PrologGrammar,
  parseQuery,
  show,
  solve,
  walkDeep,
  type Bindings,
  type Database,
  type Term,
} from '../src/index.ts';

const grammar = new PrologGrammar().build();

function loadDatabase(source: string): Database {
  const r = grammar.parse(source);
  if (r.kind !== 'success') throw new Error(`parse failed: ${r.message}`);
  return r.value;
}

function answersFor(db: Database, queryStr: string, varNames: string[]): Array<Record<string, string>> {
  const goals = parseQuery(queryStr);
  return [...solve(goals, db)].map((b) => bindingsToRecord(b, goals, varNames));
}

function bindingsToRecord(
  bindings: Bindings,
  goals: readonly Term[],
  varNames: string[],
): Record<string, string> {
  // For each variable name in `varNames`, find its current binding by walking
  // the goals (which contain the original variable terms).
  const record: Record<string, string> = {};
  const seen = new Set<string>();
  function visit(t: Term): void {
    if (t.kind === 'variable') {
      if (varNames.includes(t.name) && !seen.has(t.name)) {
        seen.add(t.name);
        record[t.name] = show(walkDeep(t, bindings));
      }
    } else if (t.kind === 'compound') {
      t.args.forEach(visit);
    }
  }
  goals.forEach(visit);
  return record;
}

describe('Prolog solver — facts only', () => {
  const db = loadDatabase(`
    parent(tom, bob).
    parent(tom, liz).
    parent(bob, ann).
    parent(bob, pat).
    parent(pat, jim).
  `);

  it('exact-match query', () => {
    const answers = [...solve(parseQuery('parent(tom, bob).'), db)];
    expect(answers).toHaveLength(1);
  });

  it('failed query', () => {
    const answers = [...solve(parseQuery('parent(tom, jim).'), db)];
    expect(answers).toHaveLength(0);
  });

  it('enumerates all matches for a single variable', () => {
    expect(answersFor(db, '?- parent(tom, X).', ['X'])).toEqual([{ X: 'bob' }, { X: 'liz' }]);
  });

  it('enumerates all matches for a single variable in second position', () => {
    expect(answersFor(db, '?- parent(X, ann).', ['X'])).toEqual([{ X: 'bob' }]);
  });

  it('enumerates all parent pairs', () => {
    const all = answersFor(db, '?- parent(P, C).', ['P', 'C']);
    expect(all).toEqual([
      { P: 'tom', C: 'bob' },
      { P: 'tom', C: 'liz' },
      { P: 'bob', C: 'ann' },
      { P: 'bob', C: 'pat' },
      { P: 'pat', C: 'jim' },
    ]);
  });
});

describe('Prolog solver — rules', () => {
  const db = loadDatabase(`
    parent(tom, bob).
    parent(bob, ann).
    parent(ann, jim).
    grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
  `);

  it('grandparent via single rule', () => {
    expect(answersFor(db, '?- grandparent(tom, X).', ['X'])).toEqual([{ X: 'ann' }]);
  });

  it('grandparent enumerates correctly', () => {
    expect(answersFor(db, '?- grandparent(X, Y).', ['X', 'Y'])).toEqual([
      { X: 'tom', Y: 'ann' },
      { X: 'bob', Y: 'jim' },
    ]);
  });

  it('chained rules: great-grandparent', () => {
    const db2 = loadDatabase(`
      parent(tom, bob).
      parent(bob, ann).
      parent(ann, jim).
      grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
      greatgrandparent(X, Z) :- grandparent(X, Y), parent(Y, Z).
    `);
    expect(answersFor(db2, '?- greatgrandparent(X, Z).', ['X', 'Z'])).toEqual([
      { X: 'tom', Z: 'jim' },
    ]);
  });
});

describe('Prolog solver — list relations', () => {
  const db = loadDatabase(`
    member(X, [X | _]).
    member(X, [_ | Tail]) :- member(X, Tail).

    append([], List, List).
    append([H | T1], List, [H | T2]) :- append(T1, List, T2).
  `);

  it('member: single-element list', () => {
    expect(answersFor(db, '?- member(X, [a]).', ['X'])).toEqual([{ X: 'a' }]);
  });

  it('member: enumerates list', () => {
    expect(answersFor(db, '?- member(X, [a, b, c]).', ['X'])).toEqual([
      { X: 'a' },
      { X: 'b' },
      { X: 'c' },
    ]);
  });

  it('member: existence check (succeeds once)', () => {
    expect(answersFor(db, '?- member(b, [a, b, c]).', [])).toEqual([{}]);
  });

  it('member: failed existence check (no answers)', () => {
    expect(answersFor(db, '?- member(z, [a, b, c]).', [])).toEqual([]);
  });

  it('append: forward concatenation', () => {
    expect(answersFor(db, '?- append([1, 2], [3, 4], R).', ['R'])).toEqual([
      { R: '[1, 2, 3, 4]' },
    ]);
  });

  it('append: enumerates all decompositions of a list (reverse mode)', () => {
    const answers = answersFor(db, '?- append(A, B, [1, 2, 3]).', ['A', 'B']);
    expect(answers).toEqual([
      { A: '[]', B: '[1, 2, 3]' },
      { A: '[1]', B: '[2, 3]' },
      { A: '[1, 2]', B: '[3]' },
      { A: '[1, 2, 3]', B: '[]' },
    ]);
  });
});

describe('Prolog solver — anonymous variables (workalike)', () => {
  const db = loadDatabase(`
    color(red).
    color(green).
    color(blue).
    has_color(X) :- color(X).
  `);

  it('rule body succeeds via predicate', () => {
    expect(answersFor(db, '?- has_color(X).', ['X'])).toEqual([
      { X: 'red' },
      { X: 'green' },
      { X: 'blue' },
    ]);
  });
});
