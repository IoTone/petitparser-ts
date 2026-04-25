import { describe, expect, it } from 'vitest';

import { Parser } from '../../src/core/parser.ts';
import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';

describe('Parser', () => {
  it('parse() returns a discriminated Result', () => {
    const result = char('a').parse('a');
    expect(result.kind).toBe('success');
    if (result.kind === 'success') expect(result.value).toBe('a');
  });

  it('accept() returns true on success, false on failure', () => {
    const p = char('a');
    expect(p.accept('a')).toBe(true);
    expect(p.accept('b')).toBe(false);
    expect(p.accept('')).toBe(false);
  });

  it('children defaults to empty for leaf parsers', () => {
    expect(digit().children).toEqual([]);
  });

  it('Parser.constructor is the abstract base — subclass to instantiate', () => {
    expect(typeof Parser).toBe('function');
  });
});
