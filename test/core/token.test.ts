import { describe, expect, it } from 'vitest';

import { Token } from '../../src/core/token.ts';

describe('Token', () => {
  it('exposes value, buffer, start, stop, length, input', () => {
    const token = new Token('hello', 'say hello world', 4, 9);
    expect(token.value).toBe('hello');
    expect(token.buffer).toBe('say hello world');
    expect(token.start).toBe(4);
    expect(token.stop).toBe(9);
    expect(token.length).toBe(5);
    expect(token.input).toBe('hello');
  });

  it('toString includes start, stop, value', () => {
    expect(new Token(123, 'xx', 1, 4).toString()).toBe('Token[start: 1, stop: 4, value: 123]');
  });

  describe('lineAndColumnOf', () => {
    it('returns 1,1 at the start of input', () => {
      expect(Token.lineAndColumnOf('hello', 0)).toEqual([1, 1]);
    });

    it('counts \\n newlines', () => {
      const buffer = 'a\nb\nc';
      expect(Token.lineAndColumnOf(buffer, 0)).toEqual([1, 1]);
      expect(Token.lineAndColumnOf(buffer, 1)).toEqual([1, 2]);
      expect(Token.lineAndColumnOf(buffer, 2)).toEqual([2, 1]);
      expect(Token.lineAndColumnOf(buffer, 4)).toEqual([3, 1]);
    });

    it('counts \\r and \\r\\n as one line break each', () => {
      // Mirrors the legacy QUnit test: '1\r12\r\n123\n1234' -> lines [1,1,2,2,2,2,3,3,3,3,4,4,4,4]
      const buffer = '1\r12\r\n123\n1234';
      const lines = [...buffer].map((_, i) => Token.lineAndColumnOf(buffer, i)[0]);
      expect(lines).toEqual([1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]);
    });

    it('produces the matching column sequence', () => {
      const buffer = '1\r12\r\n123\n1234';
      const cols = [...buffer].map((_, i) => Token.lineAndColumnOf(buffer, i)[1]);
      expect(cols).toEqual([1, 2, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]);
    });
  });
});
