import { describe, expect, it } from 'vitest';

import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { letter } from '../../../src/parser/character/letter.ts';
import { seq } from '../../../src/parser/combinator/seq.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('seq() — variadic free function', () => {
  it('matches each child in order, tuples the results', () => {
    expectSuccess(seq(char('a'), char('b')), 'ab', ['a', 'b']);
    expectSuccess(seq(digit(), letter(), digit()), '1a2', ['1', 'a', '2']);
  });

  it('fails at the first failing child, propagating its position', () => {
    expectFailure(seq(char('a'), char('b')), 'ax', 1, '"b" expected');
    expectFailure(seq(digit(), letter()), '12', 1, 'letter expected');
  });

  it('fails at end-of-input mid-sequence', () => {
    expectFailure(seq(char('a'), char('b')), 'a', 1, '"b" expected');
  });

  it('fastParseOn returns the post-sequence position', () => {
    expect(seq(char('a'), char('b')).fastParseOn('abc', 0)).toBe(2);
    expect(seq(char('a'), char('b')).fastParseOn('axc', 0)).toBe(-1);
  });

  it('zero-arg sequence succeeds at the start position with empty value', () => {
    expectSuccess(seq(), 'anything', [], 0);
  });
});
