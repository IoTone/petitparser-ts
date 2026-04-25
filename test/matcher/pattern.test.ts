import { describe, expect, it } from 'vitest';

import { toPattern } from '../../src/matcher/pattern.ts';
import { digit } from '../../src/parser/character/digit.ts';

describe('toPattern()', () => {
  it('exec() returns successive non-overlapping matches', () => {
    const p = toPattern(digit());
    const m1 = p.exec('a1b2c3');
    expect(m1?.value).toBe('1');
    expect(m1?.start).toBe(1);
    const m2 = p.exec('a1b2c3');
    expect(m2?.value).toBe('2');
    expect(m2?.start).toBe(3);
    const m3 = p.exec('a1b2c3');
    expect(m3?.value).toBe('3');
    expect(m3?.start).toBe(5);
    const m4 = p.exec('a1b2c3');
    expect(m4).toBeNull();
  });

  it('lastIndex can be reset to rewind', () => {
    const p = toPattern(digit());
    p.exec('1234');
    p.exec('1234');
    p.lastIndex = 0;
    const m = p.exec('1234');
    expect(m?.value).toBe('1');
  });

  it('bind(input) enables for...of iteration', () => {
    const p = toPattern(digit()).bind('a1b2c3');
    const collected = [...p].map((m) => m.value);
    expect(collected).toEqual(['1', '2', '3']);
  });

  it('iterating without binding throws', () => {
    const p = toPattern(digit());
    expect(() => [...p]).toThrow(/bind/);
  });
});
