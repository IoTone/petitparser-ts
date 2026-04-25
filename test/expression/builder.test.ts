import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { ExpressionBuilder } from '../../src/expression/builder.ts';
import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';
import { letter } from '../../src/parser/character/letter.ts';

const number = digit().plus().flatten().trim().map(Number);

describe('ExpressionBuilder primitives + groups', () => {
  it('returns the primitive when no groups are added', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    const p = builder.build();
    expect(p.parse(' 42 ').kind).toBe('success');
    if (p.parse('42').kind === 'success') {
      expect(p.parse('42').kind === 'success' && (p.parse('42') as { value: number }).value).toBe(42);
    }
  });

  it('throws if primitive() is called twice', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    expect(() => builder.primitive(number)).toThrow();
  });

  it('throws if build() is called without primitive()', () => {
    const builder = new ExpressionBuilder<number>();
    expect(() => builder.build()).toThrow();
  });
});

describe('ExpressionBuilder — wrappers', () => {
  it('wraps with parens, recursing through loopback', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().wrapper(char('(').trim(), char(')').trim(), (_l, v, _r) => v);
    const p = builder.build();
    const r = p.parse('(42)');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(42);
  });
});

describe('ExpressionBuilder — prefix and postfix', () => {
  it('prefix unary minus', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().prefix(char('-').trim(), (_, v) => -v);
    const p = builder.build();
    const r = p.parse('-5');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(-5);
  });

  it('postfix factorial', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().postfix(char('!').trim(), (v, _) => factorial(v));
    const p = builder.build();
    const r = p.parse('5!');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(120);
  });

  it('stacked prefix operators are applied right-to-left', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().prefix(char('-').trim(), (_, v) => -v);
    const p = builder.build();
    const r = p.parse('--5');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(5); // --5 = 5
  });
});

describe('ExpressionBuilder — left-associative binary', () => {
  it('handles left-associativity correctly: 1 - 2 - 3 = -4', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().left(char('-').trim(), (l, _, r) => l - r);
    const p = builder.build();
    const r = p.parse('1 - 2 - 3');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(-4); // (1-2)-3
  });
});

describe('ExpressionBuilder — right-associative binary', () => {
  it('handles right-associativity correctly: 2^3^2 = 512', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().right(char('^').trim(), (l, _, r) => l ** r);
    const p = builder.build();
    const r = p.parse('2^3^2');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(512); // 2^(3^2) = 2^9 = 512
  });

  it('mixed right-associative chain: 2^2^3 = 256', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().right(char('^').trim(), (l, _, r) => l ** r);
    const p = builder.build();
    const r = p.parse('2^2^3');
    if (r.kind === 'success') expect(r.value).toBe(256); // 2^(2^3) = 2^8 = 256
    else throw new Error(r.message);
  });
});

describe('ExpressionBuilder — full math grammar (Phase 4 exit criterion)', () => {
  // 30-line math grammar: +, -, *, /, ^ (right-assoc), unary -, parens.
  function build() {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    // Lowest precedence: + -
    builder.group()
      .left(char('+').trim(), (l, _, r) => l + r)
      .left(char('-').trim(), (l, _, r) => l - r);
    // Next: * /
    builder.group()
      .left(char('*').trim(), (l, _, r) => l * r)
      .left(char('/').trim(), (l, _, r) => l / r);
    // Next: ^ (right-assoc)
    builder.group().right(char('^').trim(), (l, _, r) => l ** r);
    // Highest: unary - and parens (these compete at the leaf level).
    builder.group()
      .prefix(char('-').trim(), (_, v) => -v)
      .wrapper(char('(').trim(), char(')').trim(), (_l, v, _r) => v);
    return builder.build();
  }

  const expr = build();
  const cases: Array<[string, number]> = [
    ['1', 1],
    ['1 + 2', 3],
    ['1 + 2 + 3', 6],
    ['1 - 2 - 3', -4],
    ['2 * 3', 6],
    ['1 + 2 * 3', 7],
    ['2 * 3 + 4', 10],
    ['(1 + 2) * 3', 9],
    ['10 - 2 * 3', 4],
    ['10 / 2 / 5', 1],
    ['2^3', 8],
    ['2^3^2', 512],
    ['-5', -5],
    ['-(2 + 3)', -5],
    ['1 - -1', 2],
    // Unary minus is at higher precedence than `^` in this grammar — i.e.
    // `-2^2` parses as `(-2)^2 = 4`. Standard-math convention `-2^2 = -4`
    // would require unary minus to be at lower precedence than `^`. Either
    // is valid; the builder does what the precedence ordering says.
    ['-2^2', 4],
    ['((1 + 2) * (3 + 4))', 21],
    ['1 + 2 * 3 - 4 / 2', 5],
  ];

  for (const [input, expected] of cases) {
    it(`evaluates "${input}" = ${String(expected)}`, () => {
      const r = expr.parse(input);
      expect(r.kind).toBe('success');
      if (r.kind === 'success') expect(r.value).toBe(expected);
    });
  }

  it('fails on garbage', () => {
    expect(expr.end().parse('1 + 2 x').kind).toBe('failure');
  });
});

describe('ExpressionBuilder — loopback exposes the topmost parser', () => {
  it('is settable from before .build() and resolves once build is called', () => {
    const builder = new ExpressionBuilder<number>();
    builder.primitive(number);
    builder.group().left(char('+').trim(), (l, _, r) => l + r);
    // Capture loopback before build()
    const lb = builder.loopback;
    builder.build();
    const r = lb.parse('1 + 2');
    if (r.kind === 'success') expect(r.value).toBe(3);
    else throw new Error(r.message);
  });
});

describe('ExpressionBuilder — optional group', () => {
  it('allows the level to fall through when its operators do not match', () => {
    // Grammar: identifier OR identifier '+' identifier (the second is optional).
    type V = string | { left: string; right: string };
    const id = letter().plus().flatten().trim();
    const builder = new ExpressionBuilder<V>();
    builder.primitive(id);
    builder
      .group()
      .left(char('+').trim(), (l, _, r) => ({ left: l as string, right: r as string }))
      .optional();
    const p = builder.build();
    const r1 = p.parse('foo');
    if (r1.kind === 'success') expect(r1.value).toBe('foo');
    else throw new Error(r1.message);
    const r2 = p.parse('foo + bar');
    if (r2.kind === 'success') expect(r2.value).toEqual({ left: 'foo', right: 'bar' });
    else throw new Error(r2.message);
  });
});

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
