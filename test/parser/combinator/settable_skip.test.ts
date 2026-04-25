import { describe, expect, it } from 'vitest';

import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { whitespace } from '../../../src/parser/character/whitespace.ts';
import { or } from '../../../src/parser/combinator/or.ts';
import { seq } from '../../../src/parser/combinator/seq.ts';
import { settable, SettableParser } from '../../../src/parser/combinator/settable.ts';
import { skip } from '../../../src/parser/combinator/skip.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('settable() — forward references for recursive grammars', () => {
  it('placeholder fails before .set()', () => {
    const p = settable<string>('not yet defined');
    expectFailure(p, 'x', 0, 'not yet defined');
  });

  it('after .set() it behaves like the installed parser', () => {
    const p: SettableParser<string> = settable<string>();
    p.set(char('a'));
    expectSuccess(p, 'a', 'a');
    expectFailure(p, 'b', 0, '"a" expected');
  });

  it('supports recursive references via the settable forward-decl pattern', () => {
    // Recursive grammar: nested parens around a digit. Without forward refs we
    // couldn't reference `expr` before defining it.
    //   expr := digit | '(' expr ')'
    const expr = settable<unknown>();
    expr.set(or(digit(), seq(char('('), expr, char(')'))));
    expectSuccess(expr, '5', '5');
    expectSuccess(expr, '(5)', ['(', '5', ')']);
    expectSuccess(expr, '((5))', ['(', ['(', '5', ')'], ')']);
    // selectLast (default) reports the most recent inner failure: the nested
    // expr's failure to find a '(' at position 1.
    expectFailure(expr, '(', 1, '"(" expected');
  });

  it('exposes SettableParser type', () => {
    const p: SettableParser<string> = settable<string>();
    p.set(char('z'));
    expect(p).toBeInstanceOf(SettableParser);
  });
});

describe('skip()', () => {
  it('discards before/after, returns the inner value', () => {
    const p = skip(char('a'), { before: whitespace(), after: whitespace() });
    expectSuccess(p, ' a ', 'a');
  });

  it('with only before', () => {
    const p = skip(char('a'), { before: whitespace() });
    expectSuccess(p, ' a', 'a');
  });

  it('with only after', () => {
    const p = skip(char('a'), { after: whitespace() });
    expectSuccess(p, 'a ', 'a');
  });

  it('fails when inner fails', () => {
    expectFailure(skip(char('a'), { before: whitespace() }), ' b', 1, '"a" expected');
  });
});
