import { describe, expect, it } from 'vitest';

import { epsilon } from '../../src/core/parser.ts';

describe('EpsilonParser', () => {
  it('succeeds at position 0 with undefined value on empty input', () => {
    const result = epsilon().parse('');
    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.value).toBeUndefined();
      expect(result.position).toBe(0);
      expect(result.buffer).toBe('');
    }
  });

  it('succeeds without consuming input', () => {
    const result = epsilon().parse('abc');
    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.position).toBe(0);
      expect(result.buffer).toBe('abc');
    }
  });

  it('fastParseOn returns the same position', () => {
    expect(epsilon().fastParseOn('abc', 2)).toBe(2);
  });
});
