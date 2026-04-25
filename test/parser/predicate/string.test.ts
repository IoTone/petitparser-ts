import { describe, expect, it } from 'vitest';

import { string } from '../../../src/parser/predicate/string.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('string()', () => {
  it('matches the exact literal', () => {
    const p = string('foo');
    expectSuccess(p, 'foo', 'foo');
    expectFailure(p, '');
    expectFailure(p, 'f');
    expectFailure(p, 'fo');
    expectFailure(p, 'Foo');
  });

  it('with ignoreCase: matches mixed case, returns input casing', () => {
    const p = string('foo', { ignoreCase: true });
    expectSuccess(p, 'foo', 'foo');
    expectSuccess(p, 'FOO', 'FOO');
    expectSuccess(p, 'fOo', 'fOo');
    expectFailure(p, '');
    expectFailure(p, 'f');
  });

  it('respects custom message', () => {
    const p = string('foo', { message: 'foo!' });
    expectFailure(p, '', 0, 'foo!');
  });

  it('fastParseOn returns the stop position', () => {
    expect(string('abc').fastParseOn('abcdef', 0)).toBe(3);
    expect(string('abc').fastParseOn('xabcdef', 1)).toBe(4);
    expect(string('abc').fastParseOn('xx', 0)).toBe(-1);
    expect(string('AbC', { ignoreCase: true }).fastParseOn('abcdef', 0)).toBe(3);
  });
});
