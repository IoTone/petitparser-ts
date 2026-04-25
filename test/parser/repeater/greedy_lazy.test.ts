import { describe, it } from 'vitest';

import { digit } from '../../../src/parser/character/digit.ts';
import { word } from '../../../src/parser/character/word.ts';
import { plusGreedy, repeatGreedy, starGreedy } from '../../../src/parser/repeater/greedy.ts';
import { plusLazy, repeatLazy, starLazy } from '../../../src/parser/repeater/lazy.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

// These mirror the legacy QUnit cases for plusGreedy/plusLazy/repeatGreedy/repeatLazy.

describe('plusGreedy(word, digit)', () => {
  const p = plusGreedy(word(), digit());

  it('requires the limit to eventually succeed', () => {
    expectFailure(p, '', 0, 'letter or digit expected');
    expectFailure(p, 'a', 1, 'digit expected');
    expectFailure(p, 'ab', 1, 'digit expected');
    expectFailure(p, '1', 1, 'digit expected');
  });

  it('consumes greedily, walks back to satisfy limit', () => {
    expectSuccess(p, 'a1', ['a'], 1);
    expectSuccess(p, 'ab1', ['a', 'b'], 2);
    expectSuccess(p, 'abc1', ['a', 'b', 'c'], 3);
    expectSuccess(p, '12', ['1'], 1);
    expectSuccess(p, 'a12', ['a', '1'], 2);
    expectSuccess(p, 'abc12', ['a', 'b', 'c', '1'], 4);
    expectSuccess(p, 'abc123', ['a', 'b', 'c', '1', '2'], 5);
  });
});

describe('plusLazy(word, digit)', () => {
  const p = plusLazy(word(), digit());

  it('requires the limit to eventually succeed', () => {
    expectFailure(p, '');
    expectFailure(p, 'a', 1, 'digit expected');
    expectFailure(p, '1', 1, 'digit expected');
  });

  it('consumes lazily, stops at first limit success', () => {
    expectSuccess(p, 'a1', ['a'], 1);
    expectSuccess(p, 'ab1', ['a', 'b'], 2);
    expectSuccess(p, '12', ['1'], 1);
    expectSuccess(p, 'a12', ['a'], 1);
    expectSuccess(p, 'abc12', ['a', 'b', 'c'], 3);
  });
});

describe('repeatGreedy(word, digit, 2, 4)', () => {
  const p = repeatGreedy(word(), digit(), 2, 4);

  it('honors min/max bounds with greedy + walk-back', () => {
    expectSuccess(p, 'ab1', ['a', 'b'], 2);
    expectSuccess(p, 'abcd1', ['a', 'b', 'c', 'd'], 4);
    expectSuccess(p, 'abcd12', ['a', 'b', 'c', 'd'], 4);
    // After 'abcde' (5 word chars), limit-aware walkback caps at max=4
    expectFailure(p, 'abcde1', 2, 'digit expected');
  });
});

describe('repeatLazy(word, digit, 2, 4)', () => {
  const p = repeatLazy(word(), digit(), 2, 4);

  it('takes the minimum that lets limit succeed', () => {
    expectSuccess(p, 'ab1', ['a', 'b'], 2);
    expectSuccess(p, 'a12', ['a', '1'], 2);
    expectSuccess(p, 'ab12', ['a', 'b'], 2);
    expectSuccess(p, 'abcd12', ['a', 'b', 'c', 'd'], 4);
  });
});

describe('starGreedy / starLazy with min=0', () => {
  it('starGreedy walks back from max consumption to satisfy limit', () => {
    // '12': greedy consumes both word chars, walks back to position 1 where
    // '2' satisfies the digit limit. Result: ['1'] at position 1.
    expectSuccess(starGreedy(word(), digit()), '12', ['1'], 1);
  });

  it('starLazy stops at first limit success', () => {
    // '12': lazy consumes nothing first, tries limit at 0 — '1' is a digit.
    // Result: [] at position 0.
    expectSuccess(starLazy(word(), digit()), '12', [], 0);
  });
});
