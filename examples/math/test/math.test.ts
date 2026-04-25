import { describe, expect, it } from 'vitest';

import { buildMathParser } from '../src/grammar.ts';

const expr = buildMathParser().end();

function evalAt(input: string): number {
  const r = expr.parse(input);
  if (r.kind !== 'success') throw new Error(`parse failed: ${r.message} at ${String(r.position)}`);
  return r.value;
}

describe('Math example — arithmetic evaluation', () => {
  it.each<[string, number]>([
    ['1', 1],
    ['1 + 2', 3],
    ['1 + 2 + 3', 6],
    ['1 - 2 - 3', -4],
    ['2 * 3', 6],
    ['1 + 2 * 3', 7],
    ['2 * 3 + 4', 10],
    ['(1 + 2) * 3', 9],
    ['10 - 2 * 3', 4],
    ['10 / 2 / 5', 1],
    ['2^3', 8],
    ['2^3^2', 512],
    ['-5', -5],
    ['-(2 + 3)', -5],
    ['1 - -1', 2],
    ['((1 + 2) * (3 + 4))', 21],
    ['1 + 2 * 3 - 4 / 2', 5],
  ])('evaluates %s = %d', (input, expected) => {
    expect(evalAt(input)).toBe(expected);
  });
});

describe('Math example — failures', () => {
  it.each(['', '1 +', '1 + 2 x', '*', '(1 + 2'])('rejects %j', (input) => {
    const r = expr.parse(input);
    expect(r.kind).toBe('failure');
  });
});
