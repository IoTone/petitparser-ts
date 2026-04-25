import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { allMatches } from '../../src/matcher/matches.ts';
import { digit } from '../../src/parser/character/digit.ts';
import { flatten } from '../../src/parser/action/flatten.ts';
import { seq } from '../../src/parser/combinator/seq.ts';

describe('allMatches()', () => {
  it('finds non-overlapping matches across the input', () => {
    const p = flatten(seq(digit(), digit()));
    const matches = [...allMatches(p, 'a123b45')];
    expect(matches.map((m) => m.value)).toEqual(['12', '45']);
    expect(matches.map((m) => m.start)).toEqual([1, 5]);
  });

  it('returns the whole input when the parser matches the whole input', () => {
    const matches = [...allMatches(digit(), '123')];
    expect(matches.map((m) => m.value)).toEqual(['1', '2', '3']);
    expect(matches.map((m) => m.start)).toEqual([0, 1, 2]);
  });

  it('with overlapping=true, every position is tried', () => {
    const p = flatten(seq(digit(), digit()));
    const matches = [...allMatches(p, '12345', { overlapping: true })];
    expect(matches.map((m) => m.value)).toEqual(['12', '23', '34', '45']);
  });

  it('respects the start option', () => {
    const matches = [...allMatches(digit(), 'abc123', { start: 3 })];
    expect(matches.map((m) => m.value)).toEqual(['1', '2', '3']);
    expect(matches[0]?.start).toBe(3);
  });

  it('returns nothing when nothing matches', () => {
    expect([...allMatches(digit(), 'abc')]).toEqual([]);
  });
});
