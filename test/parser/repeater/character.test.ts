import { describe, expect, it } from 'vitest';

import { digit } from '../../../src/parser/character/digit.ts';
import {
  plusString,
  repeatString,
  starString,
  timesString,
} from '../../../src/parser/repeater/character.ts';
import type { CharacterParser } from '../../../src/parser/character/character_parser.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

const digits = digit() as CharacterParser;

describe('starString(char)', () => {
  it('returns the matched substring', () => {
    expectSuccess(starString(digits), '', '', 0);
    expectSuccess(starString(digits), 'abc', '', 0);
    expectSuccess(starString(digits), '123', '123');
    expectSuccess(starString(digits), '12abc', '12', 2);
  });
});

describe('plusString(char)', () => {
  it('requires at least one match', () => {
    expectFailure(plusString(digits), '', 0, 'digit expected');
    expectFailure(plusString(digits), 'abc', 0, 'digit expected');
    expectSuccess(plusString(digits), '1', '1');
    expectSuccess(plusString(digits), '12345', '12345');
  });
});

describe('timesString / repeatString', () => {
  it('timesString requires exactly n', () => {
    const p = timesString(digits, 2);
    expectFailure(p, '', 0, 'digit expected');
    expectFailure(p, '1', 0, 'digit expected');
    expectSuccess(p, '12', '12');
    expectSuccess(p, '123', '12', 2);
  });
  it('repeatString honors min/max', () => {
    const p = repeatString(digits, 1, 3);
    expectFailure(p, '', 0, 'digit expected');
    expectSuccess(p, '1', '1');
    expectSuccess(p, '12', '12');
    expectSuccess(p, '123', '123');
    expectSuccess(p, '1234', '123', 3);
  });
});

describe('fast path performance characteristic', () => {
  it('produces a string, not an array', () => {
    expect(typeof starString(digits).parse('123').kind).toBe('string'); // smoke
    const r = starString(digits).parse('123');
    if (r.kind === 'success') expect(typeof r.value).toBe('string');
  });
});
