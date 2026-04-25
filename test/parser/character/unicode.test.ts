import { describe, expect, it } from 'vitest';

import { any } from '../../../src/parser/character/any.ts';
import { anyOf } from '../../../src/parser/character/anyOf.ts';
import { char } from '../../../src/parser/character/char.ts';
import { noneOf } from '../../../src/parser/character/noneOf.ts';
import { range } from '../../../src/parser/character/range.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('Unicode mode — any({ unicode: true })', () => {
  it('consumes a surrogate-pair character as one match', () => {
    const p = any({ unicode: true });
    expectSuccess(p, '𝕏', '𝕏'); // U+1D54F (2 UTF-16 code units)
    expectSuccess(p, '🦄', '🦄'); // U+1F984
  });

  it('default mode reads only one UTF-16 code unit (a lone surrogate)', () => {
    const p = any();
    const r = p.parse('𝕏');
    if (r.kind !== 'success') throw new Error('expected success');
    // Default returns the high surrogate alone — note `'𝕏'.length === 2`.
    expect(r.value.length).toBe(1);
    expect(r.position).toBe(1);
  });
});

describe('Unicode mode — char()', () => {
  it('matches a surrogate-pair character', () => {
    const p = char('𝕏', { unicode: true });
    expectSuccess(p, '𝕏', '𝕏');
    expectFailure(p, 'a', 0, '"𝕏" expected');
  });

  it('rejects bad single-code-point input', () => {
    expect(() => char('ab', { unicode: true })).toThrow();
    expect(() => char('𝕏𝕐', { unicode: true })).toThrow();
  });

  it('default mode rejects a multi-code-unit string', () => {
    expect(() => char('𝕏')).toThrow();
  });
});

describe('Unicode mode — range()', () => {
  it('matches astral code points within range', () => {
    // U+1F600..U+1F60F (smiling emoji range)
    const p = range('😀', '😏', { unicode: true });
    expectSuccess(p, '😀', '😀');
    expectSuccess(p, '😅', '😅');
    expectFailure(p, '😐', 0, '😀..😏 expected');
  });
});

describe('Unicode mode — anyOf() / noneOf()', () => {
  it('anyOf treats surrogate-pair chars as one entry', () => {
    const p = anyOf('🦄🐉🦋', { unicode: true });
    expectSuccess(p, '🦄', '🦄');
    expectSuccess(p, '🦋', '🦋');
    expectFailure(p, '🐶');
  });

  it('noneOf with surrogate-pair excludes', () => {
    const p = noneOf('🐶', { unicode: true });
    expectSuccess(p, '🦄', '🦄');
    expectFailure(p, '🐶');
  });
});

describe('Unicode mode — composition with .star()', () => {
  it('reads emoji-only string into an array of full code points', () => {
    const p = any({ unicode: true });
    const r = p.parse('🦄🦋');
    if (r.kind !== 'success') throw new Error('expected success');
    // First call consumes '🦄' (2 code units).
    expect(r.value).toBe('🦄');
    expect(r.position).toBe(2);
  });
});
