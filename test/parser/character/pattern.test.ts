import { describe, it } from 'vitest';

import { pattern } from '../../../src/parser/character/pattern.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('pattern()', () => {
  it('with single chars', () => {
    const p = pattern('abc');
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'b', 'b');
    expectSuccess(p, 'c', 'c');
    expectFailure(p, 'd', 0, '[abc] expected');
    expectFailure(p, '', 0, '[abc] expected');
  });

  it('with a range', () => {
    const p = pattern('a-c');
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'b', 'b');
    expectSuccess(p, 'c', 'c');
    expectFailure(p, 'd', 0, '[a-c] expected');
  });

  it('with composed singles, ranges, and trailing literal hyphen', () => {
    const p = pattern('ac-df-');
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'c', 'c');
    expectSuccess(p, 'd', 'd');
    expectSuccess(p, 'f', 'f');
    expectSuccess(p, '-', '-');
    expectFailure(p, 'b', 0, '[ac-df-] expected');
    expectFailure(p, 'e', 0, '[ac-df-] expected');
    expectFailure(p, 'g', 0, '[ac-df-] expected');
  });

  it('with negated single', () => {
    const p = pattern('^a');
    expectSuccess(p, 'b', 'b');
    expectFailure(p, 'a', 0, '[^a] expected');
    expectFailure(p, '', 0, '[^a] expected');
  });

  it('with negated range', () => {
    const p = pattern('^a-c');
    expectSuccess(p, 'd', 'd');
    expectFailure(p, 'a', 0, '[^a-c] expected');
    expectFailure(p, 'b', 0, '[^a-c] expected');
    expectFailure(p, 'c', 0, '[^a-c] expected');
  });
});
