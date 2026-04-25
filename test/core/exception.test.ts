import { describe, expect, it } from 'vitest';

import { ParserException } from '../../src/core/exception.ts';

describe('ParserException', () => {
  it('wraps a Failure and exposes it', () => {
    const failure = {
      kind: 'failure' as const,
      buffer: 'abc',
      position: 1,
      message: 'digit expected',
    };
    const ex = new ParserException(failure);
    expect(ex.failure).toBe(failure);
    expect(ex.name).toBe('ParserException');
    expect(ex.message).toContain('digit expected');
    expect(ex.message).toContain('1');
    expect(ex).toBeInstanceOf(Error);
  });
});
