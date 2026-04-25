import { describe, expect, it } from 'vitest';

import { char } from '../../../src/parser/character/char.ts';
import { plus, repeat, star, times } from '../../../src/parser/repeater/possessive.ts';
import { UNBOUNDED } from '../../../src/parser/repeater/repeating.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('star() (zero-or-more)', () => {
  it('matches zero matches with empty array', () => {
    expectSuccess(star(char('a')), '', [], 0);
    expectSuccess(star(char('a')), 'b', [], 0);
  });
  it('matches one or more', () => {
    expectSuccess(star(char('a')), 'a', ['a']);
    expectSuccess(star(char('a')), 'aa', ['a', 'a']);
    expectSuccess(star(char('a')), 'aaa', ['a', 'a', 'a']);
  });
  it('stops at the first non-match (no backtrack)', () => {
    expectSuccess(star(char('a')), 'aab', ['a', 'a'], 2);
  });
});

describe('plus() (one-or-more)', () => {
  it('requires at least one match', () => {
    expectFailure(plus(char('a')), '', 0, '"a" expected');
    expectFailure(plus(char('a')), 'b', 0, '"a" expected');
    expectSuccess(plus(char('a')), 'a', ['a']);
    expectSuccess(plus(char('a')), 'aaa', ['a', 'a', 'a']);
  });
});

describe('times(n) (exactly-n)', () => {
  it('requires exactly n matches', () => {
    const p = times(char('a'), 2);
    expectFailure(p, '', 0, '"a" expected');
    expectFailure(p, 'a', 1, '"a" expected');
    expectSuccess(p, 'aa', ['a', 'a']);
    expectSuccess(p, 'aaa', ['a', 'a'], 2);
  });
});

describe('repeat(min, max)', () => {
  it('matches between min and max', () => {
    const p = repeat(char('a'), 2, 3);
    expectFailure(p, '', 0, '"a" expected');
    expectFailure(p, 'a', 1, '"a" expected');
    expectSuccess(p, 'aa', ['a', 'a']);
    expectSuccess(p, 'aaa', ['a', 'a', 'a']);
    expectSuccess(p, 'aaaa', ['a', 'a', 'a'], 3);
  });
});

describe('UNBOUNDED', () => {
  it('exports the upper-limit sentinel', () => {
    expect(UNBOUNDED).toBe(Number.MAX_SAFE_INTEGER);
  });
});
