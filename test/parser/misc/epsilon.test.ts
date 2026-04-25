import { describe, expect, it } from 'vitest';

import { epsilon, epsilonWith } from '../../../src/parser/misc/epsilon.ts';
import { expectSuccess } from '../../_helpers.ts';

describe('epsilon()', () => {
  it('succeeds at position 0 with undefined value on any input', () => {
    expectSuccess(epsilon(), '', undefined, 0);
    expectSuccess(epsilon(), 'abc', undefined, 0);
  });

  it('fastParseOn returns the same position', () => {
    expect(epsilon().fastParseOn('abc', 2)).toBe(2);
  });
});

describe('epsilonWith()', () => {
  it('returns the supplied value with the supplied type', () => {
    expectSuccess(epsilonWith(42), 'anything', 42, 0);
    expectSuccess(epsilonWith({ kind: 'tagged' }), '', { kind: 'tagged' }, 0);
  });
});
