// `this.ref0(this.method)` is THE upstream-Dart grammar pattern — eslint's
// unbound-method rule warns about passing methods as values, but `ref0`
// rebinds via `.call(this)` so the warning is a false positive across the
// entire grammar surface. Disable for this whole file.
/* eslint-disable @typescript-eslint/unbound-method */

import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import type { Parser } from '../../src/core/parser.ts';
import { GrammarDefinition } from '../../src/definition/grammar.ts';
import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';

/**
 * Phase 3 exit-criterion grammar: a recursive arithmetic expression that
 * evaluates `+` and `*` with proper precedence, allows `(...)` grouping, and
 * trims whitespace.
 *
 *   expr   := term ('+' expr)?
 *   term   := factor ('*' term)?
 *   factor := number | '(' expr ')'
 *   number := digit+
 */
class ArithGrammar extends GrammarDefinition<number> {
  override start(): Parser<number> {
    return this.ref0(this.expr).end();
  }

  expr(): Parser<number> {
    return this.ref0(this.term)
      .seq(char('+').trim().seq(this.ref0(this.expr)).optional())
      .map(([left, rest]) => (rest === undefined ? left : left + rest[1]));
  }

  term(): Parser<number> {
    return this.ref0(this.factor)
      .seq(char('*').trim().seq(this.ref0(this.term)).optional())
      .map(([left, rest]) => (rest === undefined ? left : left * rest[1]));
  }

  factor(): Parser<number> {
    return this.ref0(this.number).or(
      // `.pick(1)` would lose the tuple type to `string | number`; use `.map`
      // to keep `Parser<number>`. Both reach the same runtime result.
      char('(').trim().seq(this.ref0(this.expr), char(')').trim()).map(([, value]) => value),
    );
  }

  number(): Parser<number> {
    return digit().plus().flatten().trim().map(Number);
  }
}

describe('GrammarDefinition (recursive arithmetic grammar)', () => {
  const grammar = new ArithGrammar();
  const arith = grammar.build();

  it('parses a single number', () => {
    const r = arith.parse('42');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(42);
  });

  it('parses addition', () => {
    const r = arith.parse('1 + 2 + 3');
    if (r.kind === 'success') expect(r.value).toBe(6);
    else throw new Error(`expected success, got ${r.message}`);
  });

  it('parses multiplication', () => {
    const r = arith.parse('2 * 3 * 4');
    if (r.kind === 'success') expect(r.value).toBe(24);
    else throw new Error(`expected success, got ${r.message}`);
  });

  it('respects operator precedence: 1 + 2 * 3 = 7', () => {
    const r = arith.parse('1 + 2 * 3');
    if (r.kind === 'success') expect(r.value).toBe(7);
    else throw new Error(`expected success, got ${r.message}`);
  });

  it('respects parentheses: (1 + 2) * 3 = 9', () => {
    const r = arith.parse('(1 + 2) * 3');
    if (r.kind === 'success') expect(r.value).toBe(9);
    else throw new Error(`expected success, got ${r.message}`);
  });

  it('handles nested parentheses', () => {
    const r = arith.parse('((1 + 2) * (3 + 4))');
    if (r.kind === 'success') expect(r.value).toBe(21);
    else throw new Error(`expected success, got ${r.message}`);
  });

  it('fails on incomplete input', () => {
    const r = arith.parse('1 +');
    expect(r.kind).toBe('failure');
  });

  it('fails on garbage suffix (end() check)', () => {
    const r = arith.parse('1 + 2 x');
    expect(r.kind).toBe('failure');
  });

  it('memoizes productions per (grammar, method)', () => {
    // build() returns the same SettableParser placeholder each time it's called
    // on the same instance — confirms memoization works.
    expect(grammar.build()).toBe(grammar.build());
    // A fresh grammar instance has its own cache.
    const other = new ArithGrammar();
    expect(other.build()).not.toBe(grammar.build());
  });

  it('buildFrom() lets you exercise a single production', () => {
    const numberOnly = grammar.buildFrom(grammar.ref0(grammar.number));
    const r = numberOnly.parse(' 42 ');
    if (r.kind === 'success') expect(r.value).toBe(42);
    else throw new Error(`expected success, got ${r.message}`);
  });
});
