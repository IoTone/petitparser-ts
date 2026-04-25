import { describe, expect, it } from 'vitest';

import {
  defaultEnv,
  evaluateAll,
  LispGrammar,
  show,
  type Env,
  type LispValue,
} from '../src/index.ts';

const lisp = new LispGrammar().build();

function run(input: string, env: Env = defaultEnv()): LispValue {
  const r = lisp.parse(input);
  if (r.kind !== 'success') throw new Error(`parse failed: ${r.message}`);
  return evaluateAll(r.value, env);
}

describe('Lisp evaluator — primitives and arithmetic', () => {
  it('self-evaluating values', () => {
    expect(show(run('42'))).toBe('42');
    expect(show(run('"hello"'))).toBe('"hello"');
    expect(show(run('#t'))).toBe('#t');
  });

  it('addition', () => {
    expect(show(run('(+ 1 2 3)'))).toBe('6');
    expect(show(run('(+)'))).toBe('0');
  });

  it('subtraction', () => {
    expect(show(run('(- 10 3 2)'))).toBe('5');
    expect(show(run('(- 5)'))).toBe('-5');
  });

  it('multiplication', () => {
    expect(show(run('(* 2 3 4)'))).toBe('24');
    expect(show(run('(*)'))).toBe('1');
  });

  it('division', () => {
    expect(show(run('(/ 12 3 2)'))).toBe('2');
    expect(show(run('(/ 4)'))).toBe('0.25');
  });
});

describe('Lisp evaluator — comparisons', () => {
  it.each<[string, string]>([
    ['(= 1 1)', '#t'],
    ['(= 1 2)', '#f'],
    ['(< 1 2 3)', '#t'],
    ['(< 1 3 2)', '#f'],
    ['(> 3 2 1)', '#t'],
    ['(<= 1 1 2)', '#t'],
    ['(>= 3 3 2)', '#t'],
  ])('%s = %s', (input, expected) => {
    expect(show(run(input))).toBe(expected);
  });
});

describe('Lisp evaluator — special forms', () => {
  it('quote returns its arg unevaluated', () => {
    expect(show(run("'(1 2 3)"))).toBe('(1 2 3)');
    expect(show(run('(quote foo)'))).toBe('foo');
  });

  it('if', () => {
    expect(show(run('(if #t 1 2)'))).toBe('1');
    expect(show(run('(if #f 1 2)'))).toBe('2');
    expect(show(run('(if 0 "truthy" "falsy")'))).toBe('"truthy"'); // Scheme: 0 is truthy
  });

  it('define + symbol lookup', () => {
    const env = defaultEnv();
    run('(define x 42)', env);
    expect(show(run('x', env))).toBe('42');
    run('(define greeting "hi")', env);
    expect(show(run('greeting', env))).toBe('"hi"');
  });

  it('lambda + closure', () => {
    const env = defaultEnv();
    run('(define square (lambda (x) (* x x)))', env);
    expect(show(run('(square 5)', env))).toBe('25');
    expect(show(run('(square (square 3))', env))).toBe('81');
  });

  it('lambda captures enclosing scope', () => {
    const env = defaultEnv();
    run('(define adder (lambda (n) (lambda (x) (+ x n))))', env);
    run('(define add5 (adder 5))', env);
    expect(show(run('(add5 10)', env))).toBe('15');
    expect(show(run('(add5 -2)', env))).toBe('3');
  });

  it('let creates a local scope', () => {
    expect(show(run('(let ((x 2) (y 3)) (* x y))'))).toBe('6');
  });

  it('cond with else fallthrough', () => {
    const program = `(define grade
      (lambda (n)
        (cond ((>= n 90) "A")
              ((>= n 80) "B")
              ((>= n 70) "C")
              (else "F"))))`;
    const env = defaultEnv();
    run(program, env);
    expect(show(run('(grade 95)', env))).toBe('"A"');
    expect(show(run('(grade 75)', env))).toBe('"C"');
    expect(show(run('(grade 50)', env))).toBe('"F"');
  });

  it('begin sequences forms', () => {
    expect(show(run('(begin 1 2 3)'))).toBe('3');
  });

  it('set! mutates an existing binding', () => {
    const env = defaultEnv();
    run('(define x 1)', env);
    run('(set! x 99)', env);
    expect(show(run('x', env))).toBe('99');
  });
});

describe('Lisp evaluator — list operations', () => {
  it('cons / car / cdr', () => {
    expect(show(run('(cons 1 (list 2 3))'))).toBe('(1 2 3)');
    expect(show(run("(car '(a b c))"))).toBe('a');
    expect(show(run("(cdr '(a b c))"))).toBe('(b c)');
    expect(show(run("(cdr '(a))"))).toBe('()');
  });

  it('null? and pair?', () => {
    expect(show(run("(null? '())"))).toBe('#t');
    expect(show(run("(null? '(1))"))).toBe('#f');
    expect(show(run("(pair? '(1))"))).toBe('#t');
    expect(show(run("(pair? '())"))).toBe('#f');
  });

  it('recursive list operations: length', () => {
    const program = `
      (define length
        (lambda (lst)
          (if (null? lst)
              0
              (+ 1 (length (cdr lst))))))`;
    const env = defaultEnv();
    run(program, env);
    expect(show(run("(length '(1 2 3 4 5))", env))).toBe('5');
    expect(show(run("(length '())", env))).toBe('0');
  });

  it('higher-order: map', () => {
    const program = `
      (define map
        (lambda (f lst)
          (if (null? lst)
              '()
              (cons (f (car lst)) (map f (cdr lst))))))`;
    const env = defaultEnv();
    run(program, env);
    run('(define inc (lambda (x) (+ x 1)))', env);
    expect(show(run("(map inc '(1 2 3))", env))).toBe('(2 3 4)');
  });
});

describe('Lisp evaluator — recursion sanity (factorial)', () => {
  it('computes factorial', () => {
    const env = defaultEnv();
    run('(define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))', env);
    expect(show(run('(fact 0)', env))).toBe('1');
    expect(show(run('(fact 5)', env))).toBe('120');
    expect(show(run('(fact 10)', env))).toBe('3628800');
  });
});

describe('Lisp evaluator — error cases', () => {
  it('unbound symbol', () => {
    expect(() => run('undefined-symbol')).toThrow(/unbound/);
  });

  it('not a function', () => {
    expect(() => run('(42 1 2)')).toThrow(/not a function/);
  });

  it('arity mismatch', () => {
    expect(() => run('((lambda (x) x) 1 2)')).toThrow(/expected 1/);
  });
});
