import { describe, it } from 'vitest';

import { anyOf } from '../../../src/parser/character/anyOf.ts';
import { noneOf } from '../../../src/parser/character/noneOf.ts';
import { predicate } from '../../../src/parser/character/predicate.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('anyOf()', () => {
  it('matches any character in the set', () => {
    const p = anyOf('ab');
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'b', 'b');
    expectFailure(p, 'c');
    expectFailure(p, '');
  });

  it('handles longer sets via binary search', () => {
    const p = anyOf('aeiou');
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'u', 'u');
    expectFailure(p, 'b');
  });
});

describe('noneOf()', () => {
  it('matches any character NOT in the set', () => {
    const p = noneOf('ab');
    expectSuccess(p, 'c', 'c');
    expectSuccess(p, 'z', 'z');
    expectFailure(p, 'a');
    expectFailure(p, 'b');
    expectFailure(p, '');
  });
});

describe('predicate()', () => {
  it('accepts a custom test function', () => {
    const p = predicate((code) => code === 0x21 /* '!' */, { message: 'bang expected' });
    expectSuccess(p, '!', '!');
    expectFailure(p, '?', 0, 'bang expected');
  });
});
