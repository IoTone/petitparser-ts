import { describe, expect, it } from 'vitest';

import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import {
  plusSeparated,
  repeatSeparated,
  SeparatedList,
  starSeparated,
  timesSeparated,
} from '../../../src/parser/repeater/separated.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('SeparatedList', () => {
  it('enforces invariant separators.length === elements.length - 1', () => {
    expect(() => new SeparatedList(['a', 'b'], [])).toThrow();
    expect(() => new SeparatedList(['a'], [','])).toThrow();
    expect(new SeparatedList<string, string>([], []).elements).toEqual([]);
  });

  it('interleaved() yields elements and separators in source order', () => {
    const list = new SeparatedList(['a', 'b', 'c'], [',', ';']);
    expect([...list.interleaved()]).toEqual(['a', ',', 'b', ';', 'c']);
  });
});

describe('starSeparated', () => {
  const p = starSeparated(digit(), char(','));

  it('matches zero elements with empty list', () => {
    expectSuccess(p, '', new SeparatedList([], []), 0);
    expectSuccess(p, 'x', new SeparatedList([], []), 0);
  });
  it('matches one element', () => {
    expectSuccess(p, '1', new SeparatedList(['1'], []));
  });
  it('matches multiple elements with separators', () => {
    expectSuccess(p, '1,2,3', new SeparatedList(['1', '2', '3'], [',', ',']));
  });
  it('does not consume a trailing separator', () => {
    expectSuccess(p, '1,2,', new SeparatedList(['1', '2'], [',']), 3);
  });
});

describe('plusSeparated', () => {
  const p = plusSeparated(digit(), char(','));

  it('requires at least one element', () => {
    expectFailure(p, '', 0, 'digit expected');
    expectFailure(p, 'x', 0, 'digit expected');
  });
  it('matches single', () => {
    expectSuccess(p, '1', new SeparatedList(['1'], []));
  });
  it('matches many', () => {
    expectSuccess(p, '1,2,3,4', new SeparatedList(['1', '2', '3', '4'], [',', ',', ',']));
  });
});

describe('timesSeparated / repeatSeparated', () => {
  it('timesSeparated requires exactly n', () => {
    const p = timesSeparated(digit(), char(','), 3);
    expectSuccess(p, '1,2,3', new SeparatedList(['1', '2', '3'], [',', ',']));
    // After matching 3 elements, the parser stops without trying for a 4th.
    expectSuccess(p, '1,2,3,4', new SeparatedList(['1', '2', '3'], [',', ',']), 5);
  });
  it('repeatSeparated honors min/max', () => {
    const p = repeatSeparated(digit(), char(','), 2, 3);
    expectFailure(p, '1', 1, '"," expected');
    expectSuccess(p, '1,2', new SeparatedList(['1', '2'], [',']));
    expectSuccess(p, '1,2,3', new SeparatedList(['1', '2', '3'], [',', ',']));
  });
});
