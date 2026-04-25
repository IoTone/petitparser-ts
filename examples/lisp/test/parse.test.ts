import { describe, expect, it } from 'vitest';

import { LispGrammar, show, type LispValue } from '../src/index.ts';

const lisp = new LispGrammar().build();

function parse(input: string): LispValue[] {
  const r = lisp.parse(input);
  if (r.kind !== 'success') throw new Error(`parse failed: ${r.message} at ${String(r.position)}`);
  return r.value;
}

function parseOne(input: string): LispValue {
  const forms = parse(input);
  if (forms.length !== 1) throw new Error(`expected 1 form, got ${String(forms.length)}`);
  return forms[0]!;
}

describe('Lisp parser — atoms', () => {
  it('numbers', () => {
    expect(parseOne('42')).toEqual({ kind: 'number', value: 42 });
    expect(parseOne('-7')).toEqual({ kind: 'number', value: -7 });
    expect(parseOne('3.14')).toEqual({ kind: 'number', value: 3.14 });
  });

  it('booleans', () => {
    expect(parseOne('#t')).toEqual({ kind: 'boolean', value: true });
    expect(parseOne('#f')).toEqual({ kind: 'boolean', value: false });
  });

  it('symbols (broad char set)', () => {
    expect(parseOne('foo')).toEqual({ kind: 'symbol', name: 'foo' });
    expect(parseOne('+')).toEqual({ kind: 'symbol', name: '+' });
    expect(parseOne('list?')).toEqual({ kind: 'symbol', name: 'list?' });
    expect(parseOne('*global*')).toEqual({ kind: 'symbol', name: '*global*' });
    expect(parseOne('->')).toEqual({ kind: 'symbol', name: '->' });
  });

  it('strings', () => {
    expect(parseOne('"hello"')).toEqual({ kind: 'string', value: 'hello' });
    expect(parseOne('"a\\nb"')).toEqual({ kind: 'string', value: 'a\nb' });
    expect(parseOne('""')).toEqual({ kind: 'string', value: '' });
  });
});

describe('Lisp parser — lists', () => {
  it('empty list parses as nil', () => {
    expect(parseOne('()')).toEqual({ kind: 'nil' });
  });

  it('flat list', () => {
    expect(show(parseOne('(1 2 3)'))).toBe('(1 2 3)');
  });

  it('nested list', () => {
    expect(show(parseOne('(define (square x) (* x x))'))).toBe('(define (square x) (* x x))');
  });

  it('mixed types', () => {
    expect(show(parseOne('(if #t "yes" "no")'))).toBe('(if #t "yes" "no")');
  });
});

describe("Lisp parser — quote shorthand `'x`", () => {
  it('expands to (quote x)', () => {
    expect(show(parseOne("'foo"))).toBe('(quote foo)');
    expect(show(parseOne("'(1 2 3)"))).toBe('(quote (1 2 3))');
  });
});

describe('Lisp parser — comments and whitespace', () => {
  it('skips ; line comments', () => {
    const result = parse('; comment\n(+ 1 2) ; trailing\n');
    expect(result).toHaveLength(1);
    expect(show(result[0]!)).toBe('(+ 1 2)');
  });

  it('handles tabs and newlines as whitespace', () => {
    expect(show(parseOne('(\n\t1\n\t2\n)'))).toBe('(1 2)');
  });
});

describe('Lisp parser — multiple top-level forms', () => {
  it('returns each form in order', () => {
    const forms = parse('(define x 1)\n(define y 2)\n(+ x y)');
    expect(forms).toHaveLength(3);
    expect(show(forms[0]!)).toBe('(define x 1)');
    expect(show(forms[2]!)).toBe('(+ x y)');
  });
});

describe('Lisp parser — invalid input', () => {
  it.each(['(', ')', '"unterminated', '(1 2'])('rejects %j', (input) => {
    expect(lisp.parse(input).kind).toBe('failure');
  });
});
