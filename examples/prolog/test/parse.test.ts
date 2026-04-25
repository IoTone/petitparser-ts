import { describe, expect, it } from 'vitest';

import { PrologGrammar, parseQuery, show, type Clause, type Term } from '../src/index.ts';

const prolog = new PrologGrammar().build();

function parse(input: string): Clause[] {
  const r = prolog.parse(input);
  if (r.kind !== 'success') throw new Error(`parse failed: ${r.message} at ${String(r.position)}`);
  return r.value;
}

describe('Prolog parser — facts', () => {
  it('atom fact', () => {
    const [c] = parse('happy.');
    expect(c?.head).toEqual({ kind: 'atom', name: 'happy' });
    expect(c?.body).toEqual([]);
  });

  it('compound fact', () => {
    const [c] = parse('parent(tom, bob).');
    expect(show(c!.head)).toBe('parent(tom, bob)');
    expect(c?.body).toEqual([]);
  });

  it('multi-fact program', () => {
    const cs = parse('parent(tom, bob).\nparent(bob, ann).');
    expect(cs).toHaveLength(2);
    expect(show(cs[0]!.head)).toBe('parent(tom, bob)');
    expect(show(cs[1]!.head)).toBe('parent(bob, ann)');
  });
});

describe('Prolog parser — rules', () => {
  it('single-goal rule', () => {
    const [c] = parse('grandparent(X, Z) :- parent(X, Y).');
    expect(show(c!.head)).toBe('grandparent(X, Z)');
    expect(c?.body.map(show)).toEqual(['parent(X, Y)']);
  });

  it('multi-goal rule', () => {
    const [c] = parse('grandparent(X, Z) :- parent(X, Y), parent(Y, Z).');
    expect(c?.body.map(show)).toEqual(['parent(X, Y)', 'parent(Y, Z)']);
  });
});

describe('Prolog parser — variables', () => {
  it('uppercase identifier', () => {
    const [c] = parse('foo(X).');
    expect(c?.head).toEqual({
      kind: 'compound',
      functor: 'foo',
      args: [{ kind: 'variable', name: 'X' }],
    });
  });

  it('underscore-prefixed identifier', () => {
    const [c] = parse('foo(_x).');
    expect((c?.head as { args: readonly Term[] }).args[0]).toEqual({ kind: 'variable', name: '_x' });
  });
});

describe('Prolog parser — lists', () => {
  it('empty list', () => {
    const [c] = parse('foo([]).');
    expect(show(c!.head)).toBe('foo([])');
  });

  it('flat list', () => {
    const [c] = parse('foo([a, b, c]).');
    expect(show(c!.head)).toBe('foo([a, b, c])');
  });

  it('list with tail variable', () => {
    const [c] = parse('foo([H | T]).');
    expect(show(c!.head)).toBe('foo([H | T])');
  });

  it('mixed list with tail', () => {
    const [c] = parse('foo([1, 2 | Rest]).');
    expect(show(c!.head)).toBe('foo([1, 2 | Rest])');
  });
});

describe('Prolog parser — numbers', () => {
  it('integers', () => {
    const [c] = parse('foo(0, 42, -7).');
    expect(show(c!.head)).toBe('foo(0, 42, -7)');
  });
});

describe('Prolog parser — comments', () => {
  it('skips % line comments', () => {
    const cs = parse('% header\nfoo. % trailing\nbar.');
    expect(cs).toHaveLength(2);
  });
});

describe('Prolog parser — query helper', () => {
  it('parses a `?- goal.` query', () => {
    const goals = parseQuery('?- parent(tom, X).');
    expect(goals).toHaveLength(1);
    expect(show(goals[0]!)).toBe('parent(tom, X)');
  });

  it('parses a multi-goal query', () => {
    const goals = parseQuery('?- parent(tom, Y), parent(Y, X).');
    expect(goals).toHaveLength(2);
  });

  it('accepts a query without the `?-` prefix', () => {
    const goals = parseQuery('member(X, [1, 2]).');
    expect(goals).toHaveLength(1);
  });
});

describe('Prolog parser — invalid input', () => {
  // Note: empty input parses as a successful empty program (zero clauses) — not an error.
  it.each(['foo', 'foo(', 'X(a, b).', 'foo(a, b'])('rejects %j', (input) => {
    expect(prolog.parse(input).kind).toBe('failure');
  });
});
