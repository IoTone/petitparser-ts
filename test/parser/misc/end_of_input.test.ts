import { describe, expect, it } from 'vitest';

import { endOfInput } from '../../../src/parser/misc/end_of_input.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('endOfInput()', () => {
  it('succeeds on empty input', () => {
    expectSuccess(endOfInput(), '', undefined);
  });

  it('fails when input remains', () => {
    expectFailure(endOfInput(), 'a', 0, 'end of input expected');
  });

  it('fastParseOn returns position at end, -1 elsewhere', () => {
    const p = endOfInput();
    expect(p.fastParseOn('abc', 3)).toBe(3);
    expect(p.fastParseOn('abc', 0)).toBe(-1);
  });
});
