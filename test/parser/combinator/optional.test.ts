import { describe, it } from 'vitest';

import { char } from '../../../src/parser/character/char.ts';
import { optional } from '../../../src/parser/combinator/optional.ts';
import { expectSuccess } from '../../_helpers.ts';

describe('optional()', () => {
  it('returns the value on match', () => {
    expectSuccess(optional(char('a')), 'a', 'a');
  });

  it('returns undefined on miss, position unchanged', () => {
    expectSuccess(optional(char('a')), 'b', undefined, 0);
    expectSuccess(optional(char('a')), '', undefined, 0);
  });

  it('returns the explicit fallback when provided', () => {
    expectSuccess(optional(char('a'), 'X'), 'b', 'X', 0);
    expectSuccess(optional(char('a'), 0), '', 0, 0);
  });
});
