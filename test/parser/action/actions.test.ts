import { describe, expect, it } from 'vitest';

import '../../../src/parser/_fluent/index.ts';

import { Token } from '../../../src/core/token.ts';
import { cast } from '../../../src/parser/action/cast.ts';
import { castList } from '../../../src/parser/action/cast_list.ts';
import { constant } from '../../../src/parser/action/constant.ts';
import { flatten } from '../../../src/parser/action/flatten.ts';
import { labeled } from '../../../src/parser/action/labeled.ts';
import { map } from '../../../src/parser/action/map.ts';
import { permute } from '../../../src/parser/action/permute.ts';
import { pick } from '../../../src/parser/action/pick.ts';
import { token } from '../../../src/parser/action/token.ts';
import { trim } from '../../../src/parser/action/trim.ts';
import { where } from '../../../src/parser/action/where.ts';
import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { letter } from '../../../src/parser/character/letter.ts';
import { seq } from '../../../src/parser/combinator/seq.ts';
import { plus } from '../../../src/parser/repeater/possessive.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('map()', () => {
  it('transforms the parsed value on success', () => {
    const p = map(digit(), (s) => Number(s));
    expectSuccess(p, '5', 5);
    expectSuccess(p, '9', 9);
  });
  it('propagates failures unchanged', () => {
    expectFailure(map(digit(), Number), 'a', 0, 'digit expected');
  });
});

describe('pick(n)', () => {
  it('returns the indexed element', () => {
    expectSuccess(pick(seq(digit(), letter()), 1), '1a', 'a');
  });
  it('handles negative indexes', () => {
    expectSuccess(pick(seq(digit(), letter()), -1), '1a', 'a');
    expectSuccess(pick(seq(digit(), letter()), -2), '1a', '1');
  });
});

describe('permute(indexes)', () => {
  it('reorders the array', () => {
    expectSuccess(permute(seq(digit(), letter()), [1, 0]), '1a', ['a', '1']);
  });
  it('supports negative indexes', () => {
    expectSuccess(permute(seq(digit(), letter()), [-1, 0]), '1a', ['a', '1']);
  });
});

describe('flatten()', () => {
  it('returns the matched substring', () => {
    expectSuccess(flatten(plus(digit())), '1', '1');
    expectSuccess(flatten(plus(digit())), '12', '12');
    expectSuccess(flatten(plus(digit())), '12345', '12345');
  });
  it('propagates inner failure (default), or replaces with custom message', () => {
    expectFailure(flatten(plus(digit())), 'a', 0, 'digit expected');
    expectFailure(flatten(plus(digit()), { message: 'number expected' }), 'a', 0, 'number expected');
  });
});

describe('token()', () => {
  it('wraps the value in a Token with start/stop/length/input', () => {
    const p = trim(token(flatten(plus(digit()))));
    const result = p.parse('  123 ');
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    const t = result.value;
    expect(t).toBeInstanceOf(Token);
    expect(t.value).toBe('123');
    expect(t.start).toBe(2);
    expect(t.stop).toBe(5);
    expect(t.length).toBe(3);
    expect(t.input).toBe('123');
    expect(t.toString()).toBe('Token[start: 2, stop: 5, value: 123]');
  });
});

describe('trim()', () => {
  it('skips whitespace before and after', () => {
    expectSuccess(trim(char('a')), '   a   ', 'a');
    expectSuccess(trim(char('a')), 'a', 'a');
  });
  it('uses a custom trimmer', () => {
    expectSuccess(trim(char('a'), char('-')), '---a---', 'a');
  });
  it('uses asymmetric trimmers when provided', () => {
    expectSuccess(trim(char('a'), char('-'), char('+')), '---a+++', 'a');
  });
});

describe('cast() / castList()', () => {
  it('cast() is a runtime no-op', () => {
    const p = cast<string>(digit());
    expectSuccess(p, '5', '5');
  });
  it('castList() is a runtime no-op', () => {
    const p = castList<string>(seq(digit(), letter()));
    expectSuccess(p, '1a', ['1', 'a']);
  });
});

describe('constant()', () => {
  it('replaces the value', () => {
    expectSuccess(constant(digit(), 'X'), '5', 'X');
  });
});

describe('where()', () => {
  const p = where(digit(), (s) => Number(s) >= 5);
  it('passes through when predicate accepts', () => {
    expectSuccess(p, '5', '5');
    expectSuccess(p, '9', '9');
  });
  it('fails when predicate rejects, at the position after the inner consumed', () => {
    expectFailure(p, '4', 1);
  });
  it('uses a custom failure factory', () => {
    const q = where(digit(), (s) => Number(s) >= 5, {
      failureFactory: (v) => `${v} is too small`,
    });
    expectFailure(q, '4', 1, '4 is too small');
  });
});

describe('labeled()', () => {
  it('preserves behavior, sets the name', () => {
    const p = labeled(digit(), 'my-digit');
    expectSuccess(p, '5', '5');
    expect(p.toString()).toBe('LabelParser[my-digit]');
  });
});
