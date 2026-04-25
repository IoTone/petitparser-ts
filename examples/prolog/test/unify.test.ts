import { describe, expect, it } from 'vitest';

import {
  atom,
  compound,
  list,
  num,
  show,
  unify,
  variable,
  walk,
  walkDeep,
  type Bindings,
} from '../src/index.ts';

const empty: Bindings = new Map();

describe('unify() — atoms and numbers', () => {
  it('equal atoms unify with no new bindings', () => {
    const r = unify(atom('foo'), atom('foo'), empty);
    expect(r).not.toBeNull();
    expect(r!.size).toBe(0);
  });

  it('different atoms fail', () => {
    expect(unify(atom('foo'), atom('bar'), empty)).toBeNull();
  });

  it('equal numbers unify; different fail', () => {
    expect(unify(num(1), num(1), empty)).not.toBeNull();
    expect(unify(num(1), num(2), empty)).toBeNull();
  });

  it('atom vs number fails', () => {
    expect(unify(atom('foo'), num(1), empty)).toBeNull();
  });
});

describe('unify() — variables', () => {
  it('binds a variable to an atom', () => {
    const r = unify(variable('X'), atom('foo'), empty);
    expect(r).not.toBeNull();
    expect(r!.get('X')).toEqual(atom('foo'));
  });

  it('binds a variable to a variable (transitively)', () => {
    let r: Bindings | null = unify(variable('X'), variable('Y'), empty);
    r = unify(variable('Y'), atom('foo'), r!);
    expect(walk(variable('X'), r!)).toEqual(atom('foo'));
  });

  it('same-name variables unify with no new bindings', () => {
    const r = unify(variable('X'), variable('X'), empty);
    expect(r!.size).toBe(0);
  });

  it('walks through binding chains', () => {
    let r: Bindings = new Map();
    r = new Map(r).set('X', variable('Y'));
    r = new Map(r).set('Y', variable('Z'));
    r = new Map(r).set('Z', atom('end'));
    expect(walk(variable('X'), r)).toEqual(atom('end'));
  });
});

describe('unify() — compound terms', () => {
  it('unifies same-shape compounds element-wise', () => {
    const r = unify(
      compound('foo', variable('X'), atom('b')),
      compound('foo', atom('a'), variable('Y')),
      empty,
    );
    expect(r).not.toBeNull();
    expect(walk(variable('X'), r!)).toEqual(atom('a'));
    expect(walk(variable('Y'), r!)).toEqual(atom('b'));
  });

  it('different functors fail', () => {
    expect(unify(compound('foo', atom('a')), compound('bar', atom('a')), empty)).toBeNull();
  });

  it('different arities fail', () => {
    expect(unify(compound('foo', atom('a')), compound('foo', atom('a'), atom('b')), empty)).toBeNull();
  });

  it('lists unify element-wise', () => {
    const r = unify(list(variable('X'), variable('Y')), list(num(1), num(2)), empty);
    expect(walk(variable('X'), r!)).toEqual(num(1));
    expect(walk(variable('Y'), r!)).toEqual(num(2));
  });

  it('list pattern with tail variable', () => {
    // [H | T] = [1, 2, 3]  →  H=1, T=[2, 3]
    const pattern = compound('.', variable('H'), variable('T'));
    const r = unify(pattern, list(num(1), num(2), num(3)), empty);
    expect(walk(variable('H'), r!)).toEqual(num(1));
    expect(show(walkDeep(variable('T'), r!))).toBe('[2, 3]');
  });
});

describe('unify() — occurs check', () => {
  it('without occurs check, X = foo(X) succeeds (creates infinite term)', () => {
    const r = unify(variable('X'), compound('foo', variable('X')), empty, false);
    expect(r).not.toBeNull();
  });

  it('with occurs check, X = foo(X) fails', () => {
    const r = unify(variable('X'), compound('foo', variable('X')), empty, true);
    expect(r).toBeNull();
  });
});

describe('walkDeep()', () => {
  it('substitutes recursively into compounds', () => {
    let b: Bindings = new Map();
    b = new Map(b).set('X', variable('Y'));
    b = new Map(b).set('Y', atom('hello'));
    const t = compound('wrap', variable('X'));
    expect(walkDeep(t, b)).toEqual(compound('wrap', atom('hello')));
  });
});
