import { describe, it } from 'vitest';

import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { and } from '../../../src/parser/combinator/and.ts';
import { end } from '../../../src/parser/combinator/end.ts';
import { neg } from '../../../src/parser/combinator/neg.ts';
import { not } from '../../../src/parser/combinator/not.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('and() (positive lookahead)', () => {
  it('succeeds with the inner value, position unchanged', () => {
    expectSuccess(and(char('a')), 'a', 'a', 0);
  });
  it('fails when the inner fails', () => {
    expectFailure(and(char('a')), 'b', 0, '"a" expected');
    expectFailure(and(char('a')), '', 0, '"a" expected');
  });
});

describe('not() (negative lookahead)', () => {
  it('succeeds with undefined when the inner fails', () => {
    expectSuccess(not(char('a'), { message: 'not a expected' }), 'b', undefined, 0);
    expectSuccess(not(char('a')), '', undefined, 0);
  });
  it('fails with message when the inner succeeds', () => {
    expectFailure(not(char('a'), { message: 'not a expected' }), 'a', 0, 'not a expected');
  });
});

describe('neg() (consuming negation)', () => {
  it('consumes one char when inner would fail', () => {
    expectSuccess(neg(digit(), { message: 'no digit expected' }), 'a', 'a');
    expectSuccess(neg(digit()), ' ', ' ');
  });
  it('fails when inner succeeds, or at EOF', () => {
    expectFailure(neg(digit(), { message: 'no digit expected' }), '1', 0, 'no digit expected');
    expectFailure(neg(digit(), { message: 'no digit expected' }), '9', 0, 'no digit expected');
    expectFailure(neg(digit()), '', 0, 'input expected');
  });
});

describe('end() (combinator wrapper)', () => {
  it('succeeds on full-input match', () => {
    expectSuccess(end(char('a')), 'a', 'a');
  });
  it('fails when leftover input remains', () => {
    expectFailure(end(char('a')), 'aa', 1, 'end of input expected');
  });
  it('propagates the inner failure', () => {
    expectFailure(end(char('a')), '', 0, '"a" expected');
  });
});
