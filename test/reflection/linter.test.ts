import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';
import { or } from '../../src/parser/combinator/or.ts';
import { seq } from '../../src/parser/combinator/seq.ts';
import { settable } from '../../src/parser/combinator/settable.ts';
import {
  LeftRecursionRule,
  UnresolvedSettableRule,
  linter,
} from '../../src/reflection/linter.ts';

describe('linter() — LeftRecursionRule', () => {
  it('catches direct left recursion (Phase 5 exit criterion)', () => {
    // Grammar: expr := expr + digit | digit  (direct left-recursion)
    const expr = settable<unknown>();
    expr.set(or(seq(expr, char('+'), digit()), digit()));
    const issues = linter(expr, { rules: [LeftRecursionRule] });
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues.some((i) => i.title === 'left recursion' && i.type === 'error')).toBe(true);
  });

  it('catches indirect left recursion via two productions', () => {
    // a := b 'x' | digit ; b := a 'y' | digit
    const a = settable<unknown>();
    const b = settable<unknown>();
    a.set(or(seq(b, char('x')), digit()));
    b.set(or(seq(a, char('y')), digit()));
    const issues = linter(a, { rules: [LeftRecursionRule] });
    expect(issues.some((i) => i.title === 'left recursion')).toBe(true);
  });

  it('does not flag a non-recursive grammar', () => {
    const p = seq(digit(), char('+'), digit());
    const issues = linter(p, { rules: [LeftRecursionRule] });
    expect(issues).toEqual([]);
  });

  it('does not flag right-recursive grammars (recursion is not on the leftmost path)', () => {
    // expr := digit '+' expr | digit  (right-recursive — fine)
    const expr = settable<unknown>();
    expr.set(or(seq(digit(), char('+'), expr), digit()));
    const issues = linter(expr, { rules: [LeftRecursionRule] });
    expect(issues).toEqual([]);
  });
});

describe('linter() — UnresolvedSettableRule', () => {
  it('flags a settable that was never set()', () => {
    const forgotten = settable<unknown>();
    const issues = linter(forgotten, { rules: [UnresolvedSettableRule] });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.title).toBe('unresolved settable');
  });

  it('does not flag a properly-resolved settable', () => {
    const p = settable<string>();
    p.set(char('a'));
    const issues = linter(p, { rules: [UnresolvedSettableRule] });
    expect(issues).toEqual([]);
  });
});

describe('linter() default rule set', () => {
  it('runs all rules when no explicit list is given', () => {
    const a = settable<unknown>();
    a.set(or(seq(a, char('+'), digit()), digit()));
    const issues = linter(a);
    // Should at least catch left recursion.
    expect(issues.some((i) => i.title === 'left recursion')).toBe(true);
  });
});
